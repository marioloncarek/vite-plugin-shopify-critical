/**
 * Type definitions for vite-plugin-shopify-critical.
 *
 * @packageDocumentation
 */

/**
 * Configuration options for the vite-plugin-shopify-critical plugin.
 *
 * @public
 */
export interface ShopifyCriticalOptions {
  /**
   * Path to the entrypoints folder (should match vite-plugin-shopify's entrypointsDir).
   * Critical files in this folder must be prefixed with "critical-".
   *
   * @defaultValue `"frontend/entrypoints"`
   */
  entrypointsDir?: string;

  /**
   * Name of the generated Liquid snippet file.
   *
   * @defaultValue `"vite-critical-tag.liquid"`
   */
  snippetFile?: string;

  /**
   * Shopify theme root directory.
   *
   * @defaultValue `"./"`
   */
  themeRoot?: string;
}

/**
 * Resolved plugin options with all defaults applied.
 *
 * @public
 */
export interface ResolvedOptions {
  /** Path to entrypoints folder. */
  entrypointsDir: string;
  /** Name of the generated snippet file. */
  snippetFile: string;
  /** Shopify theme root directory. */
  themeRoot: string;
}

/**
 * Mapping between source files and their compiled output.
 *
 * @public
 */
export interface CriticalFileMapping {
  /**
   * Output filename in assets folder.
   * @example `"critical-theme.css"` or `"critical-theme-a1b2c3d4.css"`
   */
  outputFile: string;
  /**
   * Source filename (used as entry name in Liquid render tag).
   * @example `"critical-theme.scss"`
   */
  sourceFile: string;
}
