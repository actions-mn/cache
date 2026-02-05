/**
 * Cache settings interface for the metanorma-cache action
 */

export interface ICacheSettings {
  /**
   * Path to metanorma.yml manifest file
   * If empty, only system assets will be cached
   */
  readonly cacheSiteForManifest: string;

  /**
   * Additional directories that affect metanorma build
   * All paths relative to cacheSiteForManifest
   */
  readonly extraInput: string;

  /**
   * Path to the output site directory
   */
  readonly cacheSitePath: string;
}

/**
 * Cache result interface
 */
export interface ICacheResult {
  /**
   * Cache key used
   */
  readonly key: string;

  /**
   * Whether the cache was hit
   */
  readonly cacheHit?: boolean;
}
