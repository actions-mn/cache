/**
 * Main entry point for the metanorma-cache action
 */

import { info, setFailed } from '@actions/core';
import * as inputHelper from './input-helper.js';
import * as systemCacheManager from './system-cache-manager.js';
import * as siteCacheManager from './site-cache-manager.js';
import { ValidationError } from './errors.js';

/**
 * Main function
 */
async function run(): Promise<void> {
  try {
    const settings = await inputHelper.getInputs();

    // Always cache system assets
    await systemCacheManager.cacheSystemAssets();

    // Conditionally cache site output
    if (settings.cacheSiteForManifest) {
      await siteCacheManager.cacheSiteOutput(settings);
    } else {
      info('No manifest specified, skipping site cache');
    }
  } catch (error) {
    if (error instanceof ValidationError) {
      setFailed(`Input validation failed: ${error.message}`);
    } else {
      setFailed(`${(error as Error)?.message ?? error}`);
    }
  }
}

run();
