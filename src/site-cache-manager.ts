/**
 * Site cache manager for metanorma site output
 */

import { restoreCache } from '@actions/cache';
import {
  info,
  warning,
  error,
  setOutput,
  startGroup,
  endGroup,
} from '@actions/core';
import { CacheConstants, Outputs } from './constants.js';
import type { ICacheSettings } from './cache-settings.js';
import {
  parseManifest,
  getSourceFiles,
  getManifestDir,
} from './manifest-parser.js';
import { generateHashPatterns, generateHash } from './file-hash-generator.js';

/**
 * Cache site output directory
 *
 * @param settings - Cache settings from action inputs
 * @returns Cache hit status
 */
export async function cacheSiteOutput(
  settings: ICacheSettings
): Promise<boolean> {
  startGroup('Cache site output');

  const { cacheSiteForManifest, extraInput, cacheSitePath } = settings;

  try {
    // Parse manifest
    const manifest = parseManifest(cacheSiteForManifest);
    const sourceFiles = getSourceFiles(manifest);
    const manifestDir = getManifestDir(cacheSiteForManifest);

    info(`Manifest path: ${cacheSiteForManifest}`);
    info(`Source files: ${sourceFiles.join(', ')}`);
    info(`Manifest directory: ${manifestDir}`);

    // Generate hash patterns
    const hashPatterns = generateHashPatterns(
      cacheSiteForManifest,
      manifest,
      extraInput
    );

    // Generate hash from files
    const inputHash = await generateHash(hashPatterns);

    if (!inputHash) {
      warning('No hash generated, skipping site cache');
      endGroup();
      return false;
    }

    // Set hash output
    setOutput(Outputs.HASH, inputHash);

    // Generate cache key
    const cacheKey = `${CacheConstants.SITE_CACHE_KEY_PREFIX}${inputHash}`;

    // Restore cache
    const restoreKeys = [CacheConstants.SITE_CACHE_KEY_PREFIX];
    const restoredKey = await restoreCache(
      [cacheSitePath],
      cacheKey,
      restoreKeys
    );

    let cacheHit = false;
    if (restoredKey) {
      info(`Site cache restored from key: ${restoredKey}`);
      cacheHit = restoredKey === cacheKey;
    } else {
      info('Site cache not found');
    }

    // Set cache hit output
    setOutput(Outputs.CACHE_SITE_CACHE_HIT, String(cacheHit));

    endGroup();
    return cacheHit;
  } catch (err) {
    error(`Site cache failed: ${(err as any)?.message ?? err}`);
    endGroup();
    throw err;
  }
}
