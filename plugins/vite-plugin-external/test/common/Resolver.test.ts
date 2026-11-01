import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { Resolver } from '../../src/common/Resolver';
import type { ExternalES, ExternalIIFE } from '../../src/internal-types';

function makeTempDir(): string {
  return mkdtempSync(join(tmpdir(), 'vpe-test-'));
}

describe('common/Resolver / stash', () => {
  describe('Resolver.stash (disk writing)', () => {
    it('writes a CJS shim for an IIFE global and returns ExternalIIFE info', async () => {
      const cacheDir = makeTempDir();
      const info = await new Resolver(cacheDir).stash('react', 'React');

      const iife = info as ExternalIIFE;
      expect(iife.format).toBe('iife');
      expect(iife.globalName).toBe('React');
      expect(iife.moduleId).toBe('react');
      expect(iife.stashPath).toBe(join(cacheDir, 'react.js'));

      const code = readFileSync(iife.stashPath, 'utf-8');
      // CJS shim shape — see makeCjsExternalCode comment in Resolver.ts.
      // CJS shim 形态——见 Resolver.ts 中 makeCjsExternalCode 注释。
      expect(code).toBe('module.exports = React;');
    });

    it('writes an ESM re-export shim for an absolute-URL external and returns ExternalES info', async () => {
      const cacheDir = makeTempDir();
      const cdnUrl = 'https://esm.sh/react@18.3.1';
      const info = await new Resolver(cacheDir).stash('react', cdnUrl);

      const es = info as ExternalES;
      expect(es.format).toBe('es');
      expect(es.cdnUrl).toBe(cdnUrl);
      expect(es.stashPath).toBe(join(cacheDir, 'react.js'));

      const code = readFileSync(es.stashPath, 'utf-8');
      expect(code).toContain(`export { default } from '${cdnUrl}'`);
      expect(code).toContain(`export * from '${cdnUrl}'`);
    });

    it('flattens subpaths into a single filename via flattenId', async () => {
      const cacheDir = makeTempDir();
      const info = await new Resolver(cacheDir).stash('react-dom/client', 'ReactDOM');
      // flattenId converts '/' → '_' so we don't create nested dirs.
      // flattenId 会把 '/' 转成 '_'，避免生成嵌套目录。
      expect(info.stashPath).toBe(join(cacheDir, 'react-dom_client.js'));
    });
  });

  describe('Resolver.stash (memoized)', () => {
    it('returns the same info object on the second call (cache hit)', async () => {
      const cacheDir = makeTempDir();
      const resolver = new Resolver(cacheDir);

      const first = await resolver.stash('react', 'React');
      const second = await resolver.stash('react', 'React');

      expect(second).toBe(first);
    });

    it('does not touch disk on a cache hit (no second writeFile)', async () => {
      const cacheDir = makeTempDir();
      const resolver = new Resolver(cacheDir);

      await resolver.stash('react', 'React');
      // Mutate the file to a sentinel value — a second stash() must NOT
      // overwrite it because the cache hit skips disk IO.
      // 把文件内容改成哨兵值——第二次 stash() 不应该再写磁盘。
      const { writeFileSync } = await import('node:fs');
      const sentinelPath = (await resolver.stash('react', 'React')).stashPath;
      writeFileSync(sentinelPath, 'SENTINEL');
      await resolver.stash('react', 'React');
      expect(readFileSync(sentinelPath, 'utf-8')).toBe('SENTINEL');
    });
  });

  describe('Resolver.resolve', () => {
    it('returns false when no hook matches', async () => {
      const resolver = new Resolver(makeTempDir());
      resolver.useHook(() => false);
      expect(await resolver.resolve('lodash', undefined, false)).toBe(false);
    });

    it('returns true when a hook returns true (pure external, no stash)', async () => {
      const resolver = new Resolver(makeTempDir());
      resolver.useHook((id) => id === 'lodash');
      expect(await resolver.resolve('lodash', undefined, false)).toBe(true);
    });

    it('writes a stash file and returns ExternalIIFE when a hook returns a global name', async () => {
      const cacheDir = makeTempDir();
      const resolver = new Resolver(cacheDir);
      resolver.useHook((id) => (id === 'react' ? 'React' : false));

      const info = await resolver.resolve('react', undefined, false);
      expect(info).not.toBe(false);
      const iife = info as ExternalIIFE;
      expect(iife.format).toBe('iife');
      expect(iife.globalName).toBe('React');
    });

    it('iterates hooks in order — first truthy wins', async () => {
      const cacheDir = makeTempDir();
      const resolver = new Resolver(cacheDir);
      resolver
        .useHook(() => false) // miss
        .useHook((id) => (id === 'react' ? 'React' : false)) // hit
        .useHook(() => 'NeverReaching'); // would also match, but unreachable

      const info = await resolver.resolve('react', undefined, false);
      expect(info).not.toBe(false);
      expect((info as ExternalIIFE).globalName).toBe('React');
    });

    it('returns the cached info when called a second time (no second hook iteration needed)', async () => {
      const cacheDir = makeTempDir();
      const resolver = new Resolver(cacheDir);
      let calls = 0;
      resolver.useHook((id) => {
        calls += 1;
        return id === 'react' ? 'React' : false;
      });

      await resolver.resolve('react', undefined, false);
      await resolver.resolve('react', undefined, false);
      // Second call short-circuits via stashMap cache.
      // 第二次调用通过 stashMap 缓存短路。
      expect(calls).toBe(1);
    });
  });

  describe('Resolver metadata', () => {
    it('does not touch disk until flushMetadata() is called', async () => {
      const cacheDir = makeTempDir();
      const resolver = new Resolver(cacheDir);
      resolver.useHook((id) => (id === 'react' ? 'React' : false));

      await resolver.resolve('react', undefined, false);

      // 写盘是显式动作：预构建插件在自己的 buildEnd 里才调用 flushMetadata()。
      // Writing is explicit — the pre-bundle plugin calls flushMetadata() from buildEnd.
      expect(existsSync(join(cacheDir, '_metadata.json'))).toBe(false);

      await resolver.flushMetadata();

      expect(JSON.parse(readFileSync(join(cacheDir, '_metadata.json'), 'utf-8'))).toEqual({
        externalized: {
          react: {
            moduleId: 'react',
            stashPath: join(cacheDir, 'react.js'),
            globalName: 'React',
            format: 'iife'
          }
        }
      });
    });

    it('returns an empty record when no metadata file exists', () => {
      expect(new Resolver(makeTempDir()).loadMetadata()).toEqual({});
    });

    it('loadMetadata reads the record without touching stashMap', async () => {
      const cacheDir = makeTempDir();
      const writer = new Resolver(cacheDir);
      await writer.stash('react', 'React');
      await writer.flushMetadata();

      const reader = new Resolver(cacheDir);
      expect(Object.keys(reader.loadMetadata())).toEqual(['react']);
      // 只读语义：stashMap 保持为空，解析依旧由 hooks 驱动。
      // Read-only: stashMap stays empty so resolution is still driven by the hooks.
      expect(reader.stashMap.size).toBe(0);
    });

    it('restoreMetadata hydrates stashMap, keeping format / globalName / cdnUrl', async () => {
      const cacheDir = makeTempDir();
      const writer = new Resolver(cacheDir);
      await writer.stash('react', 'React');
      await writer.stash('vue', 'https://esm.sh/vue@3');
      await writer.flushMetadata();

      // dev 改配置触发 restart 后才需要恢复；build 从不调用它。
      // Only needed after a dev restart triggered by a config edit; build never calls it.
      const restored = new Resolver(cacheDir);
      restored.restoreMetadata();

      expect([...restored.stashMap.keys()]).toEqual(['react', 'vue']);
      expect(restored.stashMap.get('react')).toEqual({
        moduleId: 'react',
        stashPath: join(cacheDir, 'react.js'),
        globalName: 'React',
        format: 'iife'
      });
      expect(restored.stashMap.get('vue')?.format).toBe('es');
      expect((restored.stashMap.get('vue') as ExternalES).cdnUrl).toBe('https://esm.sh/vue@3');
    });

    it('restoreMetadata skips entries whose stash file is gone', async () => {
      const cacheDir = makeTempDir();
      const writer = new Resolver(cacheDir);
      await writer.stash('react', 'React');
      await writer.flushMetadata();

      // cacheDir 被清理后 metadata 可能还在，此时条目已失效，不能再复用。
      // A leftover metadata with a missing stash file must not be reused.
      rmSync(join(cacheDir, 'react.js'));

      const restored = new Resolver(cacheDir);
      restored.restoreMetadata();
      expect(restored.stashMap.size).toBe(0);
    });

    it('restoreMetadata ignores the legacy string[] shape', () => {
      const cacheDir = makeTempDir();
      writeFileSync(
        join(cacheDir, '_metadata.json'),
        JSON.stringify({ externalized: ['react', 'vue'] })
      );

      // 旧格式是字符串数组，不是 Record：不能把字符串当成条目灌进 stashMap。
      // The legacy shape is a string array, not a Record — it must not be hydrated.
      const restored = new Resolver(cacheDir);
      restored.restoreMetadata();
      expect(restored.stashMap.size).toBe(0);
    });
  });
});
