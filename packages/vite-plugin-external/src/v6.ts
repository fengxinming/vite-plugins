import type { ConfigEnv, Plugin, UserConfig } from 'vite';
import { DevEnvironment } from 'vite';

import { PLUGIN_NAME } from './common/constants';
import { logger } from './common/logger';
import { Resolver } from './common/Resolver';
import { setExternals } from './lib/handleExternals';
import { setOptimizeDeps } from './lib/handleOptimizeDeps';
import { buildOptions, isRuntime } from './lib/handleOptions';
import { cleanupCache } from './rollback';
import { Options, ResolvedOptions } from './typings';

export default function v6(opts: Options): Plugin {
  let resolvedOptions: ResolvedOptions;
  let resolver: Resolver | null = null;

  return {
    name: PLUGIN_NAME,
    enforce: opts.interop === 'auto' ? 'pre' : opts.enforce,
    async config(config: UserConfig, env: ConfigEnv) {
      resolvedOptions = buildOptions(opts, env);

      if (isRuntime(resolvedOptions)) {
        resolver = await setOptimizeDeps(resolvedOptions, config);
      }
      else {
        setExternals(resolvedOptions, config);
      }
    },

    configResolved(config) {
      if (isRuntime(resolvedOptions)) {
        resolver && logger.debug('Stashed resolved path:', Array.from(resolver.stashMap.keys()));
      }
      else {
        logger.debug('Resolved rollupOptions:', config.build.rollupOptions);
      }

      // cleanup cache metadata
      cleanupCache(resolvedOptions.externals, config);
    },

    async resolveId(id, importer, { isEntry }) {
      if (resolver === null) {
        logger.trace(`External resolver is not ready for "${id}".`);
        return;
      }

      const info = await resolver.resolve(id, importer, isEntry);


      if (!info) {
        logger.trace(`'${id}' is not external.`);
        return;
      }

      if (info === true) {
        logger.trace(`'${id}' is marked as external.`);
        return { id, external: true };
      }

      const { resolvedId } = info;
      const { mode } = this.environment;

      if (mode === 'build') {
        logger.trace(`'${id}' is resolved to ${resolvedId}`);
        return resolvedId;
      }

      const depsOptimizer = (this.environment as DevEnvironment).depsOptimizer!;
      const depInfo = depsOptimizer.registerMissingImport(id, resolvedId);
      const depId = depsOptimizer.getOptimizedDepId(depInfo);

      logger.trace(`'${id}' is resolved to ${depId}`);
      return depId;
    }
  };
}

