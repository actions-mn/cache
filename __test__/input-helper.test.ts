/**
 * Tests for input-helper
 */

import { getInputs } from '../src/input-helper';
import * as core from '@actions/core';

// Mock fs module
jest.mock('fs', () => {
  const actualFs = jest.requireActual('fs');
  return {
    ...actualFs,
    existsSync: jest.fn(),
    statSync: jest.fn(),
  };
});

import * as fs from 'fs';

const mockExistsSync = fs.existsSync as jest.MockedFunction<
  typeof fs.existsSync
>;
const mockStatSync = fs.statSync as jest.MockedFunction<typeof fs.statSync>;

describe('input-helper', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('getInputs', () => {
    it('should return default values when no inputs are provided', async () => {
      jest.spyOn(core, 'getInput').mockImplementation((name) => {
        if (name === 'cache-site-for-manifest') return '';
        if (name === 'extra-input') return '';
        if (name === 'cache-site-path') return '';
        return '';
      });

      const result = await getInputs();

      expect(result).toEqual({
        cacheSiteForManifest: '',
        extraInput: '',
        cacheSitePath: '_site',
      });
    });

    it('should return custom values when inputs are provided and file exists', async () => {
      jest.spyOn(core, 'getInput').mockImplementation((name) => {
        if (name === 'cache-site-for-manifest') return 'metanorma.yml';
        if (name === 'extra-input') return 'assets,templates';
        if (name === 'cache-site-path') return 'site';
        return '';
      });

      mockExistsSync.mockReturnValue(true);
      mockStatSync.mockReturnValue({ isDirectory: () => false } as any);

      const result = await getInputs();

      expect(result).toEqual({
        cacheSiteForManifest: 'metanorma.yml',
        extraInput: 'assets,templates',
        cacheSitePath: 'site',
      });
    });

    it('should throw ValidationError when manifest file does not exist', async () => {
      jest.spyOn(core, 'getInput').mockImplementation((name) => {
        if (name === 'cache-site-for-manifest') return 'metanorma.yml';
        if (name === 'extra-input') return '';
        if (name === 'cache-site-path') return '_site';
        return '';
      });

      mockExistsSync.mockReturnValue(false);

      await expect(getInputs()).rejects.toThrow(
        'Manifest file "metanorma.yml" does not exist.'
      );
    });

    it('should throw ValidationError when manifest path starts with ~', async () => {
      jest.spyOn(core, 'getInput').mockImplementation((name) => {
        if (name === 'cache-site-for-manifest') return '~/metanorma.yml';
        if (name === 'extra-input') return '';
        if (name === 'cache-site-path') return '_site';
        return '';
      });

      await expect(getInputs()).rejects.toThrow('starts with ~');
    });

    it('should throw ValidationError when manifest is a directory', async () => {
      jest.spyOn(core, 'getInput').mockImplementation((name) => {
        if (name === 'cache-site-for-manifest') return 'metanorma.yml';
        if (name === 'extra-input') return '';
        if (name === 'cache-site-path') return '_site';
        return '';
      });

      mockExistsSync.mockReturnValue(true);
      mockStatSync.mockReturnValue({ isDirectory: () => true } as any);

      await expect(getInputs()).rejects.toThrow('is a directory, not a file');
    });

    it('should throw ValidationError when manifest has invalid extension', async () => {
      jest.spyOn(core, 'getInput').mockImplementation((name) => {
        if (name === 'cache-site-for-manifest') return 'metanorma.txt';
        if (name === 'extra-input') return '';
        if (name === 'cache-site-path') return '_site';
        return '';
      });

      mockExistsSync.mockReturnValue(true);
      mockStatSync.mockReturnValue({ isDirectory: () => false } as any);

      await expect(getInputs()).rejects.toThrow(
        'must have .yml or .yaml extension'
      );
    });

    it('should throw ValidationError when cache-site-path starts with ~', async () => {
      jest.spyOn(core, 'getInput').mockImplementation((name) => {
        if (name === 'cache-site-for-manifest') return '';
        if (name === 'extra-input') return '';
        if (name === 'cache-site-path') return '~/site';
        return '';
      });

      await expect(getInputs()).rejects.toThrow('starts with ~');
    });

    it('should throw ValidationError when cache-site-path contains ..', async () => {
      jest.spyOn(core, 'getInput').mockImplementation((name) => {
        if (name === 'cache-site-for-manifest') return '';
        if (name === 'extra-input') return '';
        if (name === 'cache-site-path') return '../site';
        return '';
      });

      await expect(getInputs()).rejects.toThrow(
        'contains "..", which is not allowed'
      );
    });

    it('should trim whitespace from inputs', async () => {
      jest.spyOn(core, 'getInput').mockImplementation((name) => {
        if (name === 'cache-site-for-manifest') return '  metanorma.yml  ';
        if (name === 'extra-input') return '  assets , templates  ';
        if (name === 'cache-site-path') return '  site  ';
        return '';
      });

      mockExistsSync.mockReturnValue(true);
      mockStatSync.mockReturnValue({ isDirectory: () => false } as any);

      const result = await getInputs();

      expect(result).toEqual({
        cacheSiteForManifest: 'metanorma.yml',
        extraInput: 'assets , templates',
        cacheSitePath: 'site',
      });
    });

    it('should use default _site when cache-site-path is empty', async () => {
      jest.spyOn(core, 'getInput').mockImplementation((name) => {
        if (name === 'cache-site-for-manifest') return '';
        if (name === 'extra-input') return '';
        if (name === 'cache-site-path') return '   ';
        return '';
      });

      const result = await getInputs();

      expect(result.cacheSitePath).toBe('_site');
    });
  });
});
