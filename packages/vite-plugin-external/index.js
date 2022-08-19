'use strict';

const { writeFileSync, existsSync, mkdirSync, emptyDirSync } = require('fs-extra');
const { join } = require('path');

const { isArray } = Array;

function createCJSExportDeclaration(external) {
  return `module.exports = ${external};`;
}

module.exports = function (opts = {}) {
  let externals;
  let externalLibs;
  let shouldSkip = false;

  const externalCacheDir = join(process.cwd(), 'node_modules', '.vite_external');

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

      // 非开发环境略过
      if (mode !== 'development') {
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
      if (shouldSkip) {
        return;
      }

      let { output, external } = opts;
      if (!output) {
        output = {};
        opts.output = output;
      }

      let { globals } = output;
      if (!globals) {
        globals = {};
        output.globals = globals;
      }
      Object.assign(globals, externals);

      if (!external) {
        external = [];
        opts.external = external;
      }
      external.push(...externalLibs);
    }
  };
};
