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

/**
 * 会被 sanitizeFileName 改写的字符：控制字符、URL/路径保留字符。
 * 拍平后必须编码掉，否则 Windows 上 `? * < > | "` 这些直接是非法文件名。
 */
// eslint-disable-next-line no-control-regex
const invalidUrlPathCharRE = /[\u0000-\u001F"#$%&*+,:;<=>?[\]^`{|}\u007F]/g;
const replaceNestedIdRE = /\s*>\s*/g;
export function flattenId(id: string): string {
  const flatId = limitFlattenIdLength(
    id
      // 先转义原串自带的下划线，后面的分隔符编码才不会和它撞名
      // （否则 'a__b' 和 'a.b' 会拍成同一个文件名）。
      .replaceAll(/_+/g, '$&__')
      .replaceAll('/', '_')
      .replaceAll('.', '__')
      .replace(replaceNestedIdRE, '_n_')
      .replace(invalidUrlPathCharRE, (c) => `_0${c.charCodeAt(0).toString(16)}_`),
  );
  return flatId;
}
