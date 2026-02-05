/**
 * State constants for cache management
 */

export const CacheConstants = {
  SYSTEM_CACHE_KEY: 'metanorma-cache',
  SYSTEM_CACHE_RESTORE_KEY: 'metanorma-cache',
  SITE_CACHE_KEY_PREFIX: 'metanorma-site-cache-',
} as const;

/**
 * System cache paths for metanorma-related assets
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
