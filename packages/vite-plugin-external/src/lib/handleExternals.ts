import { builtinModules } from 'node:module';
import { types } from 'node:util';

import type { ExternalOption, RollupOptions } from 'rollup';
import type { UserConfig } from 'vite';
import { escapeRegex, getValue } from 'vp-runtime-helper';

import ExternalHook from '../common/ExternalHook';
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

export function setExternals(
  opts: ResolvedOptions,
  config: UserConfig
): ExternalFn {
  const externalHook = new ExternalHook();

  const { externals } = opts;

  if (externals) {
    externalHook.use(externals);
  }

  const rollupOptions: RollupOptions = getValue(config, 'build.rollupOptions', {});

  // externalize dependencies for build command
  const { nodeBuiltins, externalizeDeps, command } = opts;

  if (command === 'build') {
    // handle nodejs built-in modules
    if (nodeBuiltins) {
      let builtinModuleArray;
      externalHook.use(builtinModuleArray = builtinModules.map((builtinModule) => {
        return new RegExp(`^(?:node:)?${escapeRegex(builtinModule)}(?:/.+)*$`);
      }));

      logger.debug('Externalize nodejs built-in modules:', builtinModuleArray);
    }

    // externalize given dependencies
    if (externalizeDeps) {
      let deps;
      externalHook.use(deps = externalizeDeps.map((dep) => {
        return types.isRegExp(dep) ? dep : new RegExp(`^${escapeRegex(dep)}(?:/.+)*$`);
      }));

      logger.debug('Externalize given dependencies:', deps);
    }
  }

  // Merge external dependencies
  if (rollupOptions.external) {
    externalHook.use(rollupOptions.external);
  }

  const globalObject: Record<string, string> = {};
  const resolveHook: ExternalFn = function (
    id: string,
    importer: string | undefined,
    isResolved: boolean
  ): string | boolean {

    for (const hook of externalHook.hooks) {
      const val = hook(id, importer, isResolved);

      if (typeof val === 'string') {
        globalObject[id] = val;
        return val;
      }

      if (val) {
        logger.debug(`Externalized: '${id}'.`);
        return true;
      }
    }

    return false;
  };

  rollupOptions.external = resolveHook as unknown as ExternalOption;

  // Set `rollupOptions.output.globals`
  setOutputGlobals(rollupOptions, globalObject, opts);

  return resolveHook;
}
