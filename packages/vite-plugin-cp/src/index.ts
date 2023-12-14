import { join, isAbsolute, parse, relative } from 'node:path';
import { statSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { Plugin } from 'vite';
import { copy, pathExists, mkdirs } from 'fs-extra';
import { globby, Options as GlobbyOptions } from 'globby';

export interface Target {
  /** Path or glob of what to copy. */
  src: string | string[];

  /** One or more destinations where to copy. */
  dest: string;

  /** Rename the file after copying. */
  rename?: string | ((name: string) => string);

  /** Remove the directory structure of copied files. */
  flatten?: boolean;

  /** Options for globby. See more at https://github.com/sindresorhus/globby#options */
  globbyOptions?: GlobbyOptions;

  /** Transform the file before copying. */
  transform?: (buf: Buffer, matchedPath: string) => string | Buffer | Promise<string | Buffer>;
}

export interface Options {
  /** Default `'closeBundle'`, vite hook the plugin should use. */
  hook?: string;

  /** It may be needed to enforce the order of the plugin or only apply at build time.  */
  enforce?: 'pre' | 'post';

  /** Options for globby. See more at https://github.com/sindresorhus/globby#options */
  globbyOptions?: GlobbyOptions;

  /** Default `process.cwd()`, The current working directory in which to search. */
  cwd?: string;

  /** Array of targets to copy. A target is an object with properties */
  targets: Target[];
}

function makeCopy(transform?: (buf: Buffer, matchedPath: string) => string | Buffer | Promise<string | Buffer>) {
  return transform
    ? function (from: string, to: string) {
      return readFile(from)
        .then((buf: Buffer) => transform(buf, from))
        .then((data: string | Buffer) => {
          const { dir } = parse(to);
          return pathExists(dir).then((itDoes) => {
            if (!itDoes) {
              return mkdirs(dir);
            }
          }).then(() => {
            return writeFile(to, data);
          });
        });
    }
    : copy;
}

function transformName(name: string, rename?: string | ((name: string) => string)): string {
  if (typeof rename === 'function') {
    return rename(name) || name;
  }

  return rename || name;
}

/**
 * Copy files and directories.
 *
 * @param opts Options
 * @returns a vite plugin
 */
export default function createPlugin(opts: Options): Plugin {
  const {
    hook = 'closeBundle',
    enforce,
    targets,
    cwd = process.cwd(),
    globbyOptions
  } = opts || {};

  const plugin: Plugin = {
    name: 'vite:cp'
  };

  if (enforce) {
    plugin.enforce = enforce;
  }

  if (!Array.isArray(targets) || !targets.length) {
    return plugin;
  }

  const toAbsolutePath = (pth: string) => {
    if (!isAbsolute(pth)) {
      pth = join(cwd, pth);
    }
    return pth;
  };

  let called = false;

  plugin[hook] = async function () {
    // copy once
    if (called) {
      return;
    }

    called = true;

    const startTime = Date.now();
    await Promise.all(targets.map(({ src, dest, rename, flatten, globbyOptions: gOptions, transform }) => {
      dest = toAbsolutePath(dest);
      const cp = makeCopy(transform);

      const glob = (pattern: string) => {
        let notFlatten = false;
        try {
          notFlatten = statSync(pattern).isDirectory() && flatten === false;
        }
        catch (e) {}

        return globby(pattern, Object.assign({}, globbyOptions, gOptions)).then((matchedPaths) => {
          if (!matchedPaths.length) {
            throw new Error(`Could not find files with "${pattern}"`);
          }

          return matchedPaths.map((matchedPath) => {
            matchedPath = toAbsolutePath(matchedPath);

            const outputToDest = notFlatten
              ? function (matchedPath: string) {
                const tmp = parse(relative(pattern, matchedPath));
                return cp(
                  matchedPath,
                  join(dest, tmp.dir, transformName(tmp.base, rename))
                );
              }
              : function (matchedPath: string) {
                return cp(
                  matchedPath,
                  join(dest, transformName(parse(matchedPath).base, rename))
                );
              };
            return outputToDest(matchedPath);
          });
        });
      };

      if (typeof src === 'string') {
        return glob(src);
      }
      else if (Array.isArray(src)) {
        return Promise.all(src.map(glob));
      }

      return null;
    }));

    console.info(`Done in ${Number((Date.now() - startTime) / 1000).toFixed(1)}s`);
  };

  return plugin;
}
