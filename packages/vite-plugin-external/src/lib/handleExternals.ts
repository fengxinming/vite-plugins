import { builtinModules } from 'node:module';
import { types } from 'node:util';

import { isFunction, isObject } from 'is-what-type';
import type { ExternalOption, NullValue, RollupOptions } from 'rollup';
import type { UserConfig } from 'vite';
import { escapeRegex, getValue } from 'vp-runtime-helper';

import { logger } from '../common/logger';
import type { ExternalFn, ResolvedOptions } from '../typings';
import { setOutputGlobals } from './handleGlobals';

// function ensureArray<T>(
//   items: Array<T | false | NullValue> | T | false | NullValue
// ): T[] {
//   if (Array.isArray(items)) {
//     return items.filter(Boolean) as T[];
//   }
//   if (items) {
//     return [items];
//   }
//   return [];
// }

// function getIdMatcher<T extends any[]>(
//   option:
// 		| undefined
// 		| boolean
// 		| string
// 		| RegExp
// 		| Array<string | RegExp>
// 		| ((id: string, ...parameters: T) => boolean | null | void)
// ): ((id: string, ...parameters: T) => boolean) {
//   if (option === true) {
//     return () => true;
//   }
//   if (isFunction(option)) {
//     return (id, ...args) => (!id.startsWith('\0') && option(id, ...args)) || false;
//   }
//   if (option) {
//     const ids = new Set<string>();
//     const matchers: RegExp[] = [];
//     for (const value of ensureArray(option)) {
//       if (value instanceof RegExp) {
//         matchers.push(value);
//       }
//       else {
//         ids.add(value);
//       }
//     }
//     // eslint-disable-next-line @typescript-eslint/no-unused-vars
//     return (id: string, ..._args) => ids.has(id) || matchers.some((matcher) => matcher.test(id));
//   }
//   return () => false;
// }

function checkExternal(external: RegExp | string, source: string): boolean {
  return types.isRegExp(external) ? external.test(source) : external === source;
}

function checkExternalArray(external: Array<RegExp | string>, source: string): boolean {
  return external.some((external) => checkExternal(external, source));
}

function collectDeps(opts: ResolvedOptions): Array<RegExp | string> {
  const externalArray: Array<RegExp | string> = [];

  // externalize dependencies for build command
  const { nodeBuiltins, externalizeDeps } = opts;

  let builtinModuleArray: RegExp[] = [];
  let deps: Array<RegExp | string> = [];

  // handle nodejs built-in modules
  if (nodeBuiltins) {
    builtinModuleArray = builtinModules.map((builtinModule) => {
      return new RegExp(`^(?:node:)?${escapeRegex(builtinModule)}(?:/.+)*$`);
    });

    logger.debug('Externalize nodejs built-in modules:', builtinModuleArray);
  }

  // externalize given dependencies
  if (externalizeDeps) {
    deps = externalizeDeps.map((dep) => {
      return types.isRegExp(dep) ? dep : new RegExp(`^${escapeRegex(dep)}(?:/.+)*$`);
    });

    logger.debug('Externalize given dependencies:', deps);
  }

  return externalArray.concat(builtinModuleArray, deps);
}

function mergeOriginal(
  externalArray: Array<RegExp | string>,
  originalExternal: ExternalOption | undefined
): Array<RegExp | string> | ((
  source: string,
  importer: string | undefined,
  isResolved: boolean
) => boolean | NullValue) {
  // string or RegExp or array
  if (
    typeof originalExternal === 'string'
    || types.isRegExp(originalExternal)
    || Array.isArray(originalExternal)
  ) {
    return externalArray.concat(originalExternal);
  }

  // function
  if (isFunction(originalExternal)) {
    return function (
      source: string,
      importer: string | undefined,
      isResolved: boolean
    ): boolean | NullValue {
      return checkExternalArray(externalArray, source)
        ? true
        : originalExternal(source, importer, isResolved);
    };
  }

  return externalArray;
}

export function setExternals(
  opts: ResolvedOptions,
  config: UserConfig
): ExternalFn {
  let externalFn: ExternalFn;
  const globalObject: Record<string, string> = {};
  const { externals } = opts;

  if (isFunction<ExternalFn>(externals)) {
    logger.debug('\'options.externals\' is a function.');

    externalFn = externals;
  }
  else if (isObject<Record<string, string>>(externals)) {
    logger.debug('\'options.externals\' is an object.');

    externalFn = (id: string) => externals[id];
  }
  else {
    externalFn = () => false;
  }

  const rollupOptions: RollupOptions = getValue(config, 'build.rollupOptions', {});

  // Collect external dependencies
  const deps = collectDeps(opts);
  // Merge external dependencies
  const newExternals = mergeOriginal(deps, rollupOptions.external);

  const resolveHook: ExternalFn = function (
    id: string,
    importer: string | undefined,
    isResolved: boolean
  ): string | boolean | NullValue {
    let val = externalFn(id, importer, isResolved);

    if (!val) {
      if (isFunction<(
        source: string,
        importer: string | undefined,
        isResolved: boolean
      ) => boolean | NullValue>(newExternals)) {
        val = newExternals(id, importer, isResolved);
      }
      else if (newExternals.length > 0) {
        val = checkExternalArray(newExternals, id);
      }
    }
    else if (typeof val === 'string') {
      globalObject[id] = val;
    }

    if (val) {
      logger.debug(`External: '${id}'.`);
    }

    return val;
  };

  rollupOptions.external = resolveHook as unknown as ExternalOption;

  // Set `rollupOptions.output.globals`
  setOutputGlobals(rollupOptions, globalObject, opts);

  return resolveHook;
}
