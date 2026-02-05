/**
 * Site cache manager for metanorma site output
 */

import * as cache from '@actions/cache';
import * as core from '@actions/core';
import { CacheConstants, Outputs } from './constants';
import type { ICacheSettings } from './cache-settings';
import {
  parseManifest,
  getSourceFiles,
  getManifestDir,
} from './manifest-parser';
import { generateHashPatterns, generateHash } from './file-hash-generator';

/**
 * Cache site output directory
 *
 * @param settings - Cache settings from action inputs
 * @returns Cache hit status
 */
export async function cacheSiteOutput(
  settings: ICacheSettings
): Promise<boolean> {
  core.startGroup('Cache site output');

  const { cacheSiteForManifest, extraInput, cacheSitePath } = settings;

  try {
    // Parse manifest
    const manifest = parseManifest(cacheSiteForManifest);
    const sourceFiles = getSourceFiles(manifest);
    const manifestDir = getManifestDir(cacheSiteForManifest);

    core.info(`Manifest path: ${cacheSiteForManifest}`);
    core.info(`Source files: ${sourceFiles.join(', ')}`);
    core.info(`Manifest directory: ${manifestDir}`);

    // Generate hash patterns
    const hashPatterns = generateHashPatterns(
      cacheSiteForManifest,
      manifest,
      extraInput
    );

    // Generate hash from files
    const inputHash = await generateHash(hashPatterns);

    if (!inputHash) {
      core.warning('No hash generated, skipping site cache');
      core.endGroup();
      return false;
    }

    // Set hash output
    core.setOutput(Outputs.HASH, inputHash);

    // Generate cache key
    const cacheKey = `${CacheConstants.SITE_CACHE_KEY_PREFIX}${inputHash}`;

    // Restore cache
    const restoreKeys = [CacheConstants.SITE_CACHE_KEY_PREFIX];
    const restoredKey = await cache.restoreCache(
      [cacheSitePath],
      cacheKey,
      restoreKeys
    );

    let cacheHit = false;
    if (restoredKey) {
      core.info(`Site cache restored from key: ${restoredKey}`);
      cacheHit = restoredKey === cacheKey;
    } else {
      core.info('Site cache not found');
    }

    // Set cache hit output
    core.setOutput(Outputs.CACHE_SITE_CACHE_HIT, String(cacheHit));

    core.endGroup();
    return cacheHit;
  } catch (error) {
    core.error(`Site cache failed: ${(error as any)?.message ?? error}`);
    core.endGroup();
    throw error;
  }
}
