import { isPlainObject } from 'is-what-type';
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

  if (!isPlainObject(externals)) {
    throw new TypeError('\'options.externals\' is not an object.');
  }

  // empty globals
  if (Object.keys(externals).length === 0) {
    logger.warn('\'options.externals\' is empty.');
    return;
  }
  const globalObject = externals;
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
        const { resolvedId } = await stash(libName, globalName, cacheDir);
        (alias as Alias[]).push({
          find: new RegExp(`^${libName}$`),
          replacement: resolvedId
        });

        return {
          name: globalName,
          external: libName,
          resolvedId: resolvedId
        };
      })();
    })
  );
}
