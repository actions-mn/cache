/**
 * Tests for input-helper
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getInputs } from '../src/input-helper';
import { getInput } from '@actions/core';
import * as fs from 'fs';

// Mock @actions/core
vi.mock('@actions/core', () => ({
  getInput: vi.fn(),
}));

// Mock fs module
vi.mock('fs', () => ({
  existsSync: vi.fn(),
  statSync: vi.fn(),
}));

const mockGetInput = vi.mocked(getInput);
const mockExistsSync = vi.mocked(fs.existsSync);
const mockStatSync = vi.mocked(fs.statSync);

describe('input-helper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  describe('getInputs', () => {
    it('should return default values when no inputs are provided', async () => {
      mockGetInput.mockImplementation((name) => {
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
      mockGetInput.mockImplementation((name) => {
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
      mockGetInput.mockImplementation((name) => {
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
      mockGetInput.mockImplementation((name) => {
        if (name === 'cache-site-for-manifest') return '~/metanorma.yml';
        if (name === 'extra-input') return '';
        if (name === 'cache-site-path') return '_site';
        return '';
      });

      await expect(getInputs()).rejects.toThrow('starts with ~');
    });

    it('should throw ValidationError when manifest is a directory', async () => {
      mockGetInput.mockImplementation((name) => {
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
      mockGetInput.mockImplementation((name) => {
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
      mockGetInput.mockImplementation((name) => {
        if (name === 'cache-site-for-manifest') return '';
        if (name === 'extra-input') return '';
        if (name === 'cache-site-path') return '~/site';
        return '';
      });

      await expect(getInputs()).rejects.toThrow('starts with ~');
    });

    it('should throw ValidationError when cache-site-path contains ..', async () => {
      mockGetInput.mockImplementation((name) => {
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
      mockGetInput.mockImplementation((name) => {
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
      mockGetInput.mockImplementation((name) => {
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
