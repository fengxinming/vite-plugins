import { builtinModules } from 'node:module';
import { types } from 'node:util';

import type { Rolldown, UserConfig } from 'vite';
import { escapeRegex, getValue } from 'vp-runtime-helper';

import ExternalHook from '../common/ExternalHook';
import { logger } from '../common/logger';
import type { ExternalFn, ResolvedOptions } from '../typings';
import { setOutputGlobals } from './handleGlobals';

/**
 * Build and install the single resolve hook shared by three consumers:
 *   1. 'build.rolldownOptions.external'      — Rolldown build-time 原生 external 钩子
 *   2. 'Resolver.useHook(hook)'              — dev + build 主 resolveId 路径
 *   3. 'optimizeDeps.rolldownOptions.plugins' resolve — DepsOptimizer 预打包阶段
 *
 * 同一个 hook 被三处入口复用，保证任何 externals 判断（命中 / 不命中 / 返回字符串）
 * 在 dev、build、预打包三个阶段**结果完全一致**，避免"dev 是 external 但 build 时
 * 不是"这种诡异 bug 的根源。
 *
 * Sharing one hook across all three entry points guarantees that the
 * "is this import external?" decision never diverges between dev, build,
 * and the pre-bundling step — the most common source of hard-to-debug
 * vite-plugin-external issues in earlier versions.
 *
 * 注册顺序（Registration order — earlier hooks match first）：
 *   1. User-declared 'opts.externals' → user's first choice.
 *      用户自己的 opts.externals，最优先匹配。
 *   2. 'opts.nodeBuiltins' + 'opts.externalizeDeps' (only during build).
 *      命令行快捷开关，仅在 build 阶段生效。
 *   3. The user's raw 'build.rolldownOptions.external' value, if any →
 *      last match, so user's vite.config-level declaration can always
 *      override us as a last-resort escape.
 *      用户 vite.config 里直接写的 rolldownOptions.external，最后匹配，
 *      让用户可以"最后一搏"覆盖插件的判断。
 *
 * Returns a resolve hook that also has a side-effect: whenever it returns a
 * STRING match (the {react:'React'} case), it records the id→globalName
 * pair into 'globalObject' so 'setOutputGlobals' can later wire the id to
 * Rolldown's 'output.globals'. That's why setOutputGlobals must be called
 * immediately AFTER this function.
 *
 * 返回值附带副作用：每次命中字符串形态（Record 形式）时，同步把
 * id → globalName 写进 'globalObject'，供紧接其后调用的 setOutputGlobals
 * 用来安装 'output.globals'。所以 setOutputGlobals 必须跟在 setExternals
 * 之后立即调用，顺序不能反。
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

  // Shortcut hooks are intentionally wired only during 'build'.
  // Dev 阶段不处理这两个开关：
  //   - Node built-ins don't resolve in-browser anyway.
  //     浏览器里 Node 内置模块本来就不存在，无需额外 external。
  //   - Pure externals for 'externalizeDeps' are handled during dev by the
  //     DepsOptimizer integration (setOptimizeDeps + Resolver).
  //     externalizeDeps 的纯 external 在 dev 阶段已通过 DepsOptimizer 处理。
  if (command === 'build') {
    if (nodeBuiltins) {
      const builtinModuleArray = builtinModules.map((builtinModule) => {
        // Also match 'node:' prefix AND subpath variants (fs/promises,
        // node:fs/promises, …).
        // 同时匹配 'fs'、'node:fs'、以及子路径如 'fs/promises' / 'node:fs/promises'。
        return new RegExp(`^(?:node:)?${escapeRegex(builtinModule)}(?:/.+)*$`);
      });
      externalHook.use(builtinModuleArray);
      logger.debug('Externalize nodejs built-in modules:', builtinModuleArray);
    }

    if (externalizeDeps) {
      const deps = externalizeDeps.map((dep) => {
        // Also match subpaths. 'antd/es/button' should also be excluded if
        // 'externalizeDeps' lists 'antd' as a bare string.
        // 子路径也匹配：externalizeDeps: ['antd'] → antd/es/button 也排除。
        return types.isRegExp(dep)
          ? dep
          : new RegExp(`^${escapeRegex(dep)}(?:/.+)*$`);
      });
      externalHook.use(deps);
      logger.debug('Externalize given dependencies:', deps);
    }
  }

  // Merge user-declared rolldown external LAST so they can override us.
  // 用户 vite.config 里的 rolldownOptions.external 最后插入，让他们能覆盖插件判断。
  if (rolldownOptions.external) {
    externalHook.use(rolldownOptions.external as any);
  }

  // Final resolve hook. Pure function — no eager globalObject side-effect;
  // output.globals reverse-looks-up the string mapping on demand.
  //
  // 最终 resolve hook。纯函数，不再用 globalObject 同步副作用记录映射；
  // output.globals 按需调本 hook 反查字符串映射。
  const resolveHook: ExternalFn = function (
    id: string,
    importer: string | undefined,
    isResolved: boolean,
  ): string | boolean {
    for (const hook of externalHook.hooks) {
      const val = hook(id, importer, isResolved);

      // String → named external (e.g. 'react' → 'React'). Caller
      // (Resolver / output.globals) decides what to do with the name.
      // 返回字符串 → 命名 external（如 react → React）。调用方
      // （Resolver / output.globals）决定怎么用这个名。
      if (typeof val === 'string') {
        return val;
      }

      // Truthy non-string → pure external (no global name / CDN shim).
      // 返回 true → 纯 external，不提供全局名 / shim。
      if (val) {
        logger.debug(`Externalized: '${id}'.`);
        return true;
      }
    }

    return false;
  };

  // Rolldown 1.2.4 (Vite 8) external 函数只接受 boolean 返回值——
  // 不再接受字符串（旧 Rollup 把 string 当模块 ID 重定向，Rolldown 移除）。
  // 把 resolveHook 的任何 truthy 返回压缩成 boolean；字符串映射（react → React）
  // 由 output.globals 通过反查 resolveHook 负责。
  //
  // Rolldown 1.2.4 (Vite 8) external fn accepts only boolean returns —
  // legacy Rollup accepted string for module-id remapping, Rolldown removed
  // that. Collapse any truthy return from resolveHook to a boolean here;
  // the string-form mapping (react → React) is handled by output.globals
  // reverse-looking up resolveHook.
  rolldownOptions.external = (
    id: string,
    importer: string | undefined,
    isResolved: boolean,
  ): boolean => !!resolveHook(id, importer, isResolved);

  // Wire 'output.globals' (or prepend the externalGlobals plugin).
  // 必须紧跟 setExternals，因为 output.globals 反查 resolveHook。
  // Wrap in a single-arg adapter so the resolver type matches
  // GlobalNameResolver (which only queries by id — importer/isResolved
  // are irrelevant for globals reverse-lookup).
  // 包装成单参 adapter，让 resolver 类型匹配 GlobalNameResolver
  // （后者只按 id 反查全局名，importer/isResolved 无关）。
  setOutputGlobals(rolldownOptions, (id) => resolveHook(id, undefined, true), opts);

  return resolveHook;
}
