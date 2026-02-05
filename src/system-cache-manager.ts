/**
 * System cache manager for metanorma-related assets
 */

import * as cache from '@actions/cache';
import * as core from '@actions/core';
import { SYSTEM_CACHE_PATHS, CacheConstants } from './constants';

/**
 * Cache system assets (metanorma, fontist, relaton)
 *
 * @returns Cache result
 */
export async function cacheSystemAssets(): Promise<void> {
  core.startGroup('Cache system assets');

  try {
    const result = await cache.saveCache(
      [...SYSTEM_CACHE_PATHS],
      CacheConstants.SYSTEM_CACHE_KEY
    );

    if (result !== -1) {
      core.info(
        `System cache saved with key: ${CacheConstants.SYSTEM_CACHE_KEY}`
      );
    }
  } catch (error) {
    // Cache save can fail if no cache entry exists yet
    if ((error as any)?.message?.includes('Cache service responded')) {
      core.info(
        'No existing system cache found, will create new cache on save'
      );
    } else {
      core.warning(
        `System cache save failed: ${(error as any)?.message ?? error}`
      );
    }
  }

  try {
    const restoredKey = await cache.restoreCache(
      [...SYSTEM_CACHE_PATHS],
      CacheConstants.SYSTEM_CACHE_KEY,
      [CacheConstants.SYSTEM_CACHE_RESTORE_KEY]
    );

    if (restoredKey) {
      core.info(`System cache restored from key: ${restoredKey}`);
    } else {
      core.info('System cache not found');
    }
  } catch (error) {
    core.warning(
      `System cache restore failed: ${(error as any)?.message ?? error}`
    );
  }

  core.endGroup();
}
