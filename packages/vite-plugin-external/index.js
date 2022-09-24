'use strict';

const { writeFileSync, existsSync, mkdirSync, emptyDirSync } = require('fs-extra');
const { join } = require('path');

const { isArray } = Array;

function createCJSExportDeclaration(external) {
  return `module.exports = ${external};`;
}

function rollupExternal(rollupOptions, externals, externalKeys) {
  let { output, external } = rollupOptions;
  if (!output) {
    output = {};
    rollupOptions.output = output;
  }

  let { globals } = output;
  if (!globals) {
    globals = {};
    output.globals = globals;
  }
  Object.assign(globals, externals);

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
  let libMode = false;

  const externalCacheDir = opts.cacheDir || join(process.cwd(), 'node_modules', '.vite_external');

  return {
    name: 'external',

    config(config, { mode }) {
      let tmp;
      externals = Object.assign({}, opts.externals, (tmp = opts[mode]) && tmp.externals);
      externalLibs = Object.keys(externals);
      shouldSkip = !externalLibs.length;
      libMode = config.build && config.build.lib;

      if (shouldSkip) {
        return;
      }

      // 非开发环境
      if (mode !== 'development') {
        // 非开发环境库模式下，options钩子修改无效
        if (libMode) {
          let { rollupOptions } = config.build;
          if (!rollupOptions) {
            rollupOptions = {};
            config.build.rollupOptions = rollupOptions;
          }

          rollupExternal(rollupOptions, externals, externalLibs);
        }
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
    },

    options(opts) {
      if (shouldSkip || libMode) {
        return;
      }

      rollupExternal(opts, externals, externalLibs);
    }
  };
};
