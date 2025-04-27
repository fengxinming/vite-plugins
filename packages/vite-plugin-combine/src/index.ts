import { existsSync, unlink, writeFileSync } from 'node:fs';
import { EOL } from 'node:os';

import type { InputOption } from 'rollup';
import { globSync } from 'tinyglobby';
import type { Plugin, PluginOption } from 'vite';
import dts from 'vite-plugin-dts';
import { banner, toAbsolutePath } from 'vp-runtime-helper';

import { makeESModuleCode, rebuildInput } from './common';
import { logger, PLUGIN_NAME } from './logger';
import type { Options } from './types';
export * from './types';

export default function pluginCombine(opts: Options): PluginOption {
  if (!opts) {
    opts = {} as Options;
  }

  if (opts.enableBanner) {
    banner(PLUGIN_NAME);
  }

  const { src, logLevel } = opts;
  if (logLevel) {
    logger.level = logLevel;
  }

  // 当前工作目录
  const cwd = opts.cwd || process.cwd();
  const files = globSync(src, { cwd, absolute: true });

  if (!files.length) {
    logger.warn(`No files found in '${src}'.`);
    return;
  }

  logger.debug(`Found ${files.length} files in '${src}':`, files);

  // 组合到目标文件中
  const target = opts.target || 'index.js';

  // target 绝对地址
  const absTarget = toAbsolutePath(target, cwd);

  if (existsSync(absTarget)) {
    throw new Error(`File '${absTarget}' already exists.`);
  }

  const viteCombine = {
    name: PLUGIN_NAME,
    enforce: ('enforce' in opts) ? opts.enforce : 'post',
    apply: ('apply' in opts) ? opts.apply : 'build',

    async config(config) {
      const combinedCode = makeESModuleCode(files, absTarget, opts);
      logger.debug(`Result:${EOL}${combinedCode}`);

      writeFileSync(absTarget, combinedCode, 'utf-8');

      const inputs = files.concat(absTarget);
      const { build } = config;
      let entry: InputOption | undefined;

      if (build) {
        const { lib } = build;

        // 库模式
        if (lib && typeof lib === 'object') {
          entry = lib.entry;
          logger.debug('Original `lib.entry`:', entry);

          entry = rebuildInput(entry, inputs);
          logger.debug('New `lib.entry`:', entry);
        }
      }

      entry = entry || inputs;
      logger.debug('Entry:', entry);

      return {
        build: {
          lib: {
            entry
          }
        }
      };
    },

    buildEnd() {
      unlink(absTarget, (err) => {
        if (err) {
          return;
        }
        logger.debug(`'${absTarget}' has been removed.`);
      });
    }
  } as Plugin;

  let dtsOpts = opts.dts;
  if (!dtsOpts) {
    return viteCombine;
  }
  if (dtsOpts === true) {
    dtsOpts = {};
  }

  return [
    viteCombine,
    dts(
      Object.assign({}, dtsOpts, {
        include: files.concat(absTarget)
      })
    )
  ];
}
