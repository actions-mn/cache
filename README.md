[![GitHub tag (latest by date)](https://img.shields.io/github/v/tag/actions-mn/cache)](https://github.com/actions-mn/cache/releases)
[![test](https://github.com/actions-mn/cache/actions/workflows/test.yml/badge.svg)](https://github.com/actions-mn/cache/actions/workflows/test.yml)

# metanorma-cache

Cache metanorma-related assets to speed up CI builds.

## Features

- **System Asset Caching** - Always caches metanorma system directories
- **Site Output Caching** - Conditionally caches generated site output based on source files
- **Cross-Platform** - Works on Linux, macOS, and Windows runners
- **Type-Safe** - Written in TypeScript with full type definitions

## Usage

### Basic Usage (System Assets Only)

By default, this action caches metanorma system assets:

```yaml
- uses: actions-mn/cache@v2
```

This caches the following directories across both Docker and Ubuntu environments:
- `~/.metanorma` and `/root/.metanorma`
- `~/.fontist` and `/root/.fontist`
- `~/.relaton` and `/root/.relaton`
- `~/.metanorma-ietf-workgroup-cache.json` and `/root/.metanorma-ietf-workgroup-cache.json`

> **Note**: The action automatically detects which paths are accessible in your environment and only caches paths that exist. See [Runtime Environments](#runtime-environments) for details.

### Site Output Caching

To cache the generated site output based on your metanorma.yml manifest:

```yaml
- uses: actions-mn/cache@v2
  with:
    cache-site-for-manifest: metanorma.yml
```

This will:
1. Parse your `metanorma.yml` manifest file
2. Hash all source files listed in `metanorma.source.files`
3. Generate a cache key based on the file hashes
4. Cache the site output directory (default: `_site`)

### Advanced Configuration

```yaml
- uses: actions-mn/cache@v2
  with:
    cache-site-for-manifest: path/to/metanorma.yml
    extra-input: |
      assets
      templates
      config
    cache-site-path: site
```

## Inputs

| Input | Description | Default | Required |
|-------|-------------|---------|----------|
| `cache-site-for-manifest` | Path to metanorma.yml manifest file | `''` | No |
| `extra-input` | Comma/line separated directories affecting build (relative to manifest) | `''` | No |
| `cache-site-path` | Path to output site directory | `_site` | No |

## Outputs

| Output | Description |
|--------|-------------|
| `cache-site-cache-hit` | `"true"` if site cache was hit, `"false"` otherwise |

## How It Works

### Runtime Environments

Metanorma CI builds run in **two different environments**. This action handles both automatically:

#### Environment 1: GitHub Actions Ubuntu Runner

When running directly on GitHub Actions `ubuntu-latest` runners:

- **User**: `runner` (non-privileged user)
- **Home directory**: `/home/runner`
- **Accessible paths**:
  - `~/.metanorma` → `/home/runner/.metanorma` ✓
  - `~/.fontist` → `/home/runner/.fontist` ✓
  - `~/.relaton` → `/home/runner/.relaton` ✓
- **Inaccessible paths** (permission denied):
  - `/root/.metanorma` ✗
  - `/root/.fontist` ✗
  - `/root/.relaton` ✗

#### Environment 2: Metanorma Docker Container

When running inside Metanorma Docker containers (via `actions-mn/setup` or directly):

- **User**: `root` (or container user with root privileges)
- **Home directory**: `/root`
- **Accessible paths**:
  - `~/.metanorma` → `/root/.metanorma` ✓
  - `~/.fontist` → `/root/.fontist` ✓
  - `~/.relaton` → `/root/.relaton` ✓
  - `/root/.metanorma` ✓ (same as `~/.metanorma` in container)
  - `/root/.fontist` ✓
  - `/root/.relaton` ✓

#### Automatic Path Detection

This action **automatically detects which paths are accessible**:

1. Each cache path is checked for existence using `fs.existsSync()`
2. Inaccessible paths (like `/root/.metanorma` on Ubuntu runners) are silently skipped
3. Only accessible paths are included in cache operations
4. This prevents `EACCES: permission denied` errors

**Example** - On Ubuntu runner, only these paths are cached:
```bash
# Cached:
/home/runner/.metanorma
/home/runner/.fontist
/home/runner/.relaton

# Skipped (permission denied):
/root/.metanorma
/root/.fontist
/root/.relaton
```

**Example** - In Docker container, all paths are cached:
```bash
# Cached:
/root/.metanorma
/root/.fontist
/root/.relaton
```

### Two-Tier Caching

This action implements a two-tier caching strategy:

1. **System Cache (Always)** - Caches metanorma installation assets
   - Four independent cache entries (not one combined cache):
     - `metanorma-home` → `~/.metanorma`, `/root/.metanorma`
     - `metanorma-relaton` → `~/.relaton`, `/root/.relaton`
     - `metanorma-fontist` → `~/.fontist`, `/config/fonts`, `/root/.fontist`
     - `metanorma-ietf-workgroup-cache` → `~/.metanorma-ietf-workgroup-cache.json`, `/root/...`

2. **Site Cache (Conditional)** - Caches generated site output
   - Key: `metanorma-site-cache-{hash}`
   - Hash computed from source files in manifest
   - Only enabled when `cache-site-for-manifest` is provided

### Cache Key Generation

The site cache key is generated by:
1. Reading `metanorma.source.files` from the manifest
2. Extracting parent directories of each source file
3. Adding any `extra-input` directories
4. Computing SHA256 hash of all matched files

This ensures the cache is invalidated when any source file changes.

### Shared System Cache

The system cache (`metanorma-cache`) is **shared across all repositories** that use this action. This is intentional because:

- Metanorma fonts are universal and reusable across projects
- Fontist and Relaton caches contain generic data
- Sharing reduces overall cache storage and improves hit rates

**Note**: Your repository's site cache is **unique** to your project (based on your source file hashes).

## Example Workflow

```yaml
name: Build Metanorma Site

on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6

      - uses: actions-mn/setup@main

      - uses: actions-mn/cache@v2
        with:
          cache-site-for-manifest: metanorma.yml

      - uses: actions-mn/site-gen@main
        with:
          source-path: .
          config-file: metanorma.yml
          agree-to-terms: true
          output-dir: site
```

## Troubleshooting

### Cache Not Working

If caching doesn't seem to be working:

1. **Check the cache key**: Ensure your `metanorma.yml` file exists and has valid `source.files` entries
2. **Verify file paths**: All source files must exist relative to the manifest file location
3. **Check cache size**: GitHub Actions cache has a 10GB per repository limit

### Manifest Validation Errors

The action validates manifest files and will fail with clear error messages for:

- **Non-existent files**: `Manifest file "path/to/metanorma.yml" does not exist`
- **Wrong extension**: `Manifest file must have .yml or .yaml extension`
- **Path is directory**: `Path is a directory, not a file`
- **Home directory paths**: `Path starts with ~. Use "$HOME" instead`
- **Path traversal**: Paths containing `..` are rejected for security reasons

### Cache Miss After Source Changes

This is expected behavior. The cache key is computed from the hash of all source files. When any source file changes:

1. The hash changes
2. A new cache key is generated
3. Cache miss occurs and new output is built
4. New output is cached for future runs

### System Cache vs Site Cache

- **System Cache** (`~/.metanorma`, `~/.fontist`, `~/.relaton`) is always cached regardless of inputs
- **Site Cache** only runs when `cache-site-for-manifest` is provided
- If you only need system caching, use the action without any inputs

### Permissions Errors

The action requires no special permissions for basic caching. If you see permission errors:

- Ensure the workflow has `contents: read` permission (default on public repos)
- For private repos, you may need to explicitly set `permissions: contents: read`

**Note**: This action automatically handles permission errors for cache paths. Inaccessible paths (like `/root/.metanorma` on Ubuntu runners where the user is `runner`, not `root`) are silently skipped. You will see debug messages like:
```
Path does not exist, skipping: /root/.metanorma
```
This is **expected behavior** and not an error.

## Testing

### Automated Tests

This repository includes comprehensive tests:

| Test Type | Description | Location |
|-----------|-------------|----------|
| Unit Tests | Jest tests for action logic (mocked cache) | `__test__/*.test.ts` |
| Integration Tests | Real Metanorma builds on multiple OSes | `.github/workflows/test.yml` |
| Environment Tests | Docker vs Ubuntu runner scenarios | `.github/workflows/environments.yml` |

### Running Tests Locally

```bash
# Install dependencies
npm ci

# Run unit tests
npm test

# Run linting
npm run lint

# Run format check
npm run format-check

# Build production bundle
npm run build
```

### Test Scenarios Covered

The integration tests cover these scenarios:

1. **Cold Start (No Cache)** - First time running, no cache exists
2. **Warm Start (Cache Hit)** - Second run with cache from previous run
3. **Ubuntu Runner** - Running on GitHub Actions `ubuntu-latest` (user: `runner`)
4. **Docker Container** - Running inside Metanorma Docker (user: `root`)
5. **Cross-Platform** - Linux, macOS, Windows
6. **Site Cache** - Manifest-based site output caching
7. **System Cache Only** - Without manifest (just fonts/relaton)

## License

MIT
