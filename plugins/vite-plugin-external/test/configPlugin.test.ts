import { tmpdir } from 'node:os';
import { join } from 'node:path';

import type { ConfigEnv, Rolldown, UserConfig } from 'vite';
import { describe, expect, it } from 'vitest';

import type { PluginContext } from '../src/types/_context';
import type { Options } from '../src/types/options';
import { createConfigPlugin } from '../src/v8';

type ConfigHook = (config: UserConfig, env: ConfigEnv) => UserConfig | undefined;
type OutputHook = (options: Rolldown.OutputOptions) => Rolldown.OutputOptions | null;

const env: ConfigEnv = { command: 'build', mode: 'production' };

function makePlugin(opts: Options = {}) {
  const ctx = {} as PluginContext;
  const plugin = createConfigPlugin(ctx, {
    cacheDir: join(tmpdir(), 'vite-plugin-external', 'configPlugin'),
    ...opts
  });

  return {
    ctx,
    runConfig(config: UserConfig) {
      return (plugin.config as ConfigHook)(config, env) as UserConfig;
    },
    runOutputOptions(options: Rolldown.OutputOptions) {
      return (plugin.outputOptions as OutputHook)(options);
    }
  };
}

describe('v8/configPlugin', () => {
  /*
   * 用户自配的 rolldownOptions.external 只告警、不改写：
   * 之前那版在 warnIgnoredExternal 里把它赋成 undefined，属于就地写入用户 config，
   * 且 config 对象被复用时不可逆。这里钉住"入参原值必须还在"。
   */
  it('config 钩子不改写用户的 rolldownOptions.external', () => {
    const { runConfig } = makePlugin();
    const config: UserConfig = { build: { rolldownOptions: { external: ['lodash'] } } };

    runConfig(config);

    expect(config.build?.rolldownOptions?.external).toEqual(['lodash']);
  });

  /*
   * 未启用原生 external 时（这里用 interop: 'auto'）返回的 external 必须恒 false，
   * 用它声明式盖掉用户配置；否则用户 external 会继续生效，"忽略"就是句空话。
   */
  it('未启用时返回的 external 恒为 false', () => {
    const { runConfig } = makePlugin({
      interop: 'auto',
      externals: { react: 'React' }
    });
    const computed = runConfig({
      build: {
        lib: { entry: 'src/index.ts', formats: ['iife'] },
        rolldownOptions: { external: ['lodash'] }
      }
    });

    const external = computed.build?.rolldownOptions?.external as (
      id: string
    ) => boolean;

    expect(external('react')).toBe(false);
    expect(external('lodash')).toBe(false);
  });

  /*
   * output.globals 不进 config 返回值：rolldownOptions.output 允许数组，
   * 而 mergeConfig 对数组是 concat，返回值里带 output 会拼出重复项。
   */
  it('config 返回值不携带 output', () => {
    const { runConfig } = makePlugin({ externals: { react: 'React' } });
    const computed = runConfig({
      build: { lib: { entry: 'src/index.ts', formats: ['iife', 'umd'] } }
    });

    expect(computed.build?.rolldownOptions?.output).toBeUndefined();
  });

  /*
   * 数组/多格式由 outputOptions 钩子按 output 逐个处理，每一项都要拿到
   * 插件登记的映射，并且保留用户自己写的 globals 作为兜底。
   */
  it('outputOptions 逐个 output 安装 globals，并保留用户兜底', () => {
    const { runConfig, runOutputOptions } = makePlugin({
      externals: { react: 'React' }
    });
    const computed = runConfig({
      build: { lib: { entry: 'src/index.ts', formats: ['iife', 'umd'] } }
    });

    const external = computed.build?.rolldownOptions?.external as (
      id: string
    ) => boolean;
    expect(external('react')).toBe(true);

    const outputs: Rolldown.OutputOptions[] = [
      { format: 'iife', globals: { dayjs: 'dayjsGlobal' } },
      { format: 'umd', entryFileNames: 'umd/[name].js' }
    ];

    for (const output of outputs) {
      const merged = runOutputOptions(output);
      const globals = merged?.globals as (name: string) => string | undefined;

      expect(typeof globals, '每个 output 都应装上 globals 函数').toBe('function');
      // 插件登记的命名 external 优先。
      expect(globals('react')).toBe('React');
      // 其余字段原样保留，不吞用户的 output 配置。
      expect(merged?.format).toBe(output.format);
    }

    // 第一项用户自带的 globals 作为兜底，没命中插件映射时仍能取到。
    const first = runOutputOptions(outputs[0]);
    const firstGlobals = first?.globals as (name: string) => string | undefined;
    expect(firstGlobals('dayjs')).toBe('dayjsGlobal');
    expect(firstGlobals('unknown-dep')).toBeUndefined();
  });

  /*
   * globals 只对 iife/umd 生效：es/cjs 用 import/require，不消费 globals，
   * 装了是空转。门控需与 config 钩子里 external 的 enabled 判断一致。
   */
  it('outputOptions 对 es/cjs 不装 globals', () => {
    const { runConfig, runOutputOptions } = makePlugin({
      externals: { react: 'React' }
    });
    runConfig({
      build: { lib: { entry: 'src/index.ts', formats: ['iife'] } }
    });

    for (const format of ['es', 'cjs', 'esm', 'module', 'commonjs'] as const) {
      const output = runOutputOptions({ format, globals: { react: 'React' } });
      // es/cjs 保持原样：既不返回带 globals 的对象，也不吞掉用户原值。
      expect(output).toBeNull();
    }
  });
});
