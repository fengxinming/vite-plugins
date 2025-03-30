import { SpawnSyncReturns } from 'node:child_process';
import crypto from 'node:crypto';
import { resolve as pathResolve } from 'node:path';

import spawn from 'cross-spawn';
import figlet from 'figlet';
import picocolors from 'picocolors';
import type { ResolvedConfig } from 'vite';
import { normalizePath, version } from 'vite';

import { logger } from './logger';

function toPath(deepKey: string): string[] {
  const result: string[] = [];
  const length = deepKey.length;
  if (length === 0) {
    return result;
  }
  let index = 0;
  let key = '';
  let quoteChar = '';
  let bracket = false;
  if (deepKey.charCodeAt(0) === 46) {
    result.push('');
    index++;
  }
  while (index < length) {
    const char = deepKey[index];
    if (quoteChar) {
      if (char === '\\' && index + 1 < length) {
        index++;
        key += deepKey[index];
      }
      else if (char === quoteChar) {
        quoteChar = '';
      }
      else {
        key += char;
      }
    }
    else if (bracket) {
      if (char === '"' || char === "'") {
        quoteChar = char;
      }
      else if (char === ']') {
        bracket = false;
        result.push(key);
        key = '';
      }
      else {
        key += char;
      }
    }
    else if (char === '[') {
      bracket = true;
      if (key) {
        result.push(key);
        key = '';
      }
    }
    else if (char === '.') {
      if (key) {
        result.push(key);
        key = '';
      }
    }
    else {
      key += char;
    }
    index++;
  }
  if (key) {
    result.push(key);
  }
  return result;
}

function isDeepKey(key: string | number) {
  switch (typeof key) {
    case 'number':
      return false;
    case 'string': {
      return key.includes('.') || key.includes('[') || key.includes(']');
    }
  }
}


function getWithPath(object: Record<string, any>, path: string | string[], defaultValue: any) {
  if (path.length === 0 || object == null) {
    return defaultValue;
  }

  let lastPath: string = '';
  let lastObject: Record<string, any> = object;
  let current: Record<string, any> | void | null = null;
  const len = path.length - 1;
  let index = 0;

  const next = (givenValue: any): void => {
    lastPath = path[index];
    current = lastObject[lastPath];
    if (current == null) {
      current = givenValue;
      lastObject[lastPath] = current;
    }
  };

  for (; index < len; index++) {
    next({});
    lastObject = current as never;
  }

  if (index === len) {
    next(defaultValue);
  }

  return current;
}

function getValue<T = any>(object: Record<string, any>, path: string | string[], defaultValue?: any): T {
  if (object == null) {
    return defaultValue;
  }

  switch (typeof path) {
    case 'string': {
      const result = object[path];
      if (result === void 0) {
        if (isDeepKey(path)) {
          return getValue(object, toPath(path), defaultValue);
        }
        // Set default value
        object[path] = defaultValue;
        return defaultValue;
      }
      return result;
    }
    case 'number': {
      const result = object[path];
      if (result === void 0) {
        // Set default value
        object[path] = defaultValue;
        return defaultValue;
      }
      return result;
    }
    default: {
      if (Array.isArray(path)) {
        return getWithPath(object, path, defaultValue);
      }
      const result = object[path];
      if (result === void 0) {
        // Set default value
        object[path] = defaultValue;
        return defaultValue;
      }
      return result;
    }
  }
}

const escapeRegexRE = /[-/\\^$*+?.()|[\]{}]/g;
function escapeRegex(str: string): string {
  return str.replace(escapeRegexRE, '\\$&');
}

const hash
  = (crypto as any).hash
  ?? ((
    algorithm: string,
    data: crypto.BinaryLike,
    outputEncoding: crypto.BinaryToTextEncoding,
  ) => crypto.createHash(algorithm).update(data).digest(outputEncoding));

function getHash(text: Buffer | string, length = 8): string {
  const h = hash('sha256', text, 'hex').substring(0, length);
  if (length <= 64) {
    return h;
  }
  return h.padEnd(length, '_');
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
const flattenId = (id: string): string => {
  const flatId = limitFlattenIdLength(
    id
      .replace(replaceSlashOrColonRE, '_')
      .replace(replaceDotRE, '__')
      .replace(replaceNestedIdRE, '___')
      .replace(replaceHashRE, '____'),
  );
  return flatId;
};

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

function getDepsCacheDir(config: ResolvedConfig, ssr: boolean): string {
  return getDepsCacheDirPrefix(config) + getDepsCacheSuffix(config, ssr);
}

function banner(text: string, opts?: any): void {
  // eslint-disable-next-line no-console
  console.log(figlet.textSync(text, opts));
}

const color = {} as Record<keyof Omit<typeof picocolors, 'createColors'>, (...args: any[]) => void>;
Object.entries(picocolors).forEach(([key, value]) => {
  color[key] = (text: string) => {
    // eslint-disable-next-line no-console
    console.log(value(text));
  };
});

function getRuntimeViteVersion(): string {
  const { argv } = process;
  let viteVersion: string;
  try {
    const result: SpawnSyncReturns<Buffer> = spawn.sync(argv[0], [argv[1], '-v']);
    const str = result.stdout.toString().trim();
    const matched = /.*vite\/([\d.]+)\s+/.exec(str);
    if (matched) {
      viteVersion = matched[1];
    }
    else {
      throw new Error(result.stderr.toString().trim() || 'Empty vite version.');
    }
  }
  catch (e) {
    logger.error('Failed to get vite version.', e);
    viteVersion = version;
  }

  return viteVersion;
}

export {
  banner,
  color,
  escapeRegex,
  flattenId,
  getDepsCacheDir,
  getRuntimeViteVersion,
  getValue
};
