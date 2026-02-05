# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2026-02-04

### Added
- Migrated from composite to node20-based action
- TypeScript source with full type safety
- Comprehensive unit and integration tests
- ESLint, Prettier, CodeQL integration
- check-dist workflow to ensure dist/index.js is up to date

### Changed
- **BREAKING**: Now requires Node 20 runtime (included in GitHub Actions runners)
- All dependency versions are now pinned to latest compatible versions

### Fixed
- Issue #5: Unpinned versions for security/stability
- Removed unpinned `@actions/cache@v4`, `@actions/setup-node@v4`, `@actions/github-script@v7`

### Dependencies
- @actions/cache: ^3.2.4 (CommonJS compatible)
- @actions/core: ^1.11.1 (CommonJS compatible)
- glob: ^11.0.0 (replaces @actions/glob)
- yaml: ^2.8.2
- TypeScript: ^5.8.2
- Node.js: 20.x runtime

## [1.x] - Previous Releases

### Features
- Composite action using actions/cache@v4
- System asset caching for metanorma, fontist, relaton
- Site output caching with manifest-based hash generation
