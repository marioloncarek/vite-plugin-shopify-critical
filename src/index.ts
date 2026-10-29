/**
 * @packageDocumentation
 * Vite plugin for inlining critical CSS/JS in Shopify themes using `inline_asset_content`.
 *
 * @remarks
 * This plugin works alongside `vite-plugin-shopify`. Critical files must be prefixed
 * with "critical-" (e.g., `critical-theme.scss`). The plugin generates a Liquid snippet
 * that uses Shopify's `inline_asset_content` filter for optimal performance.
 *
 * @example
 * ```typescript
 * import { defineConfig } from "vite";
 * import shopify from "vite-plugin-shopify";
 * import shopifyCritical from "vite-plugin-shopify-critical";
 *
 * export default defineConfig({
 *   plugins: [
 *     shopify(),
 *     shopifyCritical(),
 *   ],
 * });
 * ```
 */

import fs from "node:fs";
import type { AddressInfo } from "node:net";
import path from "node:path";
import type { Plugin, ResolvedConfig, Rolldown } from "vite";
import { normalizePath } from "vite";

import {
  CRITICAL_FILENAME_REGEX,
  CRITICAL_PREFIX,
  PLUGIN_NAME,
} from "./constants";
import { resolveOptions } from "./options";
import type { CriticalFileMapping, ShopifyCriticalOptions } from "./types";
import { generateDevSnippetContent, generateProdSnippetContent } from "./utils";

/**
 * Finds the source filename for a critical asset from the bundle chunk.
 */
function findSourceFile(
  chunk: Rolldown.OutputAsset | Rolldown.OutputChunk,
  baseName: string,
  ext: string
): string {
  if (chunk.type === "asset") {
    const originalFiles = chunk.originalFileNames;
    const criticalOriginal = originalFiles.find(
      (f) => path.basename(f, path.extname(f)) === baseName
    );
    if (criticalOriginal) {
      return path.basename(criticalOriginal);
    }
  } else if (chunk.type === "chunk" && chunk.isEntry && chunk.facadeModuleId) {
    return path.basename(chunk.facadeModuleId);
  }

  // Fallback: construct source filename from output
  const sourceExt = ext === "css" ? ".scss" : ".ts";
  return `${baseName}${sourceExt}`;
}

/**
 * Resolve the dev server URL from the server address and configuration.
 * Adapted from vite-plugin-shopify.
 */
function resolveDevServerUrl(
  address: AddressInfo,
  config: ResolvedConfig
): string {
  const configHmrProtocol =
    typeof config.server.hmr === "object" ? config.server.hmr.protocol : null;

  let clientProtocol: string | null = null;
  if (configHmrProtocol) {
    clientProtocol = configHmrProtocol === "wss" ? "https" : "http";
  }

  const serverProtocol = config.server.https ? "https" : "http";
  const protocol = clientProtocol ?? serverProtocol;

  const configHmrHost =
    typeof config.server.hmr === "object" ? config.server.hmr.host : null;
  const configHost =
    typeof config.server.host === "string" ? config.server.host : null;
  const isIpv6 =
    address.family === "IPv6" ||
    // In node >=18.0 <18.4 this was an integer value
    // @ts-expect-error - Node version compatibility
    address.family === 6;
  const serverAddress = isIpv6 ? `[${address.address}]` : address.address;
  const host = configHmrHost ?? configHost ?? serverAddress;

  const configHmrClientPort =
    typeof config.server.hmr === "object" ? config.server.hmr.clientPort : null;
  const port = configHmrClientPort ?? address.port;

  return `${protocol}://${host}:${port}`;
}

/**
 * Creates the vite-plugin-shopify-critical plugin.
 *
 * @param options - Plugin configuration options
 * @returns Array of Vite plugins (dev and build)
 *
 * @remarks
 * Critical files must be prefixed with "critical-" (e.g., `critical-theme.scss`).
 * Place them in the same entrypoints folder as vite-plugin-shopify.
 *
 * @example
 * ```typescript
 * import shopifyCritical from "vite-plugin-shopify-critical";
 *
 * export default defineConfig({
 *   plugins: [
 *     shopifyCritical({
 *       entrypointsDir: "src/entrypoints",
 *     }),
 *   ],
 * });
 * ```
 *
 * @example
 * In Liquid templates:
 * ```liquid
 * {%- render 'vite-critical-tag', entry: 'critical-theme.scss' -%}
 * {%- render 'vite-critical-tag', entry: 'critical-app.ts' -%}
 * ```
 *
 * @public
 */
export default function shopifyCritical(
  options: ShopifyCriticalOptions = {}
): Plugin[] {
  const resolvedOptions = resolveOptions(options);

  // Store resolved config
  let config: ResolvedConfig;

  // Track source-to-output mappings for production
  let outputMappings: CriticalFileMapping[] = [];

  // Pre-compute paths
  const themeRootAbsolute = normalizePath(
    path.resolve(resolvedOptions.themeRoot)
  );
  const snippetsDir = normalizePath(path.join(themeRootAbsolute, "snippets"));
  const snippetPath = normalizePath(
    path.join(snippetsDir, resolvedOptions.snippetFile)
  );

  /**
   * Dev plugin - generates snippet with link/script tags pointing to Vite dev server.
   */
  const devPlugin: Plugin = {
    apply: "serve",

    configResolved(resolvedConfig) {
      config = resolvedConfig;
    },

    configureServer({ httpServer }) {
      httpServer?.once("listening", () => {
        const address = httpServer?.address();

        const isAddressInfo = (
          x: string | AddressInfo | null | undefined
        ): x is AddressInfo => typeof x === "object";

        if (isAddressInfo(address)) {
          const devServerUrl = resolveDevServerUrl(address, config);

          // Ensure snippets directory exists
          if (!fs.existsSync(snippetsDir)) {
            fs.mkdirSync(snippetsDir, { recursive: true });
          }

          // Generate and write dev snippet
          const snippetContent = generateDevSnippetContent(
            devServerUrl,
            resolvedOptions.entrypointsDir
          );
          fs.writeFileSync(snippetPath, snippetContent);
        }
      });
    },
    name: `${PLUGIN_NAME}:dev`,
  };

  /**
   * Build plugin - scans bundle for critical files and generates snippet with inline_asset_content.
   */
  const buildPlugin: Plugin = {
    apply: "build",
    enforce: "post",

    generateBundle(_, bundle) {
      outputMappings = [];

      // Scan bundle for files starting with "critical-"
      for (const [fileName, chunk] of Object.entries(bundle)) {
        if (!fileName.startsWith(CRITICAL_PREFIX)) {
          continue;
        }

        // Extract source filename from hashed output
        const match = fileName.match(CRITICAL_FILENAME_REGEX);
        if (!match) {
          continue;
        }

        // e.g., baseName "critical-theme", ext "css"
        const { baseName, ext } = match.groups as {
          baseName: string;
          ext: string;
        };
        const sourceFile = findSourceFile(chunk, baseName, ext);

        outputMappings.push({
          outputFile: fileName,
          sourceFile,
        });
      }
    },
    name: `${PLUGIN_NAME}:build`,

    writeBundle() {
      // Ensure snippets directory exists
      if (!fs.existsSync(snippetsDir)) {
        fs.mkdirSync(snippetsDir, { recursive: true });
      }

      // Generate and write production snippet
      const snippetContent = generateProdSnippetContent(outputMappings);
      fs.writeFileSync(snippetPath, snippetContent);
    },
  };

  return [devPlugin, buildPlugin];
}

// Re-export types for consumers
export type {
  CriticalFileMapping,
  ResolvedOptions,
  ShopifyCriticalOptions,
} from "./types";
