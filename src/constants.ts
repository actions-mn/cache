/**
 * State constants for cache management
 */

export const CacheConstants = {
  SITE_CACHE_KEY_PREFIX: 'metanorma-site-cache-',
} as const;

/**
 * Individual cache groups for metanorma-related assets
 * Each group is cached independently to avoid cascading failures
 */
export const SYSTEM_CACHE_GROUPS = {
  metanorma: {
    key: 'metanorma-home',
    paths: ['~/.metanorma', '/root/.metanorma'],
  },
  relaton: {
    key: 'metanorma-relaton',
    paths: ['~/.relaton', '/root/.relaton'],
  },
  fontist: {
    key: 'metanorma-fontist',
    paths: ['~/.fontist', '/config/fonts', '/root/.fontist'],
  },
  workgroup: {
    key: 'metanorma-ietf-workgroup-cache',
    paths: [
      '~/.metanorma-ietf-workgroup-cache.json',
      '/root/.metanorma-ietf-workgroup-cache.json',
    ],
  },
} as const;

/**
 * @deprecated Use SYSTEM_CACHE_GROUPS instead - this will be removed in v3
 * Legacy system cache paths (kept for backward compatibility)
 */
export const SYSTEM_CACHE_PATHS = [
  '~/.metanorma',
  '/root/.metanorma',
  '~/.relaton',
  '/root/.relaton',
  '~/.fontist',
  '/config/fonts',
  '/root/.fontist',
  '~/.metanorma-ietf-workgroup-cache.json',
  '/root/.metanorma-ietf-workgroup-cache.json',
] as const;

/**
 * Output names for GitHub Actions
 */
export const Outputs = {
  CACHE_SITE_CACHE_HIT: 'cache-site-cache-hit',
  HASH: 'hash',
} as const;
