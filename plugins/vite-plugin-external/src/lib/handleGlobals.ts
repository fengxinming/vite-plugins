import { isFunction, isObject } from 'is-what-type';
import type { Rolldown } from 'vite';
import { getValue } from 'vp-runtime-helper';

import { logger } from '../common/logger';
import type { Options } from '../typings';

type OutputOptions = Exclude<Rolldown.RolldownOptions['output'], string | undefined | any[]>;

/**
 * Reverse-lookup function for the global name of an external id.
 *
 * Typically the resolveHook built by setExternals — returns
 *   - string  → named external (e.g. 'react' → 'React')
 *   - true    → pure external (no global name)
 *   - false   → not external
 *
 * The 2nd/3rd args are optional so a single-arg `(id) => ...` resolver
 * (used by handleGlobals' default branch, which only needs the id) is
 * assignable to this type.
 *
 * 反查 external id → 全局变量名的函数。通常是 setExternals 构建的
 * resolveHook——返回 string 表示命名 external（react → React）；
 * 返回 true 表示纯 external；false 表示不是 external。
 * 2/3 参数可选，让 handleGlobals 默认分支里只用 id 的单参 resolver
 * 也能赋值给本类型。
 */
export type GlobalNameResolver = (
  id: string,
  importer?: string | undefined,
  isResolved?: boolean,
) => string | boolean | null | undefined | void;

/**
 * Install 'output.globals' on a single Rolldown output.
 *
 * Merge strategy — "plugin wins, user declaration is the fallback".
 *
 * 合并策略："插件声明的优先，用户声明兜底"。
 *   1. Ask 'getGlobalName' (the resolveHook) for a string mapping. The hook
 *      is the user's authoritative intent (externals Record form), so a
 *      string return wins outright.
 *      先调 'getGlobalName'（resolveHook）拿字符串映射。hook 是用户的权威
 *      声明（externals Record 形态），返回 string 就直接用。
 *   2. If the hook returns a non-string (true / false / undefined), fall
 *      back to the user's pre-existing 'output.globals' declaration,
 *      supporting both function and object forms.
 *      没拿到字符串 → 兜底用用户在 vite.config 里写的 output.globals，
 *      支持函数和对象两种形态。
 *
 * Why this ordering:
 * 用户写的 'output.globals.react = 'ReactZZZ'' 不会覆盖插件 externals
 * Record 的声明（Record 是用户权威来源），但能为"非 Record 形态"
 * 的 external（函数、纯 RegExp 命中）提供兜底。
 *
 * Plugin Record wins over user 'output.globals' because the Record passed
 * to 'externals' is the user's authoritative intent. The original
 * 'output.globals' value is kept as a SAFETY NET for externals declared
 * without a global name (function-form externals, pure RegExp hits, etc.).
 */
function rolldownOutputGlobals(
  output: OutputOptions,
  getGlobalName: GlobalNameResolver,
): void {
  const { globals: originalGlobals } = output;

  output.globals = ((libName: string) => {
    // Plugin wins: ask the resolveHook for a string-form mapping.
    // 插件优先：调 resolveHook 反查字符串映射。
    const val = getGlobalName(libName);
    let globalName: string | undefined;
    if (typeof val === 'string') {
      globalName = val;
    }

    // Fallback to user's pre-declared output.globals (function or object).
    // 没拿到字符串 → 兜底用用户预先声明的 output.globals（函数或对象）。
    if (!globalName) {
      if (isFunction<(name: string) => string>(originalGlobals)) {
        globalName = originalGlobals(libName);
      }
      else if (isObject<Record<string, string>>(originalGlobals)) {
        globalName = originalGlobals[libName];
      }
    }

    logger.debug(`Output global: '${libName}' -> '${globalName}'.`);
    return globalName;
  }) as any;
}

/**
 * Decide which globals-writing strategy to apply.
 *
 * Two branches:
 *   (a) User passed 'options.externalGlobals' → **escape hatch** for fixing
 *       Rolldown/Rollup Issue #3188 (IIFE top-level require not rewritten
 *       to a window global in certain edge cases). Instead of
 *       'output.globals', we **prepend** a Rolldown plugin to
 *       'rolldownOptions.plugins'. The user's plugin runs its transform
 *       BEFORE Rolldown's own globals handling, letting them rewrite
 *       top-level 'require('x')' / 'import x from 'x'' straight to
 *       'window.X' AST accesses. The callback receives the same lookup
 *       function as 'output.globals': 'globals(id)' returns the string
 *       declared via the external map (or undefined if no mapping).
 *
 *       用户传了 'externalGlobals' → **逃生舱模式**。不再设置
 *       output.globals，而是把用户返回的 Rolldown 插件 prepend 到
 *       'rolldownOptions.plugins' 数组最前。这样用户插件的 transform 先于
 *       Rolldown 内置 globals 处理运行，可以直接把顶层 require/import 重写成
 *       window.xxx 的 AST 访问，用于修复 Issue #3188 边界场景。
 *       回调参数 'globals(id)' 跟 output.globals 反查逻辑等价，直接反查
 *       插件 externals 的结果（无映射返回 undefined）。
 *
 *   (b) Default branch — install the 'output.globals' function on EVERY
 *       Rolldown output object. Supports both single-object and output[]
 *       shapes Rolldown accepts.
 *
 *       默认分支 —— 给每个输出对象都装上 output.globals。兼容 Rolldown 原生
 *       两种写法：'output: { format: 'iife' }' 或
 *       'output: [{ format: 'iife' }, { format: 'es' }]'。
 *       多输出时必须每个输出对象都装，否则会出现"一半输出有全局变量替换、
 *       一半没有"的诡异结果。
 *
 * @param getGlobalName reverse-lookup function — usually the resolveHook
 *                      built by setExternals. Replaces the eager
 *                      globalObject side-effect: output.globals asks the
 *                      hook on demand, so no population order issues
 *                      between rolldownOptions.external and output.globals.
 *
 *                      反查函数——通常是 setExternals 构建的 resolveHook。
 *                      替代旧的同步 globalObject 副作用：output.globals 按需
 *                      调 hook 拿映射，避免 external 与 globals 调用顺序
 *                      导致 globalObject 还没写完就被读的 bug。
 */
export function setOutputGlobals(
  rolldownOptions: Rolldown.RolldownOptions,
  getGlobalName: GlobalNameResolver,
  opts: Options,
): void {
  const { externalGlobals } = opts;
  if (isFunction(externalGlobals)) {
    const plugins: Rolldown.Plugin[] = Array.isArray(rolldownOptions.plugins)
      ? (rolldownOptions.plugins as Rolldown.Plugin[])
      : [];
    // Prepend the escape-hatch plugin. Filter any null/undefined slots that
    // downstream config helpers occasionally leave behind.
    // 放在数组最前。同时过滤掉下游偶尔遗留的 null/undefined 项，避免 TS 报错。
    rolldownOptions.plugins = [
      externalGlobals(((id: string) => {
        const val = getGlobalName(id);
        const globalName = typeof val === 'string' ? val : undefined;
        if (globalName) {
          logger.debug(`External global: '${id}' -> '${globalName}'.`);
        }
        return globalName;
      }) as any),
      ...plugins.filter((p): p is NonNullable<Rolldown.Plugin> => p != null)
    ];
  }
  else {
    const output = getValue<OutputOptions>(rolldownOptions, 'output', {});

    // Support multi-output arrays — every output gets its own globals fn.
    // 兼容多输出：每一个输出对象都要独立安装 output.globals。
    if (Array.isArray(output)) {
      output.forEach((n) => {
        rolldownOutputGlobals(n, getGlobalName);
      });
    }
    else {
      rolldownOutputGlobals(output, getGlobalName);
    }
  }
}
