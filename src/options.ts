/**
 * Options resolution for vite-plugin-shopify-critical.
 *
 * @packageDocumentation
 */

import type { ResolvedOptions, ShopifyCriticalOptions } from "./types";

/**
 * Resolves user options with defaults.
 *
 * @param options - User-provided options
 * @returns Resolved options with all defaults applied
 */
export function resolveOptions(
  options: ShopifyCriticalOptions
): ResolvedOptions {
  return {
    // Default to vite-plugin-shopify's default entrypointsDir
    entrypointsDir: options.entrypointsDir ?? "frontend/entrypoints",
    // Default snippet filename
    snippetFile: options.snippetFile ?? "vite-critical-tag.liquid",
    // Default to current directory
    themeRoot: options.themeRoot ?? "./",
  };
}
