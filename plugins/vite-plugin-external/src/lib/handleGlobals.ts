import { ensureType } from 'is-what-type';
import type { Rolldown } from 'vite';

import { logger } from '../common/logger';
import type { RolldownOutputOptions } from '../types/deps';

/**
 * 查询用户预先声明的 output.globals 兜底（函数或对象）。
 *
 * 插件自己的字符串映射优先；没命中时才回退到这里，保持"用户显式 globals 不会被
 * 插件静默丢弃"的语义。
 */
function fromOriginalGlobals(
  originalGlobals: RolldownOutputOptions['globals'],
  libName: string,
): string | undefined {
  if (!originalGlobals) {
    return undefined;
  }
  const originalType = typeof originalGlobals;
  if (ensureType<Rolldown.GlobalsFunction>(originalGlobals, originalType === 'function')) {
    return originalGlobals(libName);
  }
  if (ensureType<Record<string, string>>(originalGlobals, originalType === 'object')) {
    return originalGlobals[libName];
  }
  return undefined;
}

/**
 * 产出 output.globals 查询函数 —— 纯函数，不就地修改任何 output。
 *
 * 由 outputOptions 钩子按 output 逐个安装、按 format 门控（仅全局格式），
 * 放回新的 output 对象交给 Rolldown。config 钩子每轮都从原始用户配置重建，
 * 因此不会像就地包裹那样把上一轮的 wrapper 捕进下一轮、形成无界闭包链 ——
 * dev 重启不再在同一个对象上反复叠加 globals。
 *
 * 命中优先取插件登记的字符串映射（react → React）；未命中时回退到用户预声明
 * 的 output.globals（函数或对象），保持原有兜底语义。
 */
export function createGlobalsFn(
  globalObject: Record<string, string>,
  originalGlobals: RolldownOutputOptions['globals'],
): Rolldown.GlobalsFunction {
  return (libName: string) => {
    const val = globalObject[libName];
    const globalName = typeof val === 'string'
      ? val
      : fromOriginalGlobals(originalGlobals, libName);
    logger.debug(`Output global: '${libName}' -> '${globalName}'.`);
    return globalName as string;
  };
}
