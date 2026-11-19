import { builtinModules } from 'node:module';
import { types } from 'node:util';

import type { UserConfig } from 'vite';
import { escapeRegex } from 'vp-runtime-helper';

import ExternalHook from '../common/ExternalHook';
import { logger } from '../common/logger';
import { isExternalEsConfig, Resolver } from '../common/Resolver';
import type { ExternalsSetup } from '../types/_context';
import type { ExternalEsConfig, ExternalFn } from '../types/deps';
import type { ResolvedOptions } from '../types/options';

/**
 * 用户在 build.rolldownOptions 里配置了 external 就 warn。
 *
 * 只告警、不就地清空：真正的"忽略"由 config 钩子返回的 external 函数完成 ——
 * 那个函数命中时不返回 true，合并后自然覆盖用户配置。把入参赋成 undefined 属于
 * 就地写入，config 对象被复用时还会不可逆地抹掉用户原值。
 *
 * 用可选链直读，不走 getValue —— 后者在路径缺失时会回写空对象。
 * rollupOptions 是 rolldownOptions 的代理（Vite 的 setupRollupOptionCompat），
 * 两种 key 都会在这里被读到。
 */
function warnIgnoredExternal(config: UserConfig): void {
  if (config.build?.rolldownOptions?.external) {
    logger.warn(
      '"build.rolldownOptions.external" is set but ignored by vite-plugin-external; '
      + 'declare externals via this plugin\'s "externals" option instead.',
    );
  }
}

/**
 * 构建 external 判断链并注册到 resolver，返回可放进 config 返回值的产出。
 *
 * 纯构建，不改动用户 config：externalFn 由 config 钩子包成 rolldownOptions.external
 * 返回，globalObject 由 outputOptions 钩子包成 output.globals。dev 重启每轮都从原始
 * 配置重建，不会在同一对象上反复包裹 external / output.globals。
 */
export function setExternals(
  resolver: Resolver,
  opts: ResolvedOptions,
  config: UserConfig,
): ExternalsSetup {
  warnIgnoredExternal(config);

  const externalHooks = new ExternalHook();

  const { externals } = opts;
  if (externals) {
    externalHooks.use(externals);
  }

  const { nodeBuiltins, externalizeDeps, command } = opts;

  // 命令行快捷开关只在 build 阶段生效。dev 阶段不处理：
  //   - Node 内置模块在浏览器里本来就解析不到，不用额外 external。
  //   - externalizeDeps 的纯 external 已通过 DepsOptimizer 集成（setOptimizeDeps + Resolver）处理。
  if (command === 'build' && nodeBuiltins) {
    const builtinModuleArray = builtinModules.map((builtinModule) => {
      // 同时匹配 'fs'、'node:fs'、以及子路径如 'fs/promises' / 'node:fs/promises'。
      return new RegExp(`^(?:node:)?${escapeRegex(builtinModule)}(?:/.+)*$`);
    });
    externalHooks.use(builtinModuleArray);
    logger.debug('Externalize nodejs built-in modules:', builtinModuleArray);
  }

  if (externalizeDeps) {
    const deps = externalizeDeps.map((dep) => {
      // 子路径也匹配：externalizeDeps: ['antd'] → antd/es/button 也排除。
      return types.isRegExp(dep)
        ? dep
        : new RegExp(`^${escapeRegex(dep)}(?:/.+)*$`);
    });
    externalHooks.use(deps);
    logger.debug('Externalize given dependencies:', deps);
  }

  // 用户 config 里的 rolldownOptions.external 已被 warnIgnoredExternal 拒绝：
  // 不再注册为兜底 hook，避免与插件 externals 的合并产生歧义。

  // output.globals 按需调本 hook 反查字符串映射。
  const globalObject: Record<string, string> = {};
  const externalFn: ExternalFn = function (
    id, importer, isResolved,
  ): string | boolean | ExternalEsConfig {
    for (const hook of externalHooks.hooks) {
      const val = hook(id, importer, isResolved);

      // 返回非空字符串 → 命名 external（如 react → React）。
      // 调用方（Resolver / output.globals）决定怎么用这个名字。
      if (typeof val === 'string') {
        globalObject[id] = val;
        return val;
      }

      // ES 声明对象 → 原样交给 Resolver 走 ES 链接路线。
      // 不登记 output.globals：globals 只在 iife/umd 产物里被读取，把 URL 当全局名
      // 会直接产出非法代码（实测 `})(https://esm.sh/dayjs@1);` 解析失败）；
      // 不登记时 rolldown 回退到模块 id，产物仍合法。
      if (isExternalEsConfig(val)) {
        return val;
      }

      // truthy 非字符串/对象 → 纯 external，不提供全局名 / shim。
      if (val) {
        logger.debug(`Externalized: '${id}'.`);
        return true;
      }
    }

    return false;
  };

  resolver.useHook(externalFn);

  return { externalFn, globalObject };
}
