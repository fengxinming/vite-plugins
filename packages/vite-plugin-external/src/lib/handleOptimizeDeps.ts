import type { Plugin } from 'esbuild';
import { isFunction } from 'is-what-type';
import type { UserConfig } from 'vite';
import { getValue } from 'vp-runtime-helper';

import { ESBUILD_PLUGIN_NAME } from '../common/constants';
import { logger } from '../common/logger';
import { Resolver } from '../common/Resolver';
import type { ExternalFn, ResolvedOptions } from '../typings';

function esbuildPluginResolve(
  resolver: Resolver
): Plugin {
  return {
    name: ESBUILD_PLUGIN_NAME,
    setup(build) {
      logger.debug(`Setup esbuild plugin '${ESBUILD_PLUGIN_NAME}'.`);

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
          logger.trace(`The module '${path}' will be externalized.`);
          return {
            path,
            external: true
          };
        }

        logger.trace('Pre-bundling external:', {
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
        logger.debug('Pre-bundling externals:', Array.from(resolver.stashMap.keys()));
      });
    }
  };
}

export async function setOptimizeDeps(
  resolver: Resolver,
  opts: ResolvedOptions,
  config: UserConfig
): Promise<void> {
  const plugins = getValue(config, 'optimizeDeps.esbuildOptions.plugins', []);

  const { externals } = opts;

  if (isFunction<ExternalFn>(externals)) {
    config.optimizeDeps!.force = true;
    logger.debug('Force to optimize all dependencies due to \'options.externals\' is a function.');
  }

  plugins.push(esbuildPluginResolve(resolver));
}
