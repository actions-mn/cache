/**
 * Metanorma.yml manifest parser
 */

import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'yaml';

/**
 * Metanorma manifest structure
 */
export interface IMetanormaManifest {
  metanorma?: {
    source?: {
      files?: string[];
    };
  };
}

/**
 * Parse metanorma.yml manifest file
 *
 * @param manifestPath - Path to the manifest file
 * @returns Parsed manifest object
 */
export function parseManifest(manifestPath: string): IMetanormaManifest {
  const manifestContent = fs.readFileSync(manifestPath, 'utf8');
  return parse(manifestContent) as IMetanormaManifest;
}

/**
 * Extract source file paths from manifest
 *
 * @param manifest - Parsed manifest object
 * @returns Array of source file paths
 */
export function getSourceFiles(manifest: IMetanormaManifest): string[] {
  return manifest.metanorma?.source?.files || [];
}

/**
 * Get the directory containing the manifest file
 *
 * @param manifestPath - Path to the manifest file
 * @returns Directory path
 */
export function getManifestDir(manifestPath: string): string {
  return path.dirname(manifestPath);
}
