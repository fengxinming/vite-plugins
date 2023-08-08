'use strict';

const { writeFileSync, existsSync, mkdirSync, emptyDirSync } = require('fs-extra');
const { join } = require('path');

const { isArray } = Array;

function createCJSExportDeclaration(external) {
  return `module.exports = ${external};`;
}

function rollupOutputGlobals(output, externals) {
  let { globals } = output;
  if (!globals) {
    globals = {};
    output.globals = globals;
  }
  Object.assign(globals, externals);
}

function rollupExternal(rollupOptions, externals, externalKeys) {
  let { output, external } = rollupOptions;
  if (!output) {
    output = {};
    rollupOptions.output = output;
  }

  // 支持 output 是数组的情况
  if (Array.isArray(output)) {
    output.forEach((n) => {
      rollupOutputGlobals(n, externals);
    });
  }
  else {
    rollupOutputGlobals(output, externals);
  }

  if (!external) {
    external = [];
    rollupOptions.external = external;
  }
  external.push(...externalKeys);
}

module.exports = function (opts = {}) {
  let externals;
  let externalLibs;
  let shouldSkip = false;

  const externalCacheDir = opts.cacheDir || join(process.cwd(), 'node_modules', '.vite_external');

  return {
    name: 'external',

    config(config, { mode }) {
      let tmp;
      externals = Object.assign({}, opts.externals, (tmp = opts[mode]) && tmp.externals);
      externalLibs = Object.keys(externals);
      shouldSkip = !externalLibs.length;

      if (shouldSkip) {
        return;
      }

      // 非开发环境
      if (mode !== 'development') {
        // 有可能没有配置 build
        if (!config.build) {
          config.build = {};
        }

        let { rollupOptions } = config.build;
        if (!rollupOptions) {
          rollupOptions = {};
          config.build.rollupOptions = rollupOptions;
        }

        rollupExternal(rollupOptions, externals, externalLibs);
        return;
      }

      if (!existsSync) {
        mkdirSync(externalCacheDir);
      }
      else {
        emptyDirSync(externalCacheDir);
      }

      let { resolve } = config;
      if (!resolve) {
        resolve = {};
        config.resolve = resolve;
      }

      let { alias } = resolve;
      if (!alias || typeof alias !== 'object') {
        alias = [];
        resolve.alias = alias;
      }

      // #1 处理 alias 为 object 的情况
      if (!isArray(alias)) {
        alias = Object.entries(alias).map(([key, value]) => {
          return { find: key, replacement: value };
        });
        resolve.alias = alias;
      }

      for (const libName of externalLibs) {
        const libPath = join(externalCacheDir, `${libName.replace(/\//g, '_')}.js`);
        writeFileSync(libPath, createCJSExportDeclaration(externals[libName]));

        alias.push({ find: new RegExp(`^${libName}$`), replacement: libPath });
      }
    }
  };
};
