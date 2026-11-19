import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { ROLLDOWN_PLUGIN_METADATA_NAME } from '../../src/common/constants';
import { Resolver } from '../../src/common/Resolver';
import { setOptimizeDeps } from '../../src/lib/handleOptimizeDeps';
import type { PluginContext } from '../../src/types/_context';

function makeTempDir(): string {
  return mkdtempSync(join(tmpdir(), 'vpe-optdeps-'));
}

/**
 * 取 :metadata 那个生命周期插件：它是 setOptimizeDeps 返回数组里的最后一个实例，
 * 测试要直接敲它的 buildEnd。
 */
function injectedMetadataPlugin(resolver: Resolver) {
  /*
   * ctx 是插件运行期依赖，注入的几处钩子只在 buildStart/resolveId 里读
   * ctx.devServer…depsOptimizer（全是可选链）。本用例只敲 :metadata 的 buildEnd，
   * 但形态仍要给全到"可选链能走通"这一层，免得将来 buildEnd 也去摸 ctx 时静默炸。
   */
  const ctx = { devServer: { environments: { client: {} } } } as unknown as PluginContext;
  const plugins = setOptimizeDeps(resolver, ctx);

  const plugin = plugins.find((item) => item.name === ROLLDOWN_PLUGIN_METADATA_NAME);
  expect(plugin, `${ROLLDOWN_PLUGIN_METADATA_NAME} 应被注入`).toBeDefined();

  const { buildEnd } = plugin as { buildEnd?: unknown };
  expect(typeof buildEnd, 'buildEnd 应是函数钩子').toBe('function');

  return buildEnd as () => void;
}

describe('lib/handleOptimizeDeps — :metadata 插件的 buildEnd', () => {
  /*
   * 兜底存在的理由：写盘原本只等防抖窗口（500ms）。dev 进程被 SIGKILL、
   * 或单元测试在窗口到期前就收尾时，那一轮的名单就再也落不了盘。
   * 用例不等任何窗口，只敲 buildEnd，因此去掉这行必红。
   */
  it('flushes the pending debounced write instead of leaving it to the window', async () => {
    const cacheDir = makeTempDir();
    try {
      const resolver = new Resolver(cacheDir);
      resolver.useHook((id) => (id === 'react' ? 'React' : false));
      await resolver.resolve('react', undefined, false);

      // 窗口未到期：文件还不存在。
      expect(existsSync(join(cacheDir, '_metadata.json'))).toBe(false);

      injectedMetadataPlugin(resolver)();

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
    }
    finally {
      rmSync(cacheDir, { recursive: true, force: true });
    }
  });

  /*
   * 反向：一个条目都没 stash 的那轮也会跑到 buildEnd。若它直接整份重写盘，
   * 快照是空的，会把上一轮存下的名单抹成 {} —— 兜底不能变成清空。
   * flush() 只在防抖挂着待落盘时才真写，所以这里名单必须原样保留。
   */
  it('leaves an existing record untouched when this round stashed nothing', async () => {
    const cacheDir = makeTempDir();
    try {
      const writer = new Resolver(cacheDir);
      writer.useHook((id) => (id === 'react' ? 'React' : false));
      await writer.resolve('react', undefined, false);
      writer.flushMetadata();

      // 新一轮（新 Resolver，stashMap 为空）跑完 buildEnd。
      injectedMetadataPlugin(new Resolver(cacheDir))();

      expect(Object.keys(JSON.parse(readFileSync(join(cacheDir, '_metadata.json'), 'utf-8')).externalized))
        .toEqual(['react']);
    }
    finally {
      rmSync(cacheDir, { recursive: true, force: true });
    }
  });
});
