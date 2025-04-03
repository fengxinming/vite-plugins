import { isFunction, isObject } from 'is-what-type';
import { InputPluginOption, OutputOptions, RollupOptions } from 'rollup';
import { getValue } from 'vp-runtime-helper';

import { logger } from '../common/logger';
import { Options } from '../typings';

function rollupOutputGlobals(
  output: OutputOptions,
  globalObject: Record<string, any>
): void {
  const { globals: originalGlobals } = output;

  output.globals = (libName: string) => {
    let globalName = globalObject[libName];
    logger.trace(`Got the global name "${globalName}".`, 'external:', libName);

    if (!globalName) {
      if (isFunction<(name: string) => string>(originalGlobals)) {
        globalName = originalGlobals(libName);
      }
      else if (isObject<Record<string, string>>(originalGlobals)) {
        globalName = originalGlobals[libName];
      }
    }

    logger.trace(`The global name "${globalName}" will be resolved.`);
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
    rollupOptions.plugins = [
      externalGlobals((id: string) => {
        return globalObject[id];
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
