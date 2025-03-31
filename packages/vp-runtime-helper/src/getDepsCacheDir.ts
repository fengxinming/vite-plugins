import { resolve as pathResolve } from 'node:path';

import type { ResolvedConfig } from 'vite';
import { normalizePath } from 'vite';

import { getHash } from './getHash';

function getDepsCacheSuffix(config: ResolvedConfig, ssr: boolean): string {
  let suffix = '';
  if (config.command === 'build') {
    // Differentiate build caches depending on outDir to allow parallel builds
    const { outDir } = config.build;
    const buildId
      = outDir.length > 8 || outDir.includes('/') ? getHash(outDir) : outDir;
    suffix += `_build-${buildId}`;
  }
  if (ssr) {
    suffix += '_ssr';
  }
  return suffix;
}

function getDepsCacheDirPrefix(config: ResolvedConfig): string {
  return normalizePath(pathResolve(config.cacheDir, 'deps'));
}

export function getDepsCacheDir(config: ResolvedConfig, ssr: boolean): string {
  return getDepsCacheDirPrefix(config) + getDepsCacheSuffix(config, ssr);
}
