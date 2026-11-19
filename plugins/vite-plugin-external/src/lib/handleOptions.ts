import { isAbsolute, join } from 'node:path';

import { isAsyncFunction, isPlainObject } from 'is-what-type';
import type { ConfigEnv } from 'vite';

import { ExternalError } from '../common/ExternalError';
import { logger } from '../common/logger';
import type { ExternalEsConfig } from '../types/deps';
import type { BasicOptions, Options, ResolvedOptions } from '../types/options';

/**
 * Keys that a per-mode override block is allowed to set — exactly
 * keyof BasicOptions. Anything else in the block gets a warn and is
 * dropped, so a typo or a plugin-level field never fails silently.
 *
 * mode 覆盖块允许出现的字段 —— 恰好是 keyof BasicOptions。
 * 其余字段一律 warn 并丢弃，避免写错字段名或塞入插件级字段时静默失效。
 */
const OVERRIDABLE_KEYS = [
  'externals',
  'externalizeDeps',
  'nodeBuiltins',
  'logLevel',
  'cwd',
  'cacheDir'
] as const satisfies ReadonlyArray<keyof BasicOptions>;

export function defaultApply(_, env: ConfigEnv) {
  return !env.isPreview;
}

export function buildOptions(
  opts: Options,
  env: ConfigEnv,
): ResolvedOptions {
  const { mode } = env;
  let {
    cwd,
    cacheDir,
    logLevel,
    externals,
    nodeBuiltins,
    externalizeDeps,
    // eslint-disable-next-line prefer-const
    ...rest
  } = opts || {};
  // 索引签名值类型是 unknown（见 ModeOptions 注释），这里收窄回 BasicOptions。
  const modeOptions = rest[mode] as BasicOptions | undefined;

  if (modeOptions) {
    Object.entries(modeOptions).forEach(([key, value]) => {
      // null/undefined 视为未配置；nodeBuiltins 例外——显式 false 也要生效。
      if (value === undefined || value === null) {
        return;
      }
      switch (key) {
        case 'cwd':
          if (value) {
            cwd = value as string;
          }
          break;
        case 'cacheDir':
          if (value) {
            cacheDir = value as string;
          }
          break;
        case 'logLevel':
          if (value) {
            logLevel = value as typeof logLevel;
          }
          break;
        case 'externals':
          if (isPlainObject<Record<string, string | ExternalEsConfig>>(externals)
            && isPlainObject<Record<string, string | ExternalEsConfig>>(value)) {
            externals = Object.assign({}, externals, value);
          }
          else if (Array.isArray(value) && Array.isArray(externals)) {
            externals = Array.from(new Set(externals.concat(value)));
          }
          else {
            externals = value;
          }
          break;
        case 'nodeBuiltins':
          nodeBuiltins = value as boolean;
          break;
        case 'externalizeDeps':
          if (Array.isArray(value)) {
            externalizeDeps = Array.isArray(externalizeDeps)
              ? Array.from(new Set(externalizeDeps.concat(value)))
              : value;
          }
          break;
        default:
          logger.warn(
            `"${key}" is not overridable per mode (only ${OVERRIDABLE_KEYS.join(', ')}), ignored.`
          );
          break;
      }
    });

    delete rest[mode];
  }

  // externals 回调必须是同步函数：resolveHook 的三个消费点
  // （rolldownOptions.external、output.globals 反查、预打包 resolve）
  // 都是同步边界，async 函数返回的 Promise 会被当成 truthy →
  // 每个 id 都被误判为"纯 external"且丢失全局名映射，灾难性且难查。
  // 需要异步数据请先在 vite.config 顶层 await 备好，再传同步结果。
  if (typeof externals === 'function' && isAsyncFunction(externals)) {
    throw new ExternalError(
      '"externals" callback must be synchronous, but an async function was given. '
      + 'Prepare your data with top-level await in vite.config and pass a sync callback (or the object/array forms).',
    );
  }

  if (logLevel != null) {
    logger.level = logLevel;
  }

  logger.debug('Options:', opts);

  // Default cwd → default cacheDir → absolutise cacheDir.
  // Note: relative cacheDir is resolved from 'cwd' rather than process.cwd()
  // because in a monorepo the user may want cwd + relative cache dir.
  if (!cwd) {
    cwd = process.cwd();
  }
  if (!cacheDir) {
    cacheDir = join(cwd, 'node_modules', '.vite_external');
  }
  else if (!isAbsolute(cacheDir)) {
    cacheDir = join(cwd, cacheDir);
  }
  const resolvedOpts = Object.assign(
    {
      ...rest,
      cacheDir,
      cwd,
      externals,
      logLevel,
      nodeBuiltins,
      externalizeDeps
    },
    env,
  );

  logger.debug('Resolved Options:', resolvedOpts);

  return resolvedOpts as ResolvedOptions;
}

