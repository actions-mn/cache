/**
 * Input helper for parsing and validating action inputs
 */

import { getInput } from '@actions/core';
import * as fs from 'fs';
import * as path from 'path';
import type { ICacheSettings } from './cache-settings.js';
import { ValidationError } from './errors.js';

/**
 * Get and validate all inputs from the action
 */
export async function getInputs(): Promise<ICacheSettings> {
  const cacheSiteForManifest = getInput('cache-site-for-manifest').trim();

  const extraInput = getInput('extra-input').trim();

  const cacheSitePath = getInput('cache-site-path').trim() || '_site';

  // Validate cache-site-for-manifest if provided
  if (cacheSiteForManifest) {
    // Check if path starts with ~ (GitHub Actions doesn't support shell expansion)
    if (cacheSiteForManifest.startsWith('~')) {
      throw new ValidationError(
        `Path "${cacheSiteForManifest}" starts with ~. GitHub Actions does not support shell expansion. Use "$HOME" instead.`
      );
    }

    // Check if manifest file exists
    if (!fs.existsSync(cacheSiteForManifest)) {
      throw new ValidationError(
        `Manifest file "${cacheSiteForManifest}" does not exist.`
      );
    }

    // Validate that it's a file, not a directory
    const stat = fs.statSync(cacheSiteForManifest);
    if (stat.isDirectory()) {
      throw new ValidationError(
        `Path "${cacheSiteForManifest}" is a directory, not a file.`
      );
    }

    // Validate file extension
    const ext = path.extname(cacheSiteForManifest).toLowerCase();
    if (ext !== '.yml' && ext !== '.yaml') {
      throw new ValidationError(
        `Manifest file "${cacheSiteForManifest}" must have .yml or .yaml extension.`
      );
    }
  }

  // Validate cache-site-path if provided
  if (cacheSitePath) {
    if (cacheSitePath.startsWith('~')) {
      throw new ValidationError(
        `Path "${cacheSitePath}" starts with ~. GitHub Actions does not support shell expansion. Use "$HOME" instead.`
      );
    }

    // Check for invalid characters in path
    if (cacheSitePath.includes('..')) {
      throw new ValidationError(
        `Path "${cacheSitePath}" contains "..", which is not allowed.`
      );
    }
  }

  return {
    cacheSiteForManifest,
    extraInput,
    cacheSitePath,
  };
}
