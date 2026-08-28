import { isFunction, isObject } from 'is-what-type';
import type { Rolldown } from 'vite';
import { getValue } from 'vp-runtime-helper';

import { logger } from '../common/logger';
import type { Options } from '../types';

type OutputOptions = Exclude<Rolldown.RolldownOptions['output'], string | undefined | any[]>;

/**
 * external id → 全局变量名的反查函数类型。
 *
 * 通常是 setExternals 构建的 resolveHook：
 *   - 返回 string → 命名 external（如 react → React）
 *   - 返回 true   → 纯 external（无全局名）
 *   - 返回 false  → 不是 external
 *
 * 2/3 参数可选，让默认分支里只用 id 的单参 resolver 也能赋值给本类型。
 */
export type GlobalNameResolver = (
  id: string,
  importer?: string | undefined,
  isResolved?: boolean,
) => string | boolean | null | undefined | void;

/**
 * 给单个 Rolldown output 对象安装 output.globals。
 *
 * 合并策略："插件声明优先，用户声明兜底"。
 *   1. 先调 getGlobalName（resolveHook）拿字符串映射。hook 是用户的权威声明
 *      （externals Record 形态），返回 string 就直接用。
 *   2. hook 没返回字符串时，兜底用用户在 vite.config 里预先声明的
 *      output.globals，支持函数和对象两种形态。
 *
 * 为什么这个顺序？
 * 用户写的 output.globals.react = 'ReactZZZ' 不会覆盖插件 externals Record
 * 的声明（Record 才是用户的权威来源），但能为"非 Record 形态"的 external
 * （函数形态、纯正则命中）提供兜底。
 */
function rolldownOutputGlobals(
  output: OutputOptions,
  getGlobalName: GlobalNameResolver,
): void {
  const { globals: originalGlobals } = output;

  output.globals = ((libName: string) => {
    // 插件优先：调 resolveHook 反查字符串映射。
    const val = getGlobalName(libName);
    let globalName: string | undefined;
    if (typeof val === 'string') {
      globalName = val;
    }

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
 * 决定使用哪种 globals 写入策略。
 *
 * 两个分支：
 *   (a) 用户传了 options.externalGlobals → **逃生舱模式**，用于修复
 *       Rolldown/Rollup Issue #3188（IIFE 输出时顶层 require 没被正确替换成
 *       window.xxx 的边界场景）。不再设置 output.globals，而是把用户返回的
 *       Rolldown 插件 prepend 到 rolldownOptions.plugins 数组最前面。
 *       这样用户插件的 transform 先于 Rolldown 内置 globals 处理运行，
 *       可以直接把顶层 require/import 重写成 window.xxx 的 AST 访问。
 *       回调参数 globals(id) 跟 output.globals 反查逻辑等价，无映射返回 undefined。
 *
 *   (b) 默认分支 —— 给每个输出对象都装上 output.globals。兼容 Rolldown 原生
 *       两种写法：output: { format: 'iife' } 或 output: [{…}, {…}]。
 *       多输出时每个输出对象都要独立安装，否则会出现"一半有全局替换一半没有"的诡异结果。
 *
 * @param getGlobalName 反查函数——通常是 setExternals 构建的 resolveHook。
 *                      替代旧的同步 globalObject 副作用：output.globals 按需
 *                      调 hook 拿映射，避免 external 与 globals 的调用顺序
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
    // 放在数组最前。同时过滤掉下游偶尔遗留的 null/undefined 项，避免 TS 报错。
    rolldownOptions.plugins = [
      externalGlobals((id: string) => {
        const val = getGlobalName(id);
        logger.debug(`External global: '${id}' -> '${val}'.`);

        return val as any;
      }),
      ...plugins.filter((p): p is NonNullable<Rolldown.Plugin> => p != null)
    ];
  }
  else {
    const output = getValue<OutputOptions>(rolldownOptions, 'output', {});

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
