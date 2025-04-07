import { isFunction } from 'is-what-type';
import { Alias, UserConfig } from 'vite';
import { getValue } from 'vp-runtime-helper';

import { logger } from '../common/logger';
import { stash } from '../common/Resolver';
import { ResolvedOptions } from '../typings';
export async function setAliases(
  opts: ResolvedOptions,
  config: UserConfig,
): Promise<void> {
  const { externals } = opts;

  if (!externals) {
    logger.debug('\'options.externals\' is not specified.');
    return;
  }

  if (isFunction(externals)) {
    throw new TypeError('\'options.externals\' as function is not supported.');
  }

  const globalObject = externals;

  // empty globals
  if (Object.keys(globalObject).length === 0) {
    logger.warn('\'options.externals\' is empty.');
    return;
  }

  const { cacheDir } = opts;

  // // cleanup cache dir
  // emptyDirSync(cacheDir);
  // logger.debug('Cleanup stash dir.');

  let alias = getValue(config, 'resolve.alias', []);

  // #1 if alias is object type
  if (!Array.isArray(alias)) {
    alias = Object.entries(alias).map(([key, value]) => {
      return { find: key, replacement: value };
    });
    config.resolve!.alias = alias;
  }

  await Promise.all(
    Object.entries(globalObject).map(([libName, globalName]) => {
      return (async () => {
        const libPath = await stash(libName, globalName, cacheDir);
        (alias as Alias[]).push({
          find: new RegExp(`^${libName}$`),
          replacement: libPath
        });

        return {
          name: globalName,
          external: libName,
          resolvedId: libPath
        };
      })();
    })
  );
}
