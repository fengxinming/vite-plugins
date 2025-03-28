import { builtinModules } from 'node:module';
import { types } from 'node:util';

import type { ExternalOption, NullValue, RollupOptions } from 'rollup';
import type { UserConfig } from 'vite';

import { logger } from '../common/logger';
import { getValue } from '../common/util';
import { ExternalFn, ResolvedOptions } from '../typings';
import { setOutputGlobals } from './handleGlobals';

export function checkLibName(externalArray: Array<RegExp | string>, source: string) {
  return externalArray.some((external) =>
    (types.isRegExp(external) ? external.test(source) : external === source)
  );
}

export function collectExternals(
  globalObject: Record<string, any>,
  opts: ResolvedOptions
): any[] {
  const externalArray: any[] = Object.keys(globalObject);

  // externalize dependencies for build command
  const { nodeBuiltins, externalizeDeps } = opts;

  let builtinModuleArray: RegExp[] = [];
  let deps: Array<RegExp | string> = [];

  // handle nodejs built-in modules
  if (nodeBuiltins) {
    builtinModuleArray = builtinModules.map((builtinModule) => {
      return new RegExp(`^(?:node:)?${builtinModule}(?:/.+)*$`);
    });

    logger.debug('Externalize nodejs built-in modules:', builtinModuleArray);
  }

  // externalize given dependencies
  if (externalizeDeps) {
    deps = externalizeDeps.map((dep) => {
      return types.isRegExp(dep) ? dep : new RegExp(`^${dep}(?:/.+)*$`);
    });

    logger.debug('Externalize given dependencies:', deps);
  }

  return externalArray.concat(builtinModuleArray, deps);
}

function mergeExternals(
  externalArray: any[],
  originalExternal: ExternalOption | undefined
): Array<RegExp|string> | ((source: string, importer: string | undefined, isResolved: boolean) => boolean | NullValue) {
  // string or RegExp or array
  if (
    typeof originalExternal === 'string'
    || types.isRegExp(originalExternal)
    || Array.isArray(originalExternal)
  ) {
    return externalArray.concat(originalExternal);
  }

  // function
  if (typeof originalExternal === 'function') {
    return function (
      source: string,
      importer: string | undefined,
      isResolved: boolean
    ): boolean | null | undefined | void {
      return checkLibName(externalArray, source)
        ? true
        : originalExternal(source, importer, isResolved);
    };
  }

  return externalArray;
}

export function setExternals(
  opts: ResolvedOptions,
  config: UserConfig
): void {
  let globalObject: Record<string, string> = {};
  let externalFn: ExternalFn | undefined;
  const { externals } = opts;
  const whatType = typeof externals;

  if (whatType === 'function') {
    externalFn = externals as ExternalFn;
    logger.debug('`options.externals` is a function.');
  }
  else if (whatType === 'object' && externals !== null) {
    globalObject = externals as Record<string, string>;
    logger.debug('`options.externals` is an object.');
  }
  else {
    logger.debug('`options.externals` is not a function or object.');
  }

  const externalArray: any[] = collectExternals(globalObject, opts);
  const rollupOptions: RollupOptions = getValue(config, 'build.rollupOptions', {});
  const newExternals = mergeExternals(externalArray, rollupOptions.external);

  if (externalFn) {
    rollupOptions.external = function (
      source: string,
      importer: string | undefined,
      isResolved: boolean
    ): boolean | NullValue {
      let val = externalFn(source, importer, isResolved);
      logger.trace(
        `Got the global name "${val}". source: "${source}", importer: "${importer}", isResolved: ${isResolved}`
      );

      if (!val) {
        if (typeof newExternals === 'function') {
          val = newExternals(source, importer, isResolved);
        }
        else if (externalArray.length > 0) {
          val = externalArray.some((n) => {
            const isMatched = types.isRegExp(n) ? n.test(source) : n === source;

            if (isMatched) {
              logger.trace(`The module "${source}" will be externalized due to the match "${n}".`);
            }

            return isMatched;
          });
        }
      }
      else if (typeof val === 'string') {
        globalObject[source] = val;
      }

      if (val) {
        logger.trace(`The module "${source}" will be externalized.`);
      }

      return !!val;
    };
  }
  else if (externalArray.length > 0) {
    rollupOptions.external = newExternals;
  }

  // Set `rollupOptions.output.globals`
  setOutputGlobals(rollupOptions, globalObject, opts);
}
