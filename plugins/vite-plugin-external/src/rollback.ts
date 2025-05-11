import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { isPlainObject } from 'is-what-type';
import type { ConfigEnv, Plugin, ResolvedConfig, UserConfig } from 'vite';
import { getDepsCacheDir } from 'vp-runtime-helper';

import { PLUGIN_NAME } from './common/constants';
import { logger } from './common/logger';
import { setAliases } from './lib/handleAliases';
import { setExternals } from './lib/handleExternals';
import { buildOptions } from './lib/handleOptions';
import type { Options, ResolvedOptions } from './typings';

function isRuntime({ command, interop }: ResolvedOptions) {
  return command === 'serve' || ((command as any) === 'dev') || interop === 'auto';
}

export async function cleanupCache(
  deps: string[],
  config: ResolvedConfig
) {
  if (deps.length === 0) {
    return;
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
    for (const libName of deps) {
      if (optimized[libName]) {
        delete optimized[libName];
      }
    }

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
      const { externals } = resolvedOptions;
      if (isPlainObject(externals)) {
        cleanupCache(Object.keys(externals), config);
      }
    }
  };
}

export * from './typings';
