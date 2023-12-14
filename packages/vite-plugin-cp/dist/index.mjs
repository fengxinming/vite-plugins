import { isAbsolute, join, parse, relative } from "node:path";
import { statSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { pathExists, mkdirs, copy } from "fs-extra";
import { globby } from "globby";
function makeCopy(transform) {
  return transform ? function(from, to) {
    return readFile(from).then((buf) => transform(buf, from)).then((data) => {
      const { dir } = parse(to);
      return pathExists(dir).then((itDoes) => {
        if (!itDoes) {
          return mkdirs(dir);
        }
      }).then(() => {
        return writeFile(to, data);
      });
    });
  } : copy;
}
function transformName(name, rename) {
  if (typeof rename === "function") {
    return rename(name) || name;
  }
  return rename || name;
}
function createPlugin(opts) {
  const { hook = "closeBundle", enforce, targets, cwd = process.cwd(), globbyOptions } = opts || {};
  const plugin = {
    name: "vite:cp"
  };
  if (enforce) {
    plugin.enforce = enforce;
  }
  if (!Array.isArray(targets) || !targets.length) {
    return plugin;
  }
  const toAbsolutePath = (pth) => {
    if (!isAbsolute(pth)) {
      pth = join(cwd, pth);
    }
    return pth;
  };
  let called = false;
  plugin[hook] = async function() {
    if (called) {
      return;
    }
    called = true;
    const startTime = Date.now();
    await Promise.all(targets.map(({ src, dest, rename, flatten, globbyOptions: gOptions, transform }) => {
      dest = toAbsolutePath(dest);
      const cp = makeCopy(transform);
      const glob = (pattern) => {
        let notFlatten = false;
        try {
          notFlatten = statSync(pattern).isDirectory() && flatten === false;
        } catch (e) {
        }
        return globby(pattern, Object.assign({}, globbyOptions, gOptions)).then((matchedPaths) => {
          if (!matchedPaths.length) {
            throw new Error(`Could not find files with "${pattern}"`);
          }
          return matchedPaths.map((matchedPath) => {
            matchedPath = toAbsolutePath(matchedPath);
            const outputToDest = notFlatten ? function(matchedPath2) {
              const tmp = parse(relative(pattern, matchedPath2));
              return cp(matchedPath2, join(dest, tmp.dir, transformName(tmp.base, rename)));
            } : function(matchedPath2) {
              return cp(matchedPath2, join(dest, transformName(parse(matchedPath2).base, rename)));
            };
            return outputToDest(matchedPath);
          });
        });
      };
      if (typeof src === "string") {
        return glob(src);
      } else if (Array.isArray(src)) {
        return Promise.all(src.map(glob));
      }
      return null;
    }));
    console.info(`Done in ${Number((Date.now() - startTime) / 1e3).toFixed(1)}s`);
  };
  return plugin;
}
export {
  createPlugin as default
};
