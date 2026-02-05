/**
 * Main entry point for the metanorma-cache action
 */

import * as core from '@actions/core';
import * as inputHelper from './input-helper';
import * as systemCacheManager from './system-cache-manager';
import * as siteCacheManager from './site-cache-manager';
import { ValidationError } from './errors';

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
      core.info('No manifest specified, skipping site cache');
    }
  } catch (error) {
    if (error instanceof ValidationError) {
      core.setFailed(`Input validation failed: ${error.message}`);
    } else {
      core.setFailed(`${(error as any)?.message ?? error}`);
    }
  }
}

run();
