import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { isFunction } from 'is-what-type';
import type { ConfigEnv, Plugin, ResolvedConfig, UserConfig } from 'vite';
import { getDepsCacheDir } from 'vp-runtime-helper';

import { PLUGIN_NAME } from './common/constants';
import { logger } from './common/logger';
import { setAliases } from './lib/handleAliases';
import { setExternals } from './lib/handleExternals';
import { buildOptions, isRuntime } from './lib/handleOptions';
import type { ExternalFn, Options, ResolvedOptions } from './typings';

export async function cleanupCache(
  externals: Record<string, string> | ExternalFn | undefined,
  config: ResolvedConfig
) {
  if (!externals) {
    return;
  }

  if (isFunction(externals)) {
    logger.warn('\'options.externals\' as function is not supported.');
  }

  const ssr = config.command === 'build' && !!config.build.ssr;
  const depsCacheDir = getDepsCacheDir(config, ssr);
  const cachedMetadataPath = join(depsCacheDir, '_metadata.json');

  let metadata;
  try {
    metadata = JSON.parse(readFileSync(cachedMetadataPath, 'utf-8'));
  }
  catch (e) {
    return;
  }

  if (!metadata) {
    return;
  }

  const { optimized } = metadata;
  if (optimized && Object.keys(optimized).length) {
    Object.keys(externals).forEach((libName) => {
      if (optimized[libName]) {
        delete optimized[libName];
      }
    });

    try {
      writeFileSync(cachedMetadataPath, JSON.stringify(metadata));
      logger.debug('Cleanup cache metadata.');
    }
    catch (e) { }
  }
}

export default function rollback(opts: Options): Plugin {
  let resolvedOptions: ResolvedOptions;

  return {
    name: PLUGIN_NAME,
    async config(config: UserConfig, env: ConfigEnv) {
      resolvedOptions = buildOptions(opts, env);

      if (isRuntime(resolvedOptions)) {
        await setAliases(resolvedOptions, config);
      }
      else {
        setExternals(resolvedOptions, config);
      }
    },
    configResolved(config) {
      if (isRuntime(resolvedOptions)) {
        logger.debug('Resolved alias:', config.resolve.alias);
      }
      else {
        logger.debug('Resolved rollupOptions:', config.build.rollupOptions);
      }

      // cleanup cache metadata
      cleanupCache(resolvedOptions.externals, config);
    }
  };
}

export * from './typings';
