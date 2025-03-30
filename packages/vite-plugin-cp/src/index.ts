import { statSync } from 'node:fs';
import { join, parse, relative } from 'node:path';

import { glob, GlobOptions } from 'tinyglobby';
import { Plugin } from 'vite';

import { logFactory, logger, PLUGIN_NAME } from './logger';
import { Options, Target } from './typings';
import { changeName, isObject, makeCopy, sleep, stringify, toAbsolutePath } from './util';

function doCopy(config: Target, cwd: string, globOptions?: GlobOptions) {
  const { src, rename, flatten, globOptions: gOptions, transform } = config;
  let { dest } = config;

  if (!src || !dest) {
    throw new Error(`${stringify(config)} target must have "src" and "dest" properties.`);
  }

  // dest become absolute path
  dest = toAbsolutePath(dest, cwd);
  const cpFile = makeCopy(transform);

  const run = async (source: string) => {
    // source become absolute path
    const absSource = toAbsolutePath(source, cwd);

    let isNotFlatten = false;
    try {
      // check if 'source' is directory
      isNotFlatten = statSync(absSource).isDirectory() && flatten === false;
    }
    catch (e) {
      // 'source' is not a file or directory
    }

    // matched files and folders
    const matchedPaths = await glob(
      absSource,
      Object.assign({}, globOptions, gOptions, {
        absolute: true,
        expandDirectories: true,
        onlyFiles: true
      })
    );

    // copy files when 'matchedPaths' is not empty
    if (!matchedPaths.length) {
      logger.warn(`Could not find files with "${source}".`);
      return null;
    }

    return matchedPaths.map((matchedPath: string) => {
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

      return cpFile(matchedPath, destPath).then(() => {
        logger.trace(`Copied "${matchedPath}" to "${destPath}".`);
      }, () => {
        logger.warn(`Could not copy "${matchedPath}" to "${destPath}".`);
      });
    });
  };

  if (typeof src === 'string') {
    return run(src);
  }
  else if (Array.isArray(src)) {
    return Promise.all(src.map(run));
  }

  return null;
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
 *         { src: './node_modules/vite/dist', dest: './dist/test' },
 *
 *         // copy files of './node_modules/vite/dist' to './dist/test2'
 *         // and keep the directory structure of copied files
 *         { src: './node_modules/vite/dist', dest: './dist/test2', flatten: false },
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
    logLevel,
    delay
  } = opts || {};

  if (!Array.isArray(targets) || !targets.length) {
    return;
  }

  if (logLevel) {
    logFactory.updateLevel(logLevel);
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
        throw new Error(`${stringify(target)} target must be an object`);
      }

      return doCopy(target, cwd, globOptions);
    }));

    logger.info(`Done in ${Number((Date.now() - startTime) / 1000).toFixed(1)}s`);
  };

  return plugin;
}
