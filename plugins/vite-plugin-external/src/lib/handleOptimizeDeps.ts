import type { Plugin } from 'esbuild';
import type { UserConfig } from 'vite';
import { isCSSRequest } from 'vite';
import { getValue } from 'vp-runtime-helper';

import { ESBUILD_PLUGIN_NAME } from '../common/constants';
import { logger } from '../common/logger';
import { Resolver } from '../common/Resolver';
import type { ExternalIIFE, ResolvedOptions } from '../typings';

const externalWithConversionNamespace = 'vite:dep-pre-bundle:external-conversion';
const convertedExternalPrefix = 'vite-dep-pre-bundle-external:';

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

        if (path.startsWith(convertedExternalPrefix)) {
          return {
            path: path.slice(convertedExternalPrefix.length),
            external: true
          };
        }

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
            namespace: externalWithConversionNamespace
          };
        }

        if ((info as ExternalIIFE).name) {
          logger.trace('Pre-bundling IIFE external:', {
            name: (info as ExternalIIFE).name,
            id: path,
            importer,
            isResolved
          });
        }
        else {
          logger.trace('Pre-bundling ES external:', {
            link: info.link,
            id: path,
            importer,
            isResolved
          });
        }

        // Collect resolved globals
        return {
          path: info.resolvedId
        };
      });

      build.onLoad(
        { filter: /./, namespace: externalWithConversionNamespace },
        (args) => {
          const modulePath = `"${convertedExternalPrefix}${args.path}"`;
          return {
            contents:
              isCSSRequest(args.path)
                ? `import ${modulePath};`
                : `export { default } from ${modulePath};
export * from ${modulePath};`,
            loader: 'js'
          };
        },
      );

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

  // const { externals } = opts;

  // if (isFunction<ExternalFn>(externals)) {
  //   config.optimizeDeps!.force = true;
  //   logger.debug('Force to optimize all dependencies due to \'options.externals\' is a function.');
  // }

  plugins.push(esbuildPluginResolve(resolver));
}
