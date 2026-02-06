/**
 * Tests for system-cache-manager
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cacheSystemAssets } from '../src/system-cache-manager';
import { SYSTEM_CACHE_GROUPS } from '../src/constants';
import * as cache from '@actions/cache';
import * as core from '@actions/core';
import * as fs from 'fs';

// Mock @actions/cache
vi.mock('@actions/cache', () => ({
  restoreCache: vi.fn(),
  saveCache: vi.fn(),
}));

// Mock fs module
vi.mock('fs', async () => {
  const actualFs = await vi.importActual('fs');
  return {
    ...actualFs,
    existsSync: vi.fn(),
  };
});

const mockRestoreCache = vi.mocked(cache).restoreCache;
const mockExistsSync = vi.mocked(fs).existsSync;

describe('system-cache-manager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  describe('cacheSystemAssets', () => {
    it('should restore cache for all four groups with existing paths', async () => {
      // Mock all paths as existing
      mockExistsSync.mockReturnValue(true);

      // Mock successful cache restore for each group
      mockRestoreCache.mockResolvedValue('metanorma-home-v1');

      await cacheSystemAssets();

      // Verify restoreCache was called 4 times (once per group)
      expect(mockRestoreCache).toHaveBeenCalledTimes(4);

      // Verify metanorma cache restore
      expect(mockRestoreCache).toHaveBeenCalledWith(
        expect.arrayContaining([expect.stringContaining('.metanorma')]),
        'metanorma-home',
        ['metanorma-home']
      );

      // Verify relaton cache restore
      expect(mockRestoreCache).toHaveBeenCalledWith(
        expect.arrayContaining([expect.stringContaining('.relaton')]),
        'metanorma-relaton',
        ['metanorma-relaton']
      );

      // Verify fontist cache restore
      expect(mockRestoreCache).toHaveBeenCalledWith(
        expect.arrayContaining([expect.stringContaining('.fontist')]),
        'metanorma-fontist',
        ['metanorma-fontist']
      );

      // Verify workgroup cache restore
      expect(mockRestoreCache).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.stringContaining('metanorma-ietf-workgroup-cache.json'),
        ]),
        'metanorma-ietf-workgroup-cache',
        ['metanorma-ietf-workgroup-cache']
      );
    });

    it('should filter out non-existent paths before restore', async () => {
      // Mock existsSync to return false for /root/ paths (permission denied scenario)
      mockExistsSync.mockImplementation((path) => {
        const pathStr = String(path);
        if (pathStr.startsWith('/root/')) {
          return false;
        }
        return true;
      });

      mockRestoreCache.mockResolvedValue('metanorma-home-v1');

      await cacheSystemAssets();

      // Verify that restoreCache is called with filtered paths
      // (not including /root/ paths that don't exist)
      const calls = mockRestoreCache.mock.calls;
      expect(calls.length).toBeGreaterThan(0);

      // Check that /root/.metanorma is NOT in any of the calls
      for (const call of calls) {
        const paths = call[0] as string[];
        expect(paths).not.toContain('/root/.metanorma');
        expect(paths).not.toContain('/root/.relaton');
        expect(paths).not.toContain('/root/.fontist');
      }
    });

    it('should skip restore when no paths exist for a group', async () => {
      // Mock all paths as non-existent
      mockExistsSync.mockReturnValue(false);

      const infoSpy = vi.spyOn(core, 'info');

      await cacheSystemAssets();

      // restoreCache should NOT be called when no paths exist
      expect(mockRestoreCache).not.toHaveBeenCalled();

      // Verify info messages about no existing directories
      expect(infoSpy).toHaveBeenCalledWith(
        expect.stringContaining('No existing metanorma directories found')
      );
    });

    it('should handle cache miss (undefined return from restoreCache)', async () => {
      mockExistsSync.mockReturnValue(true);
      mockRestoreCache.mockResolvedValue(undefined);

      const infoSpy = vi.spyOn(core, 'info');

      await cacheSystemAssets();

      // Should not throw, should handle gracefully
      expect(infoSpy).toHaveBeenCalledWith(
        expect.stringContaining('cache not found')
      );
    });

    it('should handle restoreCache errors gracefully', async () => {
      mockExistsSync.mockReturnValue(true);
      mockRestoreCache.mockRejectedValue(
        new Error('Cache service responded with 500')
      );

      const warningSpy = vi.spyOn(core, 'warning');

      // Should not throw
      await expect(cacheSystemAssets()).resolves.not.toThrow();

      // Should log warnings
      expect(warningSpy).toHaveBeenCalledWith(
        expect.stringContaining('cache restore failed')
      );
    });

    it('should expand tilde (~) to home directory', async () => {
      // Set HOME environment variable for test
      const originalHome = process.env.HOME;
      process.env.HOME = '/home/testuser';

      mockExistsSync.mockImplementation((path) => {
        const pathStr = String(path);
        // Check if tilde was expanded correctly
        return (
          pathStr.startsWith('/home/testuser/') ||
          pathStr.startsWith('/home/testuser/.')
        );
      });

      mockRestoreCache.mockResolvedValue('metanorma-home-v1');

      await cacheSystemAssets();

      // Verify that paths were expanded (contains /home/testuser/, not ~)
      const calls = mockRestoreCache.mock.calls;
      const metanormaCall = calls.find((call) => call[1] === 'metanorma-home');
      expect(metanormaCall).toBeDefined();

      const paths = metanormaCall![0] as string[];
      expect(paths.some((p) => p.includes('/home/testuser/'))).toBe(true);

      process.env.HOME = originalHome;
    });

    it('should not call saveCache (only restore)', async () => {
      mockExistsSync.mockReturnValue(true);
      mockRestoreCache.mockResolvedValue('metanorma-home-v1');

      await cacheSystemAssets();

      // Verify saveCache is never called
      expect(cache.saveCache).not.toHaveBeenCalled();
    });
  });

  describe('cache group constants', () => {
    it('should have correct cache keys matching v1', () => {
      expect(SYSTEM_CACHE_GROUPS.metanorma.key).toBe('metanorma-home');
      expect(SYSTEM_CACHE_GROUPS.relaton.key).toBe('metanorma-relaton');
      expect(SYSTEM_CACHE_GROUPS.fontist.key).toBe('metanorma-fontist');
      expect(SYSTEM_CACHE_GROUPS.workgroup.key).toBe(
        'metanorma-ietf-workgroup-cache'
      );
    });

    it('should have correct paths for each cache group', () => {
      expect(SYSTEM_CACHE_GROUPS.metanorma.paths).toEqual([
        '~/.metanorma',
        '/root/.metanorma',
      ]);

      expect(SYSTEM_CACHE_GROUPS.relaton.paths).toEqual([
        '~/.relaton',
        '/root/.relaton',
      ]);

      expect(SYSTEM_CACHE_GROUPS.fontist.paths).toEqual([
        '~/.fontist',
        '/config/fonts',
        '/root/.fontist',
      ]);

      expect(SYSTEM_CACHE_GROUPS.workgroup.paths).toEqual([
        '~/.metanorma-ietf-workgroup-cache.json',
        '/root/.metanorma-ietf-workgroup-cache.json',
      ]);
    });
  });
});
