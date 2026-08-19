import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { Resolver, stash } from '../../src/common/Resolver';

function makeTempDir(): string {
  return mkdtempSync(join(tmpdir(), 'vpe-test-'));
}

describe('common/Resolver / stash', () => {
  describe('stash (low-level helper)', () => {
    it('writes a CJS shim for an IIFE global and returns ExternalIIFE info', async () => {
      const cacheDir = makeTempDir();
      const info = await stash('react', 'React', cacheDir);

      expect(info.format).toBe('iife');
      expect((info as any).name).toBe('React');
      expect(info.external).toBe('react');
      expect(info.resolvedId).toBe(join(cacheDir, 'react.js'));

      const code = readFileSync(info.resolvedId, 'utf-8');
      // CJS shim shape — see makeCjsExternalCode comment in Resolver.ts.
      // CJS shim 形态——见 Resolver.ts 中 makeCjsExternalCode 注释。
      expect(code).toBe('module.exports = React;');
    });

    it('writes an ESM re-export shim for an absolute-URL external and returns ExternalES info', async () => {
      const cacheDir = makeTempDir();
      const link = 'https://esm.sh/react@18.3.1';
      const info = await stash('react', link, cacheDir);

      expect(info.format).toBe('es');
      expect((info as any).link).toBe(link);
      expect(info.resolvedId).toBe(join(cacheDir, 'react.js'));

      const code = readFileSync(info.resolvedId, 'utf-8');
      expect(code).toContain(`export { default } from '${link}'`);
      expect(code).toContain(`export * from '${link}'`);
    });

    it('flattens subpaths into a single filename via flattenId', async () => {
      const cacheDir = makeTempDir();
      const info = await stash('react-dom/client', 'ReactDOM', cacheDir);
      // flattenId converts '/' → '_' so we don't create nested dirs.
      // flattenId 会把 '/' 转成 '_'，避免生成嵌套目录。
      expect(info.resolvedId).toBe(join(cacheDir, 'react-dom_client.js'));
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
      const sentinelPath = (await resolver.stash('react', 'React')).resolvedId;
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
      expect((info as any).format).toBe('iife');
      expect((info as any).name).toBe('React');
    });

    it('iterates hooks in order — first truthy wins', async () => {
      const cacheDir = makeTempDir();
      const resolver = new Resolver(cacheDir);
      resolver
        .useHook(() => false) // miss
        .useHook((id) => (id === 'react' ? 'React' : false)) // hit
        .useHook(() => 'NeverReaching'); // would also match, but unreachable

      const info = await resolver.resolve('react', undefined, false);
      expect((info as any).name).toBe('React');
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
});
