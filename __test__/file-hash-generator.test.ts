/**
 * Tests for file-hash-generator
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { generateHashPatterns, generateHash } from '../src/file-hash-generator';
import { ValidationError } from '../src/errors';
import type { IMetanormaManifest } from '../src/manifest-parser';

// Mock fs module
vi.mock('fs', async () => {
  const actualFs = await vi.importActual('fs');
  return {
    ...actualFs,
    readFileSync: vi.fn(),
    existsSync: vi.fn(),
    mkdirSync: vi.fn(),
    writeFileSync: vi.fn(),
  };
});

// Mock glob module
vi.mock('glob', () => ({
  glob: vi.fn(),
}));

import * as fs from 'fs';
import { glob } from 'glob';

const mockReadFileSync = vi.mocked(fs.readFileSync);
const mockGlob = vi.mocked(glob);

describe('file-hash-generator', () => {
  describe('generateHashPatterns', () => {
    it('should generate patterns from source files', () => {
      const manifest: IMetanormaManifest = {
        metanorma: {
          source: {
            files: ['documents/index.adoc', 'documents/section1.adoc'],
          },
        },
      };

      const result = generateHashPatterns(
        '/path/to/metanorma.yml',
        manifest,
        ''
      );

      expect(result).toEqual(new Set(['/path/to/documents/**']));
    });

    it('should include extra input patterns', () => {
      const manifest: IMetanormaManifest = {
        metanorma: {
          source: {
            files: ['documents/index.adoc'],
          },
        },
      };

      const result = generateHashPatterns(
        '/path/to/metanorma.yml',
        manifest,
        'assets,templates'
      );

      expect(result).toEqual(
        new Set([
          '/path/to/documents/**',
          '/path/to/assets',
          '/path/to/templates',
        ])
      );
    });

    it('should handle newlines in extra input', () => {
      const manifest: IMetanormaManifest = {
        metanorma: {
          source: {
            files: ['documents/index.adoc'],
          },
        },
      };

      const result = generateHashPatterns(
        '/path/to/metanorma.yml',
        manifest,
        'assets\ntemplates\nimages'
      );

      expect(result).toEqual(
        new Set([
          '/path/to/documents/**',
          '/path/to/assets',
          '/path/to/templates',
          '/path/to/images',
        ])
      );
    });

    it('should filter out invalid patterns', () => {
      const manifest: IMetanormaManifest = {
        metanorma: {
          source: {
            files: ['.'],
          },
        },
      };

      const result = generateHashPatterns(
        '/path/to/metanorma.yml',
        manifest,
        ''
      );

      // Should not include invalid patterns
      expect(result.has('**')).toBe(false);
      expect(result.has('.')).toBe(false);
      expect(result.has('')).toBe(false);
      expect(result.has('...')).toBe(false);
      expect(result.has('./..')).toBe(false);
    });

    it('should throw ValidationError for extra input with ..', () => {
      const manifest: IMetanormaManifest = {
        metanorma: {
          source: {
            files: ['documents/index.adoc'],
          },
        },
      };

      expect(() => {
        generateHashPatterns('/path/to/metanorma.yml', manifest, '../../etc');
      }).toThrow(ValidationError);
    });

    it('should throw ValidationError for extra input with .. in middle', () => {
      const manifest: IMetanormaManifest = {
        metanorma: {
          source: {
            files: ['documents/index.adoc'],
          },
        },
      };

      expect(() => {
        generateHashPatterns(
          '/path/to/metanorma.yml',
          manifest,
          'assets/../tmp'
        );
      }).toThrow(ValidationError);
    });

    it('should handle empty files array in manifest', () => {
      const manifest: IMetanormaManifest = {
        metanorma: {
          source: {
            files: [],
          },
        },
      };

      const result = generateHashPatterns(
        '/path/to/metanorma.yml',
        manifest,
        ''
      );

      expect(result.size).toBe(0);
    });

    it('should handle manifest without source.files', () => {
      const manifest: IMetanormaManifest = {
        metanorma: {},
      };

      const result = generateHashPatterns(
        '/path/to/metanorma.yml',
        manifest,
        ''
      );

      expect(result.size).toBe(0);
    });

    it('should handle manifest without metanorma key', () => {
      const manifest: IMetanormaManifest = {};

      const result = generateHashPatterns(
        '/path/to/metanorma.yml',
        manifest,
        ''
      );

      expect(result.size).toBe(0);
    });
  });

  describe('generateHash', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should return undefined for empty patterns', async () => {
      const result = await generateHash(new Set());

      expect(result).toBeUndefined();
    });

    it('should generate hash from files', async () => {
      const mockFiles = [
        '/path/to/file1.txt',
        '/path/to/file2.txt',
        '/path/to/subdir/file3.txt',
      ];

      mockGlob.mockResolvedValue(mockFiles);
      mockReadFileSync.mockImplementation((path) => {
        if (path === '/path/to/file1.txt') return Buffer.from('content1');
        if (path === '/path/to/file2.txt') return Buffer.from('content2');
        if (path === '/path/to/subdir/file3.txt')
          return Buffer.from('content3');
        return Buffer.from('');
      });

      const result = await generateHash(new Set(['/path/to/**']));

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result?.length).toBe(64); // SHA256 hex length
    });

    it('should return undefined when no files match', async () => {
      mockGlob.mockResolvedValue([]);

      const result = await generateHash(new Set(['/path/to/**']));

      expect(result).toBeUndefined();
    });
  });
});
