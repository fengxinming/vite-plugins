import { tmpdir } from 'node:os';
import { join } from 'node:path';

import type { Rolldown, UserConfig } from 'vite';
import { describe, expect, it, vi } from 'vitest';

import { Resolver } from '../../src/common/Resolver';
import { setExternals } from '../../src/lib/handleExternals';
import { createGlobalsFn } from '../../src/lib/handleGlobals';
import type { ExternalES } from '../../src/types/_resolverInfo';
import type { ResolvedOptions } from '../../src/types/options';

type ExternalProbe = (id: string, importer?: string, isResolved?: boolean) => boolean;

/**
 * 纯 external（externalizeDeps / nodeBuiltins / 数组形态）走的是 `true` 分支，
 * 不碰磁盘；命名 external 才会 stash。所以本文件的用例只取三个判定面
 * （externalFn、Resolver.resolve、output.globals），cacheDir 因此只需是个
 * 不冲突的临时目录，不会有文件写出。
 */
function setup(
  opts: Partial<ResolvedOptions> & { command: 'serve' | 'build' },
  rolldownOptions: Rolldown.RolldownOptions = {},
) {
  const config: UserConfig = { build: { rolldownOptions } };
  const resolver = new Resolver(join(tmpdir(), 'vite-plugin-external', 'handleExternals'));
  const resolvedOptions = {
    cwd: tmpdir(),
    cacheDir: join(tmpdir(), 'vite-plugin-external', 'handleExternals'),
    mode: 'default',
    ...opts
  } as ResolvedOptions;

  const externals = setExternals(resolver, resolvedOptions, config);

  // Rolldown 的 external 只收 boolean；config 钩子也是这么压缩 setExternals 的返回值。
  const external: ExternalProbe = (id, importer, isResolved) => !!externals.externalFn(id, importer, !!isResolved);

  return { config, external, resolver, rolldownOptions, externals };
}

/** 用 setExternals 产出的 globalObject 构造 globals 钩子，观测字符串登记。 */
function installedGlobals(
  externals: ReturnType<typeof setExternals>,
  originalGlobals?: Parameters<typeof createGlobalsFn>[1],
) {
  return createGlobalsFn(externals.globalObject, originalGlobals) as (libName: string) => string | undefined;
}

describe('lib/handleExternals', () => {
  describe('externalizeDeps', () => {
    /*
     * dev 与 build 同形是这次改动的核心：命令门控摘掉之后，同一份名单在两条阶段
     * 都得命中。只测 build 会漏回退，只测 dev 会漏 build 那条 rolldownOptions.external。
     */
    for (const command of ['serve', 'build'] as const) {
      it(`${command}：字符串、正则与子路径都命中，且只给 true 不给全局名`, async () => {
        const { external, resolver } = setup({
          command,
          externalizeDeps: ['lodash', /^@babel\//]
        });

        for (const id of ['lodash', 'lodash/merge', '@babel/core', '@babel/types']) {
          expect(external(id), `${command} 下 '${id}' 应判为 external`).toBe(true);
          await expect(resolver.resolve(id, undefined, false)).resolves.toBe(true);
        }

        // 反向：名单外的依赖照常打包。
        expect(external('react')).toBe(false);
        expect(external('lodash-x')).toBe(false);
        await expect(resolver.resolve('react', undefined, false)).resolves.toBe(false);

        // 纯 external 不提供全局名：不写 stash，也不登记 output.globals 的映射来源。
        expect(resolver.stashMap.size).toBe(0);
      });
    }

    it('未配置 externalizeDeps 时不产生任何额外命中', () => {
      const { external } = setup({ command: 'build' });

      expect(external('lodash')).toBe(false);
    });
  });

  describe('nodeBuiltins', () => {
    /*
     * nodeBuiltins 保持 build-only（有意与 externalizeDeps 不同）：dev 下 vite 已经把
     * 内置模块改写成 '/@id/__vite-browser-external:node:path' 并返回 200 + 抛错 Proxy，
     * 比插件给的裸 external（→ '/@id/node:path' → 404）更可诊断。这条边界必须钉住。
     */
    it('build：内置模块与其子路径都命中', () => {
      const { external } = setup({ command: 'build', nodeBuiltins: true });

      expect(external('fs')).toBe(true);
      expect(external('node:fs')).toBe(true);
      expect(external('fs/promises')).toBe(true);
      expect(external('node:stream/web')).toBe(true);
    });

    it('serve：即使 nodeBuiltins 为真也不参与判定，交给 vite 自己的改写', () => {
      const { external } = setup({ command: 'serve', nodeBuiltins: true });

      expect(external('fs')).toBe(false);
      expect(external('node:fs')).toBe(false);
    });

    it('build 但未开启开关时内置模块照常打包', () => {
      const { external } = setup({ command: 'build' });

      expect(external('fs')).toBe(false);
    });
  });

  describe('注册顺序', () => {
    it('externals 先命中时不再走 externalizeDeps，字符串结论按命名 external 登记', () => {
      const { external, externals } = setup({
        command: 'build',
        externals: { dayjs: 'dayjsGlobal' },
        externalizeDeps: ['dayjs']
      });

      // 先注册先匹配：命名 external 的字符串优先于纯 external 的 true。
      // Rolldown 的 external 钩子只收 boolean，字符串登记进 globalObject，
      // 唯一可观测面是 output.globals。
      expect(external('dayjs')).toBe(true);
      expect(installedGlobals(externals)('dayjs')).toBe('dayjsGlobal');
    });

    /*
     * 用户配置的 build.rolldownOptions.external 被 warn 并忽略（见 warnIgnoredExternal）：
     * 它不再注册为兜底 hook，避免与插件 externals 的合并产生歧义。
     */
    it('用户配置的 rolldownOptions.external 被忽略，不参与判定', () => {
      const userExternal = vi.fn(() => true);
      const { external } = setup(
        {
          command: 'build',
          externalizeDeps: ['lodash']
        },
        { external: userExternal },
      );

      expect(external('lodash')).toBe(true);
      // 用户 external 已被忽略：名单外的依赖照常打包，用户函数一次都不该被调用。
      expect(external('vue')).toBe(false);
      expect(userExternal).not.toHaveBeenCalled();
    });
  });

  describe('CDN 形态的 externals 与 importmap 开关无关', () => {
    const cdnExternals = { react: 'https://esm.sh/react@19.3.1' };

    /*
     * 开关不在这个函数里：它只改 v8.ts 的 resolveId 返回形态和 transformIndexHtml 的
     * 标签，判定面（externalFn / globalObject）一个字节都不动。
     * 这条断言钉住的是"开关不越界改判定"：值形态是绝对 URL 时仍按命名 external 登记，
     * 否则 output.globals 会在 IIFE/UMD 里把这个地址当全局名吐出来。
     */
    for (const importmap of [true, false]) {
      it(`importmap=${importmap}：绝对 URL 仍登记为命名 external`, () => {
        const { external, externals } = setup({
          command: 'build',
          importmap,
          externals: cdnExternals
        });

        expect(external('react')).toBe(true);
        expect(installedGlobals(externals)('react')).toBe('https://esm.sh/react@19.3.1');
      });
    }

    it('名单外的依赖照常走原判定', () => {
      const { external } = setup({
        command: 'build',
        importmap: true,
        externals: cdnExternals,
        externalizeDeps: ['lodash']
      });

      expect(external('dayjs')).toBe(false);
      expect(external('lodash')).toBe(true);
    });
  });

  describe('ES 声明对象形态的 externals', () => {
    /*
     * ES 对象不登记 output.globals：globals 只在 iife/umd 产物里被读取，
     * 把 CDN URL 当全局名会产出 `})(https://esm.sh/dayjs@1);` 这种非法代码。
     * 不登记时 rolldown 回退到模块 id，产物仍合法。
     */
    it('es 对象不登记 output.globals，仍判为 external 交给 Resolver', async () => {
      const esUrl = 'https://esm.sh/dayjs@1';
      const { external, externals, resolver } = setup({
        command: 'build',
        externals: {
          dayjs: { format: 'es' as const, url: esUrl, exports: 'named' as const }
        }
      });

      expect(external('dayjs')).toBe(true);
      expect(installedGlobals(externals)('dayjs')).toBeUndefined();

      // 对象本身必须完整到达 Resolver，否则 ES 链接路线退化成纯 external。
      const info = await resolver.resolve('dayjs', undefined, false) as ExternalES;
      expect(info.format).toBe('es');
      expect(info.url).toBe(esUrl);
      expect(info.exports).toBe('named');

      // 反向：名单外的依赖仍不是 external。
      expect(external('react')).toBe(false);

      resolver.scheduleFlushMetadata.flush();
    });
  });

  it('createGlobalsFn 无论名单是否命中都产出函数', () => {
    const { externals } = setup({ command: 'build', externalizeDeps: ['lodash'] });

    // globals 只在 iife/umd 产物里被读取；名单命中与否都要能产出，否则命名 external
    // 的产物会静默退化成模块 ID。
    expect(typeof installedGlobals(externals)).toBe('function');
  });
});
