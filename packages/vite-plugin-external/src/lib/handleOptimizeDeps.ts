import type { Plugin } from 'esbuild';
import { isFunction, isObject } from 'is-what-type';
import type { UserConfig } from 'vite';
import { getValue } from 'vp-runtime-helper';

import { ESBUILD_PLUGIN_NAME } from '../common/constants';
import { logger } from '../common/logger';
import { Resolver } from '../common/Resolver';
import type { ExternalFn, ResolvedOptions } from '../typings';
import { checkLibName, collectExternals } from './handleExternals';

function esbuildPluginResolve(
  resolver: Resolver
): Plugin {
  return {
    name: ESBUILD_PLUGIN_NAME,
    setup(build) {
      logger.debug(`Setup esbuild plugin "${ESBUILD_PLUGIN_NAME}".`);

      build.onResolve({
        filter: /.*/
        // namespace: 'file',
      }, async (args) => {
        const { path, importer, kind } = args;

        const isResolved = kind === 'entry-point';
        const info = await resolver.resolve(path, importer, isResolved);

        if (!info) {
          return;
        }

        // External module
        if (info === true) {
          logger.trace(`The module "${path}" will be externalized.`);
          return {
            path,
            external: true
          };
        }

        logger.trace('Pre-bundling:', {
          name: info.name,
          id: path,
          importer,
          isResolved
        });

        // Collect resolved globals
        return {
          path: info.resolvedId
        };
      });

      build.onEnd(() => {
        resolver.stashed = true;

        logger.debug('Pre-bundling externals:', Array.from(resolver.stashMap.keys()));
      });
    }
  };
}

export async function setOptimizeDeps(
  opts: ResolvedOptions,
  config: UserConfig
): Promise<Resolver | null> {
  let externalEntries: Array<[string, string]> | undefined;
  let externalFn: ExternalFn | undefined;

  const { externals } = opts;

  const resolver = new Resolver(opts.cacheDir);

  if (isFunction<ExternalFn>(externals)) {
    externalFn = externals;

    logger.debug('`options.externals` is a function.');

    resolver.addHook(externalFn);
  }
  else if (isObject<Record<string, string>>(externals)) {
    externalEntries = Object.entries(externals);

    if (!externalEntries.length) {
      logger.warn('`options.externals` is empty.');
      return null;
    }

    logger.debug('`options.externals` is an object.');

    await resolver.stashObject(externals);
    resolver.stashed = true;
  }

  const newExternals = collectExternals({}, opts);
  if (newExternals.length > 0) {
    resolver.addHook((id: string) => {
      return checkLibName(newExternals, id);
    });
  }

  const plugins = getValue(config, 'optimizeDeps.esbuildOptions.plugins', []);
  config.optimizeDeps!.force = true;
  plugins.push(esbuildPluginResolve(resolver));

  return resolver;
}
