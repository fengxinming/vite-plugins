import { isFunction, isObject } from 'is-what-type';
import type { Rolldown } from 'vite';
import { getValue } from 'vp-runtime-helper';

import { logger } from '../common/logger';
import { RolldownOutputOptions } from '../internal-types';

function rolldownOutputGlobals(
  output: RolldownOutputOptions,
  globalObject: Record<string, string>,
): void {
  const { globals: originalGlobals } = output;

  output.globals = ((libName: string) => {
    // 插件优先：查 resolveHook 命中时登记的字符串映射。
    const val = globalObject[libName];
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
    return globalName as string;
  });
}

export function setOutputGlobals(
  rolldownOptions: Rolldown.RolldownOptions,
  globalObject: Record<string, string>,
): void {
  const output = getValue<RolldownOutputOptions>(rolldownOptions, 'output', {});

  // 兼容多输出：每一个输出对象都要独立安装 output.globals。
  if (Array.isArray(output)) {
    output.forEach((n) => {
      rolldownOutputGlobals(n, globalObject);
    });
  }
  else {
    rolldownOutputGlobals(output, globalObject);
  }
}
