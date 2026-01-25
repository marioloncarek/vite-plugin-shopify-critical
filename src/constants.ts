/**
 * Constants used throughout the plugin.
 *
 * @packageDocumentation
 */

/** Plugin identifier used in logs and error messages. */
export const PLUGIN_NAME = "vite-plugin-shopify-critical";

/** Prefix that identifies critical assets. Files must start with this prefix. */
export const CRITICAL_PREFIX = "critical-";

/**
 * Regex to extract base name from hashed critical filenames.
 * Matches: "critical-theme-BxqFivnI.css" -> captures "critical-theme"
 * Uses fixed 8-character hash assumption from Vite.
 */
export const CRITICAL_FILENAME_REGEX =
  /^(critical-.+)-[A-Za-z0-9_-]{8}\.(css|js)$/;

/** CSS file extensions that compile to .css output. */
export const CSS_EXTENSIONS = [
  ".css",
  ".less",
  ".sass",
  ".scss",
  ".styl",
  ".stylus",
  ".pcss",
  ".postcss",
];
