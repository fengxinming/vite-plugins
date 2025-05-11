import { isFunction, isObject } from 'is-what-type';
import type { InputPluginOption, OutputOptions, RollupOptions } from 'rollup';
import { getValue } from 'vp-runtime-helper';

import { logger } from '../common/logger';
import { Options } from '../typings';

function rollupOutputGlobals(
  output: OutputOptions,
  globalObject: Record<string, string>
): void {
  const { globals: originalGlobals } = output;

  output.globals = (libName: string) => {
    let globalName = globalObject[libName];

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
  };
}

export function setOutputGlobals(
  rollupOptions: RollupOptions,
  globalObject: Record<string, any>,
  opts: Options
): void {
  const { externalGlobals } = opts;
  if (isFunction(externalGlobals)) {
    const fn = rollupOptions.external as any;
    rollupOptions.plugins = [
      externalGlobals((id: string) => {
        const globalName =  fn(id, undefined, true);
        if (typeof globalName === 'string') {
          logger.debug(`External global: '${id}' -> '${globalName}'.`);
        }
        return globalName;
      }),
      ...((rollupOptions.plugins as InputPluginOption[]) || [])
    ];
  }
  else {
    const output = getValue(rollupOptions, 'output', {});

    // compat Array
    if (Array.isArray(output)) {
      output.forEach((n) => {
        rollupOutputGlobals(n, globalObject);
      });
    }
    else {
      rollupOutputGlobals(output, globalObject);
    }
  }
}
