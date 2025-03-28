import { statSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { isAbsolute, join, parse, relative } from 'node:path';
import { inspect } from 'node:util';

import { copy, ensureDir, outputFile } from 'fs-extra';
import { glob } from 'tinyglobby';
import { Plugin } from 'vite';

import { Options, transformFile } from './typings';

function isObject<T>(v: T) {
  return v && typeof v === 'object';
}

function stringify(value) {
  return inspect(value, { breakLength: Infinity });
}

function toAbsolutePath(pth: string, cwd: string): string {
  if (!isAbsolute(pth)) {
    pth = join(cwd, pth);
  }
  return pth;
}

function makeCopy(transform?: transformFile) {
  return transform
    ? function (from: string, to: string) {
      return readFile(from)
        .then((buf: Buffer) => transform(buf, from))
        .then((data: string | Buffer) => {
          return outputFile(to, data as any);
        });
    }
    : copy;
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
 *         // copy files of './node_modules/vite/dist' to 'dist/test'
 *         { src: './node_modules/vite/dist', dest: 'dist/test' },
 *
 *         // copy files of './node_modules/vite/dist' to 'dist/test2'
 *         // and keep the directory structure of copied files
 *         { src: './node_modules/vite/dist', dest: 'dist/test2', flatten: false },
 *
 *         // copy './node_modules/vite/README.md' to 'dist'
 *         { src: './node_modules/vite/README.md', dest: 'dist' },
 *       ]
 *     })
 *   ]
 * });
 * ```
 *
 * @param opts Options
 * @returns a vite plugin
 */
export default function createPlugin(opts: Options) {
  const {
    hook = 'closeBundle',
    enforce,
    targets,
    cwd = process.cwd(),
    globOptions
  } = opts || {};

  if (!Array.isArray(targets) || !targets.length) {
    return;
  }

  const plugin: Plugin = {
    name: 'vite-plugin-cp'
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

    called = true;

    const startTime = Date.now();

    await Promise.all(targets.map((target) => {
      if (!isObject(target)) {
        throw new Error(`${stringify(target)} target must be an object`);
      }

      const { src, rename, flatten, globOptions: gOptions, transform } = target;
      let { dest } = target;

      if (!src || !dest) {
        throw new Error(`${stringify(target)} target must have "src" and "dest" properties`);
      }

      // dest become absolute path
      dest = toAbsolutePath(dest, cwd);
      const cpFile = makeCopy(transform);

      const run = async (pattern: string) => {
        // src become absolute path
        pattern = toAbsolutePath(pattern, cwd);

        let isDir = false;
        try {
          // check if 'pattern' is directory
          isDir = statSync(pattern).isDirectory();
        }
        catch (e) {
          // 'pattern' is not a file or directory
        }

        const isNotFlatten = isDir && !flatten;

        // matched files and folders
        const matchedPaths = await glob(
          pattern,
          Object.assign({
            absolute: true,
            expandDirectories: false,
            onlyFiles: false
          }, globOptions, gOptions)
        );
        // copy files when 'matchedPaths' is not empty
        if (!matchedPaths.length) {
          throw new Error(`Could not find files with "${pattern}"`);
        }

        return matchedPaths.reduce((arr, matchedPath) => {
          const stat = statSync(matchedPath);
          if (stat.isDirectory()) {
            arr.push(ensureDir(matchedPath));
          }
          else if (stat.isFile()) {
            let targetFileName: string;
            let destDir = dest;

            if (isNotFlatten) {
              const tmp = parse(relative(pattern, matchedPath));
              targetFileName = tmp.base;
              destDir = join(destDir, tmp.dir);
            }
            else {
              targetFileName = parse(matchedPath).base;
            }

            if (typeof rename === 'function') {
              targetFileName = rename(targetFileName) || targetFileName;
            }
            else if (typeof rename === 'string') {
              targetFileName = rename;
            }

            arr.push(cpFile(matchedPath, join(destDir, targetFileName)));
          }
          return arr;
        }, [] as Array<Promise<any>>);
      };

      if (typeof src === 'string') {
        return run(src);
      }
      else if (Array.isArray(src)) {
        return Promise.all(src.map(run));
      }

      return null;
    }));

    console.info(`Done in ${Number((Date.now() - startTime) / 1000).toFixed(1)}s`);
  };

  return plugin;
}
