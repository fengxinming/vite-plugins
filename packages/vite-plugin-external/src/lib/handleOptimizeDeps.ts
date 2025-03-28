import type { UserConfig } from 'vite';

import { ESBUILD_PLUGIN_NAME } from '../common/constants';
import { logger } from '../common/logger';
import { Resolver } from '../common/Resolver';
import { getValue } from '../common/util';
import type { ExternalFn, ResolvedOptions } from '../typings';
import { checkLibName, collectExternals } from './handleExternals';

export async function setOptimizeDeps(
  opts: ResolvedOptions,
  config: UserConfig
): Promise<Resolver | null> {
  let externalEntries: Array<[string, string]> | undefined;
  let externalFn: ExternalFn | undefined;

  const { externals } = opts;
  const whatType = typeof externals;

  const resolver = new Resolver(opts.cacheDir);

  if (whatType === 'function') {
    externalFn = externals as ExternalFn;

    logger.debug('`options.externals` is a function.');

    resolver.addHook(externalFn);
  }
  else if (whatType === 'object' && externals !== null) {
    externalEntries = Object.entries(externals as Record<string, string>);

    if (!externalEntries.length) {
      logger.warn('`options.externals` is empty.');
      return null;
    }

    logger.debug('`options.externals` is an object.');

    await resolver.stashObject(externals as Record<string, string>);
    resolver.stashed = true;
  }

  const newExternals = collectExternals({}, opts);
  if (newExternals.length > 0) {
    resolver.addHook((id: string) => {
      return checkLibName(newExternals, id);
    });
  }

  const plugins = getValue(config, 'optimizeDeps.esbuildOptions.plugins', []);
  plugins.push({
    name: ESBUILD_PLUGIN_NAME,
    setup(build) {
      logger.debug(`Setup esbuild plugin "${ESBUILD_PLUGIN_NAME}".`);

      build.onResolve({
        filter: /.*/
        // namespace: 'file',
      }, async (args) => {
        const { path, importer, kind } = args;
        const globalName = await resolver.resolve(path, importer, kind === 'entry-point');

        if (globalName) {
          // External module
          if (globalName === true) {
            return {
              path,
              external: true
            };
          }

          // Collect resolved globals
          if (typeof globalName === 'string') {
            return {
              path: globalName
            };
          }
        }
      });

      build.onEnd(() => {
        resolver.stashed = true;

        logger.debug('Pre-bundling externals:', Array.from(resolver.stashMap.keys()));
      });
    }
  });

  return resolver;
}
