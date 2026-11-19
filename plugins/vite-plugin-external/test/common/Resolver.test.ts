import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { METADATA_FLUSH_DEBOUNCE_MS } from '../../src/common/constants';
import { ExternalError } from '../../src/common/ExternalError';
import { Resolver } from '../../src/common/Resolver';
import type { ExternalES, ExternalIIFE } from '../../src/types/_resolverInfo';

function makeTempDir(): string {
  return mkdtempSync(join(tmpdir(), 'vpe-test-'));
}

/**
 * ES shim 的期望内容。auto 最容易被写回旧形态：default 必须走命名空间取值，
 * 目标缺 default 时才是 undefined 而不是加载期报错。
 */
function esShim(link: string, exports: 'auto' | 'named' | 'default' | 'none' = 'auto') {
  switch (exports) {
    case 'named':
      return `export * from '${link}';`;
    case 'default':
      return `export { default } from '${link}';`;
    case 'none':
      return `import '${link}';`;
    case 'auto':
      return `import * as ns from '${link}';\nexport default ns.default;\nexport * from '${link}';`;
  }
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
      expect(es.url).toBe(cdnUrl);
      expect(es.stashPath).toBe(join(cacheDir, 'react.js'));

      const code = readFileSync(es.stashPath, 'utf-8');
      expect(code).toBe(esShim(cdnUrl));
    });

    /*
     * URL 的判定不止 `scheme://`：/ 开头的根相对 URL 也必须走 ES 重导出，
     * 否则会掉进 IIFE 分支写出 `module.exports = /cdn/react.js;` 这种非法 shim。
     * 根相对 URL 原样写入，换基只发生在 ./ ../ 上。
     */
    it('treats a /-prefixed URL as an ES re-export and writes it verbatim', async () => {
      const cacheDir = makeTempDir();
      const link = '/cdn/react.js';
      const info = await new Resolver(cacheDir).stash('react', link);

      const es = info as ExternalES;
      expect(es.format).toBe('es');
      expect(es.url).toBe(link);
      expect(readFileSync(es.stashPath, 'utf-8')).toBe(esShim(link));
    });

    // 反向：只有点号、没有 / ./ ../ 前缀的串仍是全局变量名，不能误判成 URL。
    it('keeps a dotted global name on the IIFE route', async () => {
      const cacheDir = makeTempDir();
      const info = await new Resolver(cacheDir).stash('react', 'globalThis.React') as ExternalIIFE;

      expect(info.format).toBe('iife');
      expect(info.globalName).toBe('globalThis.React');
      expect(readFileSync(info.stashPath, 'utf-8')).toBe('module.exports = globalThis.React;');
    });

    it('flattens subpaths into a single filename via flattenId', async () => {
      const cacheDir = makeTempDir();
      const info = await new Resolver(cacheDir).stash('react-dom/client', 'ReactDOM');
      // flattenId converts '/' → '_' so we don't create nested dirs.
      // flattenId 会把 '/' 转成 '_'，避免生成嵌套目录。
      expect(info.stashPath).toBe(join(cacheDir, 'react-dom_client.js'));
    });
  });

  describe('Resolver.stash (relative links)', () => {
    /*
     * 用户按配置根目录（cwd）写 ./src/x.ts，而 shim 写在 cacheDir 里：
     * 说明符必须换成相对 cacheDir 的路径，否则会相对 shim 自身解析而找不到文件。
     * 对齐 Vite deps metadata 的两步：内存里落绝对路径，写盘时 path.relative(cacheDir)。
     */
    it('rebases a ./ link from cwd to the stash directory', async () => {
      const root = makeTempDir();
      const cacheDir = join(root, 'node_modules', '.vite_external', '2');
      const link = './src/foo.ts';
      const shimLink = '../../../src/foo.ts';
      const info = await new Resolver(cacheDir, root).stash('@scope/foo', link);

      const es = info as ExternalES;
      expect(es.format).toBe('es');
      // 对外字段保留用户声明值（build / importmap / modulepreload 消费）。
      expect(es.url).toBe(link);
      expect(readFileSync(es.stashPath, 'utf-8')).toBe(esShim(shimLink));
    });

    it('rebases a ../ link that points outside cwd', async () => {
      const root = makeTempDir();
      const cacheDir = join(root, 'node_modules', '.vite_external', '2');
      const link = '../shared/bar.ts';
      const shimLink = '../../../../shared/bar.ts';
      const info = await new Resolver(cacheDir, root).stash('@scope/bar', link) as ExternalES;

      expect(info.url).toBe(link);
      expect(readFileSync(info.stashPath, 'utf-8')).toBe(esShim(shimLink));
    });
  });

  describe('Resolver.stash (ES config objects)', () => {
    it('honours every es exports mode', async () => {
      const link = 'https://esm.sh/dep@1';
      for (const exports of ['auto', 'named', 'default', 'none'] as const) {
        const info = await new Resolver(makeTempDir()).stash('dep', {
          format: 'es',
          url: link,
          exports
        });
        expect(info.format).toBe('es');
        expect(readFileSync((info as ExternalES).stashPath, 'utf-8'))
          .toBe(esShim(link, exports));
      }
    });

    it('falls back to auto when exports is omitted', async () => {
      const link = 'https://esm.sh/dep@1';
      const info = await new Resolver(makeTempDir()).stash('dep', { format: 'es', url: link });
      expect(readFileSync((info as ExternalES).stashPath, 'utf-8')).toBe(esShim(link));
    });

    it('rebases a relative url declared in an es object', async () => {
      const root = makeTempDir();
      const cacheDir = join(root, 'node_modules', '.vite_external', '2');
      const link = './src/foo.ts';
      const info = await new Resolver(cacheDir, root)
        .stash('@scope/foo', { format: 'es', url: link, exports: 'named' }) as ExternalES;

      expect(info.url).toBe(link);
      expect(readFileSync(info.stashPath, 'utf-8')).toBe(esShim('../../../src/foo.ts', 'named'));
    });

  });

  describe('Resolver.stash (invalid config)', () => {
    it('rejects an es object without url', async () => {
      const promise = new Resolver(makeTempDir()).stash('dep', { format: 'es' } as any);
      await expect(promise).rejects.toBeInstanceOf(ExternalError);
      await expect(promise).rejects.toThrow(/requires a non-empty "url"/);
    });

    it('rejects an unknown exports mode', async () => {
      const promise = new Resolver(makeTempDir()).stash('dep', {
        format: 'es',
        url: 'https://esm.sh/dep',
        exports: 'side-effect'
      } as any);
      await expect(promise).rejects.toBeInstanceOf(ExternalError);
      await expect(promise).rejects.toThrow(/unknown "exports" value 'side-effect'/);
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

    it('accepts an ES config object from a hook', async () => {
      const cacheDir = makeTempDir();
      const resolver = new Resolver(cacheDir);
      resolver.useHook((id) => (id === 'react'
        ? { format: 'es' as const, url: 'https://cdn/react.js', exports: 'named' as const }
        : false));

      const info = await resolver.resolve('react', undefined, false) as ExternalES;
      expect(info.format).toBe('es');
      expect(info.url).toBe('https://cdn/react.js');
      expect(info.exports).toBe('named');
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
    /*
     * 落盘绑在"条目产生"这个事实上，不绑打包生命周期：buildEnd 属于 Rolldown 打包容器，
     * 零条目早退、optimizeDeps.noDiscovery 这类场景里容器压根不建，靠它的写法会丢名单。
     */
    it('arms a debounced metadata write from stash(), independent of any bundler lifecycle hook', async () => {
      const cacheDir = makeTempDir();
      const resolver = new Resolver(cacheDir);
      resolver.useHook((id) => (id === 'react' ? 'React' : false));

      await resolver.resolve('react', undefined, false);

      // 窗口未到期：不写。
      expect(existsSync(join(cacheDir, '_metadata.json'))).toBe(false);

      // 用真实时间跨过窗口：假定时器会把 fs-extra 的真实写盘回调一起冻住，
      // 那样测不到"到期后确实落了盘"。
      await new Promise((resolve) => {
        setTimeout(resolve, METADATA_FLUSH_DEBOUNCE_MS + 150);
      });

      // 到期即写，且写的是整份 stashMap 快照。
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

    /*
     * 窗口内多次 stash 合并成一次写，写的是当时整份 stashMap。
     * 只喂一个条目测不出"后一次 stash 会不会把前一次挤出名单"。
     */
    it('merges every stash() in the window into one whole-snapshot write', async () => {
      const cacheDir = makeTempDir();
      const resolver = new Resolver(cacheDir);
      const globals: Record<string, string> = { react: 'React', vue: 'Vue' };
      resolver.useHook((id) => globals[id] ?? false);

      await resolver.resolve('react', undefined, false);
      await resolver.resolve('vue', undefined, false);
      expect(existsSync(join(cacheDir, '_metadata.json'))).toBe(false);

      await new Promise((resolve) => {
        setTimeout(resolve, METADATA_FLUSH_DEBOUNCE_MS + 150);
      });

      const { externalized } = JSON.parse(readFileSync(join(cacheDir, '_metadata.json'), 'utf-8'));
      expect(Object.keys(externalized)).toEqual(['react', 'vue']);
      expect(externalized.vue.globalName).toBe('Vue');
    });

    /*
     * buildEnd 的兜底：预构建那一轮结束时，防抖还挂着没到期就立刻落盘，
     * 不等窗口 —— 单元测试 SIGKILL 掉 dev 进程时窗口根本来不及到期。
     */
    it('flushes a pending debounced write on demand, before the window elapses', async () => {
      const cacheDir = makeTempDir();
      const resolver = new Resolver(cacheDir);
      resolver.useHook((id) => (id === 'react' ? 'React' : false));

      await resolver.resolve('react', undefined, false);
      expect(existsSync(join(cacheDir, '_metadata.json'))).toBe(false);

      resolver.scheduleFlushMetadata.flush();

      const { externalized } = JSON.parse(readFileSync(join(cacheDir, '_metadata.json'), 'utf-8'));
      expect(Object.keys(externalized)).toEqual(['react']);
    });

    /*
     * 反向：没有待落盘的写时 flush() 必须什么都不做。
     * 一个条目都没 stash 的那一轮也会跑 buildEnd，若它写下一个空快照，
     * 上一轮存下的名单就被抹掉，下次启动无从剪枝 —— 兜底不能变成清空。
     */
    it('does not create or clobber the record when flush() has nothing pending', async () => {
      const cacheDir = makeTempDir();
      const resolver = new Resolver(cacheDir);
      resolver.scheduleFlushMetadata.flush();
      expect(existsSync(join(cacheDir, '_metadata.json'))).toBe(false);

      resolver.useHook((id) => (id === 'react' ? 'React' : false));
      await resolver.resolve('react', undefined, false);
      resolver.scheduleFlushMetadata.flush();

      // 新进程（stashMap 为空）的兜底不得把上一轮的名单抹成 {}。
      const nextRound = new Resolver(cacheDir);
      nextRound.scheduleFlushMetadata.flush();
      expect(Object.keys(nextRound.loadMetadata())).toEqual(['react']);
    });

    it('returns an empty record when no metadata file exists', () => {
      expect(new Resolver(makeTempDir()).loadMetadata()).toEqual({});
    });

    it('loadMetadata reads the record without touching stashMap', async () => {
      const cacheDir = makeTempDir();
      const writer = new Resolver(cacheDir);
      await writer.stash('react', 'React');
      writer.flushMetadata();

      const reader = new Resolver(cacheDir);
      expect(Object.keys(reader.loadMetadata())).toEqual(['react']);
      // 只读语义：stashMap 保持为空，解析依旧由 hooks 驱动。
      // Read-only: stashMap stays empty so resolution is still driven by the hooks.
      expect(reader.stashMap.size).toBe(0);
    });

    /*
     * 旧版本 _metadata.json 里的 externalized 是字符串数组。唯一消费方 cleanupCache
     * 取 Object.keys，若不校验形态会把 ['react','vue'] 读成 ['0','1']：既清不掉真正的
     * 旧 deps 条目，又凭空多出两个不存在的模块名。形态不符必须降级成空清单。
     */
    it('loadMetadata rejects the legacy string[] shape instead of reading indices as module names', () => {
      const cacheDir = makeTempDir();
      writeFileSync(
        join(cacheDir, '_metadata.json'),
        JSON.stringify({ externalized: ['react', 'vue'] })
      );

      expect(new Resolver(cacheDir).loadMetadata()).toEqual({});
    });
  });
});
