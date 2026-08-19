import { isAbsolute, join } from 'node:path';

import { isPlainObject } from 'is-what-type';
import type { ConfigEnv } from 'vite';

import { logger } from '../common/logger';
import type { Options, ResolvedOptions } from '../typings';

/**
 * Merge per-mode overrides, default cwd/cacheDir/logLevel, and spread
 * ConfigEnv fields to produce the single final options object carried
 * through every downstream step.
 *
 * 顺序（Ordering — non-empty values win，后注册覆盖前面的）：
 *   1. Root 'opts.{cwd, cacheDir, logLevel, externals, …}'.
 *      用户根配置的基础字段。
 *   2. Per-mode override at 'opts[env.mode]' (e.g. 'opts.development').
 *      Only the keys '{cwd, cacheDir, logLevel, externals}' are considered:
 *        - 'externals' as plain object → shallow merge (keeps root keys and
 *          overlays per-mode additions on top).
 *          externals 是对象 → 浅合并，保留根字段，模式字段增量覆盖。
 *        - 'externals' as array → concat + dedupe if root is also an array;
 *          otherwise replace root wholesale.
 *          externals 是数组 → root 也是数组时 concat + 去重，否则直接替换。
 *        - 'externals' as other types → direct replace.
 *          其他形态（函数 / 字符串 / 正则 / boolean）→ 直接替换。
 *        - 'cwd / cacheDir / logLevel' → direct replace if non-empty.
 *          非空就直接替换。
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
    // eslint-disable-next-line prefer-const
    ...rest
  } = opts || {};
  const modeOptions: Options | undefined = rest[mode];

  if (modeOptions) {
    Object.entries(modeOptions).forEach(([key, value]) => {
      if (value) {
        switch (key) {
          case 'cwd':
            cwd = value;
            break;
          case 'cacheDir':
            cacheDir = value;
            break;
          case 'logLevel':
            logLevel = value;
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
        }
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
      logLevel
    },
    env,
  );

  logger.debug('Resolved Options:', resolvedOpts);

  return resolvedOpts as ResolvedOptions;
}
