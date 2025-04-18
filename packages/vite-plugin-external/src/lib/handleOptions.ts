import { isAbsolute, join } from 'node:path';

import { isPlainObject } from 'is-what-type';
import type { ConfigEnv } from 'vite';

import { logger } from '../common/logger';
import type { Options, ResolvedOptions } from '../typings';

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

  if (!cwd) {
    cwd = process.cwd();
  }
  if (!cacheDir) {
    cacheDir = join(cwd, 'node_modules', '.vite_external');
  }
  else if (!isAbsolute(cacheDir)) {
    cacheDir = join(cwd, cacheDir);
  }

  const resolvedOpts = Object.assign({
    ...rest,
    cacheDir,
    cwd,
    externals,
    logLevel
  }, env);

  logger.debug('Resolved Options:', resolvedOpts);

  return resolvedOpts;
}
