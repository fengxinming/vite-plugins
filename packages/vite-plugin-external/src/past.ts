import type { ConfigEnv, DepOptimizationMetadata, OptimizedDepInfo, Plugin, UserConfig } from 'vite';
import { optimizeDeps } from 'vite';

import { PLUGIN_NAME } from './common/constants';
import { logger } from './common/logger';
import { Resolver } from './common/Resolver';
import { setExternals } from './lib/handleExternals';
import { setOptimizeDeps } from './lib/handleOptimizeDeps';
import { buildOptions, isRuntime } from './lib/handleOptions';
import { cleanupCache } from './rollback';
import { Options, ResolvedOptions } from './typings';

function getOptimizedDepId(depInfo: OptimizedDepInfo, isBuild: boolean): string {
  return isBuild ? depInfo.file : `${depInfo.file}?v=${depInfo.browserHash}`;
}

function getDepInfo(
  metadata: DepOptimizationMetadata,
  id: string
): OptimizedDepInfo | null {
  const optimized = metadata.optimized[id];
  if (optimized) {
    return optimized;
  }
  const chunk = metadata.chunks[id];
  if (chunk) {
    return chunk;
  }
  const missing = metadata.discovered[id];
  if (missing) {
    return missing;
  }

  return null;
}

export default function past(opts: Options): Plugin {
  let resolver: Resolver | null = null;
  let metadata: DepOptimizationMetadata;
  let resolvedOptions: ResolvedOptions;

  return {
    name: PLUGIN_NAME,
    async config(config: UserConfig, env: ConfigEnv) {
      resolvedOptions = buildOptions(opts, env);

      if (isRuntime(resolvedOptions)) {
        resolver = await setOptimizeDeps(resolvedOptions, config);
      }
      else {
        setExternals(resolvedOptions, config);
      }
    },

    async configResolved(config) {
      if (isRuntime(resolvedOptions)) {
        resolver && logger.debug('Stashed resolved path:', Array.from(resolver.stashMap.keys()));
      }
      else {
        logger.debug('Resolved rollupOptions:', config.build.rollupOptions);
      }

      // cleanup cache metadata
      cleanupCache(resolvedOptions.externals, config);
      metadata = await optimizeDeps(config, false);
    },

    async resolveId(id, importer, { isEntry }) {
      if (resolver === null) {
        logger.trace(`External resolver is not ready for "${id}".`);
        return;
      }

      const resolvedId = await resolver.resolve(id, importer, isEntry);

      if (resolvedId === true) {
        return { id, external: true };
      }

      if (!resolvedId) {
        logger.trace(`'${id}' is not resolved`);
        return;
      }

      if (resolvedOptions.command === 'build') {
        return resolvedId;
      }

      const depInfo = getDepInfo(metadata, id);

      if (depInfo === null) {
        logger.trace(`'${id}' is not resolved`);
        return;
      }

      const depId = getOptimizedDepId(depInfo, false);

      logger.trace(`'${id}' is resolved to ${depId}`);
      return depId;
    }
  };
}
