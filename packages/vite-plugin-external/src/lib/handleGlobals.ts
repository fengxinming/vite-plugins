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
    logger.trace(`Output global: "${libName}" -> "${globalName}".`);

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
  globalObject: Record<string, string>,
  opts: Options
): void {
  const { externalGlobals } = opts;
  if (isFunction(externalGlobals)) {
    rollupOptions.plugins = [
      externalGlobals((id: string) => {
        const globalName =  globalObject[id];
        logger.trace(`External globals: "${id}" -> "${globalName}".`);
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
