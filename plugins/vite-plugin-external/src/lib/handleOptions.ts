import { isAbsolute, join } from 'node:path';

import { isPlainObject } from 'is-what-type';
import type { ConfigEnv } from 'vite';

import { logger } from '../common/logger';
import type { ResolvedOptions } from '../internal-types';
import type { BasicOptions, Options } from '../types';

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

/**
 * Merge per-mode overrides, default cwd/cacheDir/logLevel, and spread
 * ConfigEnv fields to produce the single final options object carried
 * through every downstream step.
 *
 * 顺序（Ordering — non-empty values win，后注册覆盖前面的）：
 *   1. Root 'opts.{cwd, cacheDir, logLevel, externals, nodeBuiltins,
 *      externalizeDeps, …}' 用户根配置的基础字段。
 *   2. Per-mode override at 'opts[env.mode]' (e.g. 'opts.development').
 *      Only BasicOptions keys are honoured:
 *        - 'externals' as plain object → shallow merge (keeps root keys and
 *          overlays per-mode additions on top).
 *          externals 是对象 → 浅合并，保留根字段，模式字段增量覆盖。
 *        - 'externals' as array → concat + dedupe if root is also an array;
 *          otherwise replace root wholesale.
 *          externals 是数组 → root 也是数组时 concat + 去重，否则直接替换。
 *        - 'externals' as other types → direct replace.
 *          其他形态（函数 / 字符串 / 正则 / boolean）→ 直接替换。
 *        - 'externalizeDeps' → concat + dedupe if both sides are arrays
 *          (same semantics as array externals); otherwise replace.
 *          root 与 mode 都是数组时 concat + 去重，否则直接替换。
 *        - 'nodeBuiltins' → direct replace; an explicit `false` is honoured
 *          so a mode block can turn OFF a root-level `true`.
 *          直接替换；显式 false 也生效，允许 mode 块关闭根配置的 true。
 *        - 'cwd / cacheDir / logLevel' → direct replace if non-empty.
 *          非空就直接替换。
 *        - any other key → warn + drop (plugin-level fields like interop /
 *          apply / enableBanner are NOT per-mode overridable by design).
 *          其他 key → 警告并丢弃（interop / apply / enableBanner 等插件级
 *          字段设计上不支持按模式覆盖）。
 *   3. The mode key itself is deleted from 'rest' (clean pass-through).
 *      模式字段本身从透传中删除，避免污染下游。
 *   4. Defaults: 'cwd ??= process.cwd()',
 *      'cacheDir ??= ${cwd}/node_modules/.vite_external',
 *      relative 'cacheDir' is resolved relative to 'cwd' (NOT process.cwd()).
 *      补默认值：cwd → process.cwd()，cacheDir → ${cwd}/node_modules/.vite_external。
 *      注意相对 cacheDir 是相对于 cwd 而非 process.cwd()。
 *   5. ConfigEnv (mode, command, ssrBuild…) is spread onto the returned
 *      object, so every downstream function can do 'opts.command === 'build''
 *      or 'opts.mode === 'production'' without a separate ConfigEnv arg.
 *      把 ConfigEnv 字段一起挂到返回值，下游判断 command/mode 不用再单独拿参数。
 */
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
          if (isPlainObject<Record<string, string>>(value)) {
            externals = Object.assign({}, externals, value);
          }
          else if (Array.isArray(value)) {
            if (Array.isArray(externals)) {
              externals = Array.from(new Set(externals.concat(value)));
            }
            else {
              externals = value;
            }
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
