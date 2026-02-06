/**
 * System cache manager for metanorma-related assets
 */

import * as cache from '@actions/cache';
import * as core from '@actions/core';
import * as fs from 'fs';
import { SYSTEM_CACHE_GROUPS } from './constants.js';

/**
 * Expand tilde (~) to home directory in path
 *
 * @param filePath - Path that may start with ~
 * @returns Expanded path with home directory
 */
function expandTilde(filePath: string): string {
  if (filePath.startsWith('~')) {
    return filePath.replace(
      '~',
      process.env.HOME || process.env.USERPROFILE || ''
    );
  }
  return filePath;
}

/**
 * Filter cache paths to only those that exist
 * This prevents EACCES errors when trying to cache inaccessible paths
 *
 * @param paths - Array of paths to filter
 * @returns Array of paths that exist (directories or files)
 */
function filterExistingPaths(paths: readonly string[]): string[] {
  const existingPaths: string[] = [];

  for (const cachePath of paths) {
    const expandedPath = expandTilde(cachePath);
    // fs.existsSync doesn't throw for permission errors - it returns false
    // No need for try-catch as we only care about existence
    if (fs.existsSync(expandedPath)) {
      existingPaths.push(expandedPath);
    } else {
      core.debug(`Path does not exist, skipping: ${cachePath}`);
    }
  }

  return existingPaths;
}

/**
 * Restore cache for a single cache group
 *
 * @param groupName - Name of the cache group (for logging)
 * @param cacheKey - Cache key to use
 * @param paths - Paths to restore
 */
async function restoreCacheGroup(
  groupName: string,
  cacheKey: string,
  paths: readonly string[]
): Promise<void> {
  core.startGroup(`Restore ${groupName} cache`);

  try {
    const existingPaths = filterExistingPaths(paths);

    if (existingPaths.length === 0) {
      core.info(`No existing ${groupName} directories found to restore into`);
      core.endGroup();
      return;
    }

    core.debug(
      `Attempting to restore ${groupName} cache to paths: ${existingPaths.join(', ')}`
    );

    const restoredKey = await cache.restoreCache(existingPaths, cacheKey, [
      cacheKey,
    ]);

    if (restoredKey) {
      core.info(`${groupName} cache restored from key: ${restoredKey}`);
    } else {
      core.info(`${groupName} cache not found (first run or cache expired)`);
    }
  } catch (error) {
    core.warning(
      `${groupName} cache restore failed: ${(error as any)?.message ?? error}`
    );
  }

  core.endGroup();
}

/**
 * Cache system assets (metanorma, fontist, relaton)
 *
 * This function ONLY restores caches. Saving happens automatically
 * by the actions/cache@v4 action at the end of the workflow job,
 * not during this action.
 *
 * Note: We do NOT call saveCache() here because:
 * 1. This action runs before metanorma build completes
 * 2. actions/cache automatically saves at the end of the job
 * 3. Attempting to save before the build is pointless
 *
 * @returns Cache result
 */
export async function cacheSystemAssets(): Promise<void> {
  core.startGroup('Cache system assets');

  // Restore each cache group independently
  // This mirrors the v1 behavior where each cache was a separate @actions/cache call
  await restoreCacheGroup(
    'metanorma',
    SYSTEM_CACHE_GROUPS.metanorma.key,
    SYSTEM_CACHE_GROUPS.metanorma.paths
  );

  await restoreCacheGroup(
    'relaton',
    SYSTEM_CACHE_GROUPS.relaton.key,
    SYSTEM_CACHE_GROUPS.relaton.paths
  );

  await restoreCacheGroup(
    'fontist',
    SYSTEM_CACHE_GROUPS.fontist.key,
    SYSTEM_CACHE_GROUPS.fontist.paths
  );

  await restoreCacheGroup(
    'ietf-workgroup',
    SYSTEM_CACHE_GROUPS.workgroup.key,
    SYSTEM_CACHE_GROUPS.workgroup.paths
  );

  core.info('System cache restore operations completed');
  core.endGroup();
}
