import { emptyDirSync } from 'fs-extra';
import { Alias, UserConfig } from 'vite';

import { logger } from '../common/logger';
import { eachExternal, stash } from '../common/Resolver';
import { getValue } from '../common/util';
import { ResolvedOptions } from '../typings';
export async function setAliases(
  opts: ResolvedOptions,
  config: UserConfig,
): Promise<void> {
  const { externals } = opts;
  if (typeof externals === 'function') {
    throw new TypeError('`options.externals` function is not supported.');
  }

  if (!externals) {
    logger.debug('`options.externals` is not specified.');
    return;
  }

  const globalObject = externals;

  // empty globals
  if (Object.keys(globalObject).length === 0) {
    logger.warn('`options.externals` is empty.');
    return;
  }

  const { cacheDir } = opts;

  // cleanup cache dir
  emptyDirSync(cacheDir);
  logger.debug('Cleanup stash dir.');

  let alias = getValue(config, 'resolve.alias', []);

  // #1 if alias is object type
  if (!Array.isArray(alias)) {
    alias = Object.entries(alias).map(([key, value]) => {
      return { find: key, replacement: value };
    });
    config.resolve!.alias = alias;
  }

  await eachExternal(globalObject, cacheDir, async (libName, globalName) => {
    const libPath = await stash(libName, globalName, cacheDir);
    (alias as Alias[]).push({
      find: new RegExp(`^${libName}$`),
      replacement: libPath
    });
    return libPath;
  });
}
