import { statSync } from 'node:fs';
import { join, parse, relative } from 'node:path';

import type { CopyOptions } from 'fs-extra';
import { isObject } from 'is-what-type';
import type { GlobOptions } from 'tinyglobby';
import { glob } from 'tinyglobby';
import type { Plugin } from 'vite';
import { banner, displayTime, sleep, toAbsolutePath } from 'vp-runtime-helper';

import { logger, PLUGIN_NAME } from './logger';
import type { Options, Target } from './typings';
import { changeName, makeCopy, stringify } from './util';

export * from './typings';

async function doCopy(config: Target, cwd: string, globOptions: GlobOptions, copyOptions: CopyOptions) {
  const { src, rename, flatten, transform } = config;
  let { dest } = config;

  if (!src || !dest) {
    throw new Error(`${stringify(config)} target must have "src" and "dest" properties.`);
  }

  // dest becomes absolute path
  dest = toAbsolutePath(dest, cwd);
  const cpFile = makeCopy(transform);

  const run = async (source: string) => {
    // source becomes absolute path
    const absSource = toAbsolutePath(source, cwd);

    let isNotFlatten = false;
    try {
      // check if 'source' is directory
      isNotFlatten = statSync(absSource).isDirectory() && !flatten;
    }
    catch (e) {
      // 'source' is not a file or directory
    }

    // matched files and folders
    const matchedPaths = await glob(absSource, globOptions);

    // copy files when 'matchedPaths' is not empty
    if (!matchedPaths.length) {
      logger.warn(`Could not find files with "${source}".`);
      return null;
    }

    await Promise.all(matchedPaths.map((matchedPath: string) => {
      let targetFileName: string;
      let destDir = dest;

      if (isNotFlatten) {
        const tmp = parse(relative(absSource, matchedPath));
        targetFileName = tmp.base;
        destDir = join(destDir, tmp.dir);
      }
      else {
        targetFileName = parse(matchedPath).base;
      }

      const destPath = join(destDir, changeName(targetFileName, rename));

      return cpFile(matchedPath, destPath, copyOptions).then(() => {
        logger.trace(`Copied "${matchedPath}" to "${destPath}".`);
      }, (e) => {
        logger.warn(`Could not copy "${matchedPath}" to "${destPath}".`, e);
      });
    }));
  };

  if (typeof src === 'string') {
    await run(src);
  }
  else if (Array.isArray(src)) {
    await Promise.all(src.map(run));
  }
}

/**
 * Copy files and directories.
 *
 * @example
 * ```js
 * import { defineConfig } from 'vite';
 * import cp from 'vite-plugin-cp';
 *
 * export default defineConfig({
 *   plugins: [
 *     cp({
 *       targets: [
 *         // copy files of './node_modules/vite/dist' to './dist/test'
 *         { src: './node_modules/vite/dist', dest: './dist/test', flatten: false },
 *
 *         // copy files of './node_modules/vite/dist' to './dist/test2'
 *         // and keep the directory structure of copied files
 *         { src: './node_modules/vite/dist', dest: './dist/test2' },
 *
 *         // copy './node_modules/vite/README.md' to './dist/README.md'
 *         { src: './node_modules/vite/README.md', dest: './dist' },
 *       ]
 *     })
 *   ]
 * });
 * ```
 *
 * @param opts Options
 * @returns a vite plugin
 */
export default function pluginCp(opts: Options) {
  const {
    hook = 'closeBundle',
    enforce,
    targets,
    cwd = process.cwd(),
    globOptions,
    copyOptions,
    logLevel,
    delay,
    enableBanner
  } = opts || {};

  if (!Array.isArray(targets) || !targets.length) {
    logger.warn('No targets specified.');
    return;
  }

  if (enableBanner) {
    banner(PLUGIN_NAME);
  }

  if (logLevel) {
    logger.level = logLevel;
  }

  const plugin: Plugin = {
    name: PLUGIN_NAME
  };

  if (enforce) {
    plugin.enforce = enforce;
  }

  let called = false;

  plugin[hook] = async function () {
    // copy once
    if (called) {
      return;
    }

    if (delay !== void 0) {
      await sleep(delay);
    }

    called = true;

    const startTime = Date.now();

    await Promise.all(targets.map((target) => {
      if (!isObject(target)) {
        throw new TypeError(`${stringify(target)} target must be an object`);
      }

      return doCopy(
        target,
        cwd,
        Object.assign({}, globOptions, target.globOptions, {
          absolute: true,
          expandDirectories: true,
          onlyFiles: true
        }),
        Object.assign({}, copyOptions, target.copyOptions)
      );
    }));

    logger.info(`Done in ${displayTime(Date.now() - startTime)}`);
  };

  return plugin;
}
