"use strict";
const node_path = require("node:path");
const node_fs = require("node:fs");
const promises = require("node:fs/promises");
const fsExtra = require("fs-extra");
const globby = require("globby");
function makeCopy(transform) {
  return transform ? function(from, to) {
    return promises.readFile(from).then((buf) => transform(buf, from)).then((data) => {
      const { dir } = node_path.parse(to);
      return fsExtra.pathExists(dir).then((itDoes) => {
        if (!itDoes) {
          return fsExtra.mkdirs(dir);
        }
      }).then(() => {
        return promises.writeFile(to, data);
      });
    });
  } : fsExtra.copy;
}
function transformName(name, rename) {
  if (typeof rename === "function") {
    return rename(name) || name;
  }
  return rename || name;
}
function createPlugin(opts) {
  const { hook = "writeBundle", enforce, targets, cwd = process.cwd(), globbyOptions } = opts || {};
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
    if (!node_path.isAbsolute(pth)) {
      pth = node_path.join(cwd, pth);
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
    await Promise.all(targets.map(({ src, dest, rename, flatten, transform }) => {
      dest = toAbsolutePath(dest);
      const cp = makeCopy(transform);
      const glob = (pattern) => {
        let notFlatten = false;
        try {
          notFlatten = node_fs.statSync(pattern).isDirectory() && flatten === false;
        } catch (e) {
        }
        return globby.globby(pattern, globbyOptions).then((matchedPaths) => {
          if (!matchedPaths.length) {
            throw new Error(`Could not find files with "${pattern}"`);
          }
          return matchedPaths.map((matchedPath) => {
            matchedPath = toAbsolutePath(matchedPath);
            const outputToDest = notFlatten ? function(matchedPath2) {
              const tmp = node_path.parse(node_path.relative(pattern, matchedPath2));
              return cp(matchedPath2, node_path.join(dest, tmp.dir, transformName(tmp.base, rename)));
            } : function(matchedPath2) {
              return cp(matchedPath2, node_path.join(dest, transformName(node_path.parse(matchedPath2).base, rename)));
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
module.exports = createPlugin;
