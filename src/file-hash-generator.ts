/**
 * File hash generator for cache key creation
 */

import * as core from '@actions/core';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import type { IMetanormaManifest } from './manifest-parser';
import { ValidationError } from './errors';

/**
 * Generate cache hash patterns from manifest and extra input
 *
 * @param manifestPath - Path to the manifest file
 * @param manifest - Parsed manifest object
 * @param extraInput - Additional directories that affect the build
 * @returns Set of glob patterns for hashing
 */
export function generateHashPatterns(
  manifestPath: string,
  manifest: IMetanormaManifest,
  extraInput: string
): Set<string> {
  const basePath = path.dirname(manifestPath);
  const documentPaths = manifest.metanorma?.source?.files || [];

  const matchPatterns = new Set<string>(
    documentPaths
      .map((documentPath) => path.dirname(documentPath))
      .map((documentPath) => path.join(basePath, documentPath, '**'))
      .filter((pattern) => pattern !== path.join(basePath, '**'))
  );

  if (extraInput) {
    const extraInputs = extraInput.split(/[\n,]/);
    for (const input of extraInputs) {
      const trimmed = input.trim();
      if (trimmed) {
        // Validate for path traversal attempts
        if (trimmed.includes('..')) {
          throw new ValidationError(
            `Extra input path "${trimmed}" contains "..", which is not allowed.`
          );
        }
        matchPatterns.add(path.join(basePath, trimmed));
      }
    }
  }

  // Remove invalid patterns
  const invalidPatterns = ['**', '.', '', '...', './..'];
  for (const pattern of invalidPatterns) {
    matchPatterns.delete(pattern);
  }

  return matchPatterns;
}

/**
 * Generate hash from file patterns
 *
 * @param patterns - Set of glob patterns
 * @returns Hash string or undefined if no files match
 */
export async function generateHash(
  patterns: Set<string>
): Promise<string | undefined> {
  if (patterns.size === 0) {
    core.warning('No hash patterns generated');
    return undefined;
  }

  const hashPatterns = [...patterns].join('\n');
  core.info(`Input directories:\n${hashPatterns}`);

  // Collect all files matching the patterns
  const files = new Set<string>();
  for (const pattern of patterns) {
    try {
      const matchedFiles = await glob(pattern, {
        nodir: true,
        absolute: true,
      });
      for (const file of matchedFiles) {
        files.add(file);
      }
    } catch (error) {
      core.warning(
        `Failed to glob pattern ${pattern}: ${(error as any)?.message ?? error}`
      );
    }
  }

  if (files.size === 0) {
    core.warning('No files found matching patterns');
    return undefined;
  }

  core.info(`Found ${files.size} files for hashing`);

  // Compute hash of all files
  const hash = crypto.createHash('sha256');
  const sortedFiles = [...files].sort();

  for (const file of sortedFiles) {
    try {
      const content = fs.readFileSync(file);
      hash.update(content);
    } catch (error) {
      core.warning(
        `Failed to read file ${file}: ${(error as any)?.message ?? error}`
      );
    }
  }

  const inputHash = hash.digest('hex');
  core.info(`Input hash: ${inputHash}`);

  return inputHash;
}
