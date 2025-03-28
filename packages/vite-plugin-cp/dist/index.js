"use strict";
const node_path = require("node:path");
const node_fs = require("node:fs");
const node_util = require("node:util");
const promises = require("node:fs/promises");
const fsExtra = require("fs-extra");
const tinyglobby = require("tinyglobby");
function isObject(v) {
  return v && typeof v === "object";
}
function stringify(value) {
  return node_util.inspect(value, { breakLength: Infinity });
}
function toAbsolutePath(pth, cwd) {
  if (!node_path.isAbsolute(pth)) {
    pth = node_path.join(cwd, pth);
  }
  return pth;
}
function makeCopy(transform) {
  return transform ? function(from, to) {
    return promises.readFile(from).then((buf) => transform(buf, from)).then((data) => {
      return fsExtra.outputFile(to, data);
    });
  } : fsExtra.copy;
}
function createPlugin(opts) {
  const { hook = "closeBundle", enforce, targets, cwd = process.cwd(), globOptions } = opts || {};
  if (!Array.isArray(targets) || !targets.length) {
    return;
  }
  const plugin = {
    name: "vite-plugin-cp"
  };
  if (enforce) {
    plugin.enforce = enforce;
  }
  let called = false;
  plugin[hook] = async function() {
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
      dest = toAbsolutePath(dest, cwd);
      const cpFile = makeCopy(transform);
      const run = async (pattern) => {
        pattern = toAbsolutePath(pattern, cwd);
        let isDir = false;
        try {
          isDir = node_fs.statSync(pattern).isDirectory();
        } catch (e) {
        }
        const isNotFlatten = isDir && !flatten;
        const matchedPaths = await tinyglobby.glob(pattern, Object.assign({
          absolute: true,
          expandDirectories: false,
          onlyFiles: false
        }, globOptions, gOptions));
        if (!matchedPaths.length) {
          throw new Error(`Could not find files with "${pattern}"`);
        }
        return matchedPaths.reduce((arr, matchedPath) => {
          const stat = node_fs.statSync(matchedPath);
          if (stat.isDirectory()) {
            arr.push(fsExtra.ensureDir(matchedPath));
          } else if (stat.isFile()) {
            let targetFileName;
            let destDir = dest;
            if (isNotFlatten) {
              const tmp = node_path.parse(node_path.relative(pattern, matchedPath));
              targetFileName = tmp.base;
              destDir = node_path.join(destDir, tmp.dir);
            } else {
              targetFileName = node_path.parse(matchedPath).base;
            }
            if (typeof rename === "function") {
              targetFileName = rename(targetFileName) || targetFileName;
            } else if (typeof rename === "string") {
              targetFileName = rename;
            }
            arr.push(cpFile(matchedPath, node_path.join(destDir, targetFileName)));
          }
          return arr;
        }, []);
      };
      if (typeof src === "string") {
        return run(src);
      } else if (Array.isArray(src)) {
        return Promise.all(src.map(run));
      }
      return null;
    }));
    console.info(`Done in ${Number((Date.now() - startTime) / 1e3).toFixed(1)}s`);
  };
  return plugin;
}
module.exports = createPlugin;
