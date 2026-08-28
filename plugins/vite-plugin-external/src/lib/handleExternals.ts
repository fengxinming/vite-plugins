import { builtinModules } from 'node:module';
import { types } from 'node:util';

import type { Rolldown, UserConfig } from 'vite';
import { escapeRegex, getValue } from 'vp-runtime-helper';

import ExternalHook from '../common/ExternalHook';
import { logger } from '../common/logger';
import type { ResolvedOptions } from '../internal-types';
import type { ExternalFn } from '../types';
import { setOutputGlobals } from './handleGlobals';

/**
 * 构建并安装唯一的 resolve hook，供三处入口共享：
 *   1. build.rolldownOptions.external              —— Rolldown 构建阶段的原生 external 钩子
 *   2. Resolver.useHook(hook)                      —— dev + build 主 resolveId 路径
 *   3. optimizeDeps.rolldownOptions.plugins 中的 resolve —— DepsOptimizer 预打包阶段
 *
 * 同一个 hook 在三处入口复用，保证任何 external 判断（命中 / 不命中 / 返回字符串）
 * 在 dev、build、预打包三个阶段结果完全一致，彻底避免"dev 是 external 但 build
 * 时不是"这种难以调试的诡异 bug。
 *
 * 注册顺序（先注册先匹配）：
 *   1. 用户声明的 opts.externals —— 用户最优先的意图。
 *   2. opts.nodeBuiltins + opts.externalizeDeps（仅 build 阶段）。
 *      命令行快捷开关，只在构建阶段生效。
 *   3. 用户在 vite.config 里直接写的 rolldownOptions.external —— 最后匹配，
 *      让用户可以"最后一搏"覆盖插件的判断。
 *
 * 返回值附带副作用：每次命中字符串形态（Record 形式）时，id → globalName 的
 * 映射会被紧接着调用的 setOutputGlobals 通过"按需反查 resolveHook"来获取，
 * 所以 setOutputGlobals 必须紧跟在 setExternals 之后调用，顺序不能反。
 */
export function setExternals(
  opts: ResolvedOptions,
  config: UserConfig,
): ExternalFn {
  const externalHook = new ExternalHook();

  const { externals } = opts;
  if (externals) {
    externalHook.use(externals);
  }

  const rolldownOptions: Rolldown.RolldownOptions = getValue(
    config,
    'build.rolldownOptions',
    {},
  );

  const { nodeBuiltins, externalizeDeps, command } = opts;

  // 命令行快捷开关只在 build 阶段生效。dev 阶段不处理：
  //   - Node 内置模块在浏览器里本来就解析不到，不用额外 external。
  //   - externalizeDeps 的纯 external 已通过 DepsOptimizer 集成（setOptimizeDeps + Resolver）处理。
  if (command === 'build') {
    if (nodeBuiltins) {
      const builtinModuleArray = builtinModules.map((builtinModule) => {
        // 同时匹配 'fs'、'node:fs'、以及子路径如 'fs/promises' / 'node:fs/promises'。
        return new RegExp(`^(?:node:)?${escapeRegex(builtinModule)}(?:/.+)*$`);
      });
      externalHook.use(builtinModuleArray);
      logger.debug('Externalize nodejs built-in modules:', builtinModuleArray);
    }

    if (externalizeDeps) {
      const deps = externalizeDeps.map((dep) => {
        // 子路径也匹配：externalizeDeps: ['antd'] → antd/es/button 也排除。
        return types.isRegExp(dep)
          ? dep
          : new RegExp(`^${escapeRegex(dep)}(?:/.+)*$`);
      });
      externalHook.use(deps);
      logger.debug('Externalize given dependencies:', deps);
    }
  }

  // 用户 vite.config 里的 rolldownOptions.external 最后插入，让他们能覆盖插件判断。
  if (rolldownOptions.external) {
    externalHook.use(rolldownOptions.external as any);
  }

  // 最终 resolve hook。纯函数，不再用同步副作用写 globalObject；
  // output.globals 按需调本 hook 反查字符串映射。
  const resolveHook: ExternalFn = function (
    id: string,
    importer: string | undefined,
    isResolved: boolean,
  ): string | boolean {
    for (const hook of externalHook.hooks) {
      const val = hook(id, importer, isResolved);

      // 返回字符串 → 命名 external（如 react → React）。
      // 调用方（Resolver / output.globals）决定怎么用这个名字。
      if (typeof val === 'string') {
        return val;
      }

      // truthy 非字符串 → 纯 external，不提供全局名 / shim。
      if (val) {
        logger.debug(`Externalized: '${id}'.`);
        return true;
      }
    }

    return false;
  };

  // Rolldown 1.2.4（Vite 8）的 external 函数只接受 boolean 返回值——
  // 旧 Rollup 把 string 当模块 ID 重定向的行为被 Rolldown 移除。
  // 这里把 resolveHook 的任意 truthy 返回压缩成 boolean；
  // 字符串映射（react → React）由 output.globals 反查 resolveHook 负责。
  rolldownOptions.external = (
    id: string,
    importer: string | undefined,
    isResolved: boolean,
  ): boolean => !!resolveHook(id, importer, isResolved);

  // 安装 output.globals（或 prepend externalGlobals 逃生舱插件）。
  // 必须紧跟 setExternals，因为 output.globals 反查 resolveHook。
  // 包装成单参 adapter，让 resolver 类型匹配 GlobalNameResolver
  // （后者只按 id 反查全局名，importer/isResolved 两个参数无关）。
  setOutputGlobals(rolldownOptions, (id) => resolveHook(id, undefined, true), opts);

  return resolveHook;
}
