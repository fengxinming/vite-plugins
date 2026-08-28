import { EOL } from 'node:os';

import type { Plugin } from 'vite';
import { banner, colorful, getRuntimeVersion } from 'vp-runtime-helper';

import pkg from '../package.json' with { type: 'json' };
import { PLUGIN_NAME } from './common/constants';
import { logger } from './common/logger';
import type { Options } from './types';
import v8, { cleanupCache } from './v8';

/**
 * 插件对外的工厂函数。包装合并后的 Vite 8 实现，外层加三件事：
 *   - 当 enableBanner 为真时输出 banner 行
 *   - 启动时彩色日志打印 Vite 与插件版本
 *   - 把用户的 apply 选项透传到最终 plugin 对象
 *
 * 为什么要把 index.ts 和 v8.ts 的实现分成两个工厂？
 * 分拆后"插件钩子实际行为"（v8.ts）和"插件在 Vite 生态中的展示层"
 * （banner、apply、类型重导出）互不耦合。单测可以直接测试 v8()
 * 返回的纯钩子对象，而不用 mock vp-runtime-helper 的 banner 彩色输出。
 *
 * 功能：提供一种将依赖排除在运行时代码和构建产物之外的方法。
 *
 * @example
 * '''js
 * import pluginExternal from 'vite-plugin-external';
 *
 * export default defineConfig({
 *  plugins: [
 *    pluginExternal({
 *      externals: {
 *        jquery: '$',
 *
 *        react: 'React',
 *        'react-dom/client': 'ReactDOM',
 *
 *        vue: 'Vue'
 *      }
 *    })
 *  ]
 * });
 * '''
 *
 * @param opts 插件配置项，默认为 {}。
 * @returns Vite 插件实例。
 */
export default function vitePluginExternal(opts: Options = {} as Options): Plugin {
  if (opts.enableBanner) {
    banner(pkg.name);
  }

  // 打印 Vite 版本 + 插件版本的彩色启动行，让用户一眼知道哪个版本在工作。
  const version = getRuntimeVersion();
  colorful.green(`${EOL}Vite@${version} ${pkg.name}@${pkg.version}`);

  // 把 logger name 写成 '<PLUGIN_NAME>-v8'，方便排 issue 时能从日志一眼认出
  // "用户跑的是 Vite 8 合并版实现"（如果有旧分支还在跑 alias 实现也能区分）。
  logger.name = `${PLUGIN_NAME}-v8`;

  const base: Plugin = {
    name: PLUGIN_NAME,
    apply: opts.apply
  };

  return Object.assign(base, v8(opts));
}

/**
 * 公开 cleanupCache：用户在任意时刻（比如外部脚本）可以手动清理
 * DepsOptimizer metadata 里的 external 条目。极少需要，但为了历史 API
 * 兼容性保留。
 */
export { cleanupCache, vitePluginExternal };
export * from './types';
