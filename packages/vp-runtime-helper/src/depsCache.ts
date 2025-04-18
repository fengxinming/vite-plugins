import { resolve as pathResolve } from 'node:path';

import type { ResolvedConfig } from 'vite';
import { normalizePath } from 'vite';

import { getHash } from './hash';

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

const FLATTEN_ID_HASH_LENGTH = 8;
const FLATTEN_ID_MAX_FILE_LENGTH = 170;
const limitFlattenIdLength = (
  id: string,
  limit: number = FLATTEN_ID_MAX_FILE_LENGTH,
): string => {
  if (id.length <= limit) {
    return id;
  }
  return `${id.slice(0, limit - (FLATTEN_ID_HASH_LENGTH + 1))}_${getHash(id)}`;
};

const replaceSlashOrColonRE = /[/:]/g;
const replaceDotRE = /\./g;
const replaceNestedIdRE = /\s*>\s*/g;
const replaceHashRE = /#/g;
export function flattenId(id: string): string {
  const flatId = limitFlattenIdLength(
    id
      .replace(replaceSlashOrColonRE, '_')
      .replace(replaceDotRE, '__')
      .replace(replaceNestedIdRE, '___')
      .replace(replaceHashRE, '____'),
  );
  return flatId;
}
