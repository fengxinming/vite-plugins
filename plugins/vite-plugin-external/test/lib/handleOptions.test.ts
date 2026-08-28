import { describe, expect, it, vi } from 'vitest';

import { logger } from '../../src/common/logger';
import { buildOptions } from '../../src/lib/handleOptions';
import type { Options } from '../../src/types';

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

  describe('buildOptions: externalizeDeps / nodeBuiltins per-mode overrides', () => {
    it('concats + dedupes when both root and per-mode externalizeDeps are arrays', () => {
      const root: Options = {
        externalizeDeps: ['lodash', 'dayjs'],
        production: {
          externalizeDeps: ['dayjs', /@babel\//]
        }
      };
      const opts = buildOptions(root, { mode: 'production', command: 'build' });
      expect(opts.externalizeDeps).toEqual(['lodash', 'dayjs', /@babel\//]);
    });

    it('adopts the per-mode externalizeDeps array when root has none', () => {
      const root: Options = {
        production: {
          externalizeDeps: ['lodash']
        }
      };
      const opts = buildOptions(root, { mode: 'production', command: 'build' });
      expect(opts.externalizeDeps).toEqual(['lodash']);
    });

    it('passes root externalizeDeps / nodeBuiltins through when no mode block matches', () => {
      const root: Options = {
        externalizeDeps: ['lodash'],
        nodeBuiltins: true,
        development: {
          externalizeDeps: ['vue']
        }
      };
      // production 没有配置块，root 字段原样透传
      const opts = buildOptions(root, { mode: 'production', command: 'build' });
      expect(opts.externalizeDeps).toEqual(['lodash']);
      expect(opts.nodeBuiltins).toBe(true);
    });

    it('lets an explicit per-mode nodeBuiltins: false turn off a root true', () => {
      const root: Options = {
        nodeBuiltins: true,
        production: {
          nodeBuiltins: false
        }
      };
      const opts = buildOptions(root, { mode: 'production', command: 'build' });
      expect(opts.nodeBuiltins).toBe(false);
    });

    it('turns on nodeBuiltins from a per-mode override when root is unset', () => {
      const root: Options = {
        production: {
          nodeBuiltins: true
        }
      };
      const opts = buildOptions(root, { mode: 'production', command: 'build' });
      expect(opts.nodeBuiltins).toBe(true);
    });

    it('warns and drops keys that are not overridable per mode', () => {
      const warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => {});
      // 模拟 JS 用户（无类型检查）往 mode 块塞插件级字段的场景
      const root = {
        interop: 'auto',
        development: {
          interop: 'auto',
          enableBanner: true,
          externalizeDeps: ['lodash']
        }
      } as unknown as Options;

      const opts = buildOptions(root, { mode: 'development', command: 'serve' });

      // 非法字段被 warn 点名
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('"interop"'));
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('"enableBanner"'));
      // 根级 interop 不受影响（mode 块里的副本被丢弃）
      expect(opts.interop).toBe('auto');
      expect(opts.enableBanner).toBeUndefined();
      // 合法字段照常生效
      expect(opts.externalizeDeps).toEqual(['lodash']);
      // mode 块本身不透传到下游
      expect((opts as Record<string, unknown>).development).toBeUndefined();
      warnSpy.mockRestore();
    });

    it('supports custom modes via the string index fallback', () => {
      const root = {
        alpha: {
          externalizeDeps: ['vue']
        }
      } as unknown as Options;
      const opts = buildOptions(root, { mode: 'alpha', command: 'build' });
      expect(opts.externalizeDeps).toEqual(['vue']);
      // 自定义 mode 键同样不透传
      expect((opts as Record<string, unknown>).alpha).toBeUndefined();
    });

    it('ignores null/undefined values in a mode block', () => {
      const root: Options = {
        nodeBuiltins: true,
        production: {
          externals: undefined,
          nodeBuiltins: undefined
        }
      };
      const opts = buildOptions(root, { mode: 'production', command: 'build' });
      expect(opts.nodeBuiltins).toBe(true);
      expect(opts.externals).toBeUndefined();
    });
  });
});
