# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2026-03-24

### Changed

- **BREAKING:** Requires Vite 8 (`^8.0.2`). Vite 7 is no longer supported.
- Replaced `rollup` type imports with `rolldown` to align with Vite 8's bundler migration

## [1.0.1] - 2026-01-26

### Changed

- README.md for additional information about when to use critical CSS

## [1.0.0] - 2026-01-25 - Initial Release

### Added

- Initial release
- Dev mode: Generates Liquid snippet with `<link>` and `<script>` tags pointing to Vite dev server
- Production mode: Generates Liquid snippet using Shopify's `inline_asset_content` filter
- Support for CSS preprocessors (SCSS, SASS, Less, Stylus, PostCSS)
- Support for JavaScript/TypeScript critical files
- Full HMR support in development
- Automatic detection of critical files via `critical-` filename prefix
- Configurable options: `entrypointsDir`, `snippetFile`, `themeRoot`
