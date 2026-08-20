import { describe, expect, it } from 'vitest';

import { buildOptions } from '../../src/lib/handleOptions';
import type { Options } from '../../src/typings';

describe('lib/handleOptions', () => {
  describe('buildOptions', () => {
    it('defaults cwd to process.cwd()', () => {
      const opts = buildOptions({}, { mode: 'production', command: 'build' });
      expect(opts.cwd).toBe(process.cwd());
    });

    it('defaults cacheDir to cwd/node_modules/.vite_external', () => {
      const opts = buildOptions({}, { mode: 'production', command: 'build' });
      expect(opts.cacheDir).toBe(
        `${process.cwd()}/node_modules/.vite_external`,
      );
    });

    it('respects a user-provided absolute cacheDir', () => {
      const opts = buildOptions(
        { cacheDir: '/tmp/external-cache' },
        { mode: 'production', command: 'build' },
      );
      expect(opts.cacheDir).toBe('/tmp/external-cache');
    });

    it('resolves a relative cacheDir against cwd, NOT process.cwd()', () => {
      const opts = buildOptions(
        { cwd: '/tmp/project-root', cacheDir: 'custom-cache' },
        { mode: 'production', command: 'build' },
      );
      expect(opts.cacheDir).toBe('/tmp/project-root/custom-cache');
    });

    it('merges a plain-object per-mode externals overlay on top of root externals', () => {
      const root: Options = {
        externals: { react: 'React', vue: 'Vue' }
      };
      const opts = buildOptions(root, { mode: 'development', command: 'serve' });
      expect(opts.externals).toEqual({
        react: 'React',
        vue: 'Vue'
      });
    });

    it('shallow-merges per-mode externals object on top of root externals object', () => {
      const root: Options = {
        externals: { react: 'React', vue: 'Vue' },
        development: {
          externals: { react: '$react' } // override react in dev mode
        }
      };
      const opts = buildOptions(root, { mode: 'development', command: 'serve' });
      expect(opts.externals).toEqual({
        react: '$react', // dev-mode override wins
        vue: 'Vue' // root key preserved
      });
    });

    it('replaces externals when the per-mode overlay is a non-object (function/array/etc.)', () => {
      const root: Options = {
        externals: { react: 'React' },
        production: {
          externals: () => true
        }
      };
      const opts = buildOptions(root, { mode: 'production', command: 'build' });
      expect(typeof opts.externals).toBe('function');
    });

    it('concats + dedupes when both root and per-mode externals are arrays', () => {
      const root: Options = {
        externals: ['react', 'vue'],
        production: {
          externals: ['vue', 'lodash']
        }
      };
      const opts = buildOptions(root, { mode: 'production', command: 'build' });
      expect(opts.externals).toEqual(['react', 'vue', 'lodash']);
    });

    it('spreads ConfigEnv fields onto the result (mode, command, ssrBuild)', () => {
      const env = { mode: 'production', command: 'build' as const, ssrBuild: true };
      const opts = buildOptions({}, env);
      expect(opts.mode).toBe('production');
      expect(opts.command).toBe('build');
      expect(opts.ssrBuild).toBe(true);
    });

    it('lets per-mode cwd / cacheDir / logLevel overrides take effect', () => {
      const root: Options = {
        cwd: '/root-cwd',
        cacheDir: '/root-cache',
        development: {
          cwd: '/dev-cwd',
          cacheDir: '/dev-cache'
        }
      };
      const opts = buildOptions(root, { mode: 'development', command: 'serve' });
      expect(opts.cwd).toBe('/dev-cwd');
      expect(opts.cacheDir).toBe('/dev-cache');
    });
  });
});
