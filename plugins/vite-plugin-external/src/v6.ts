import { isPlainObject } from 'is-what-type';
import type { ConfigEnv, DevEnvironment, HtmlTagDescriptor, IndexHtmlTransformResult, Plugin, UserConfig } from 'vite';

import { PLUGIN_NAME } from './common/constants';
import { logger } from './common/logger';
import { Resolver } from './common/Resolver';
import { setExternals } from './lib/handleExternals';
import { setOptimizeDeps } from './lib/handleOptimizeDeps';
import { buildOptions } from './lib/handleOptions';
import { cleanupCache } from './rollback';
import type { Options, ResolvedOptions } from './typings';

export default function v6(opts: Options): Plugin {
  let resolvedOptions: ResolvedOptions;
  let resolver: Resolver;

  return {
    name: PLUGIN_NAME,
    enforce: 'pre',
    async config(config: UserConfig, env: ConfigEnv) {
      resolvedOptions = buildOptions(opts, env);
      resolver = new Resolver(resolvedOptions.cacheDir);

      await setOptimizeDeps(resolver, resolvedOptions, config);
      resolver.useHook(setExternals(resolvedOptions, config));

      const { output } = config.build!.rollupOptions!;
      const isIIFE = output && (Array.isArray(output)
        ? output.some((o) => o.format === 'iife')
        : output.format === 'iife');

      if (opts.interop === 'auto' || !isIIFE) {
        config.build!.rollupOptions!.external = undefined;
      }
    },

    configResolved(config) {
      logger.debug('Resolved rollupOptions:', config.build.rollupOptions);

      // cleanup cache metadata
      const { externals } = resolvedOptions;
      if (isPlainObject(externals)) {
        cleanupCache(Object.keys(externals), config);
      }
    },

    async resolveId(id, importer, { isEntry }) {
      const info = await resolver.resolve(id, importer, isEntry);

      if (!info) {
        logger.trace(`'${id}' is not external.`);
        return;
      }

      if (info === true) {
        logger.debug(`'${id}' is externalized.`);
        return { id, external: true };
      }

      const { resolvedId, link } = info;
      const { mode } = this.environment;

      if (mode === 'build') {
        if (info.format === 'es') {
          logger.debug(`'${id}' is resolved to '${link}'.`);
          return { id: link!, external: true };
        }

        logger.debug(`'${id}' is resolved to '${resolvedId}'.`);
        return resolvedId;
      }

      const depsOptimizer = (this.environment as DevEnvironment).depsOptimizer!;
      const depInfo = depsOptimizer.registerMissingImport(id, resolvedId);
      const depId = depsOptimizer.getOptimizedDepId(depInfo);

      logger.debug(`'${id}' is resolved to ${depId}`);
      return depId;
    },

    transformIndexHtml(html: string): IndexHtmlTransformResult | undefined {
      const { stashMap } = resolver;
      const tags: HtmlTagDescriptor[] = [];
      stashMap.forEach((info) => {
        if (info.format === 'es') {
          tags.push({
            tag: 'link',
            attrs: {
              rel: 'modulepreload',
              href: info.link
            },
            injectTo: 'head'
          });
        }
      });
      if (tags.length > 0) {
        return {
          html,
          tags
        };
      }
    }
  };
}

