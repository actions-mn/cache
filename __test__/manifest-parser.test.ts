/**
 * Tests for manifest-parser
 */

import {
  parseManifest,
  getSourceFiles,
  getManifestDir,
} from '../src/manifest-parser';
import type { IMetanormaManifest } from '../src/manifest-parser';

// Mock fs module
jest.mock('fs', () => ({
  readFileSync: jest.fn(),
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
  writeFileSync: jest.fn(),
}));

import * as fs from 'fs';

const mockReadFileSync = fs.readFileSync as jest.MockedFunction<
  typeof fs.readFileSync
>;

describe('manifest-parser', () => {
  describe('parseManifest', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should parse a valid manifest file', () => {
      const yamlContent = `
metanorma:
  source:
    files:
      - documents/index.adoc
      - documents/section1.adoc
`;
      mockReadFileSync.mockReturnValue(yamlContent);

      const result = parseManifest('metanorma.yml');

      expect(result).toEqual({
        metanorma: {
          source: {
            files: ['documents/index.adoc', 'documents/section1.adoc'],
          },
        },
      });
    });

    it('should handle manifest without source files', () => {
      const yamlContent = `
metanorma:
  source: {}
`;
      mockReadFileSync.mockReturnValue(yamlContent);

      const result = parseManifest('metanorma.yml');

      expect(result).toEqual({
        metanorma: {
          source: {},
        },
      });
    });

    it('should handle empty manifest', () => {
      const yamlContent = ``;
      mockReadFileSync.mockReturnValue(yamlContent);

      const result = parseManifest('metanorma.yml');

      expect(result).toBeNull();
    });

    it('should handle manifest with only comments', () => {
      const yamlContent = `
# This is a comment
# Another comment
`;
      mockReadFileSync.mockReturnValue(yamlContent);

      const result = parseManifest('metanorma.yml');

      expect(result).toBeNull();
    });

    it('should throw error for invalid YAML syntax', () => {
      const yamlContent = `
metanorma:
  source:
    files:
      - documents/index.adoc
  # Unclosed bracket
    invalid: [
`;
      mockReadFileSync.mockReturnValue(yamlContent);

      expect(() => {
        parseManifest('metanorma.yml');
      }).toThrow();
    });

    it('should handle manifest with UTF-8 BOM', () => {
      const yamlContent =
        '\uFEFFmetanorma:\n  source:\n    files:\n      - documents/index.adoc\n';
      mockReadFileSync.mockReturnValue(yamlContent);

      const result = parseManifest('metanorma.yml');

      expect(result).toEqual({
        metanorma: {
          source: {
            files: ['documents/index.adoc'],
          },
        },
      });
    });

    it('should handle manifest with extra top-level keys', () => {
      const yamlContent = `
metanorma:
  source:
    files:
      - documents/index.adoc
other_key: value
another_key: 123
`;
      mockReadFileSync.mockReturnValue(yamlContent);

      const result = parseManifest('metanorma.yml');

      // The YAML parser will include all keys, but our type only captures metanorma
      expect(result?.metanorma).toEqual({
        source: {
          files: ['documents/index.adoc'],
        },
      });
    });
  });

  describe('getSourceFiles', () => {
    it('should return source files from manifest', () => {
      const manifest: IMetanormaManifest = {
        metanorma: {
          source: {
            files: ['documents/index.adoc', 'documents/section1.adoc'],
          },
        },
      };

      const result = getSourceFiles(manifest);

      expect(result).toEqual([
        'documents/index.adoc',
        'documents/section1.adoc',
      ]);
    });

    it('should return empty array when no source files', () => {
      const manifest: IMetanormaManifest = {};

      const result = getSourceFiles(manifest);

      expect(result).toEqual([]);
    });

    it('should return empty array when metanorma section exists but no files', () => {
      const manifest: IMetanormaManifest = {
        metanorma: {
          source: {},
        },
      };

      const result = getSourceFiles(manifest);

      expect(result).toEqual([]);
    });
  });

  describe('getManifestDir', () => {
    it('should return directory path for manifest file', () => {
      const result = getManifestDir('/path/to/metanorma.yml');

      expect(result).toBe('/path/to');
    });

    it('should return current directory for manifest file in current dir', () => {
      const result = getManifestDir('metanorma.yml');

      expect(result).toBe('.');
    });

    it('should handle nested paths', () => {
      const result = getManifestDir('/a/b/c/d/metanorma.yml');

      expect(result).toBe('/a/b/c/d');
    });
  });
});
