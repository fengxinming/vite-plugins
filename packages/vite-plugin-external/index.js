'use strict';

const { writeFileSync, existsSync, mkdirSync, emptyDirSync } = require('fs-extra');
const { join } = require('path');

function createCJSExportDeclaration(external) {
  return `module.exports = ${external};`;
}

module.exports = function ({ externals = {} } = {}) {
  const externalLibs = Object.keys(externals);
  if (!externalLibs.length) {
    return;
  }

  const externalCacheDir = join(process.cwd(), 'node_modules', '.vite_external');

  return {
    name: 'external',

    config(config, { mode }) {
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
      if (!alias) {
        alias = [];
        resolve.alias = alias;
      }

      for (const libName of externalLibs) {
        const libPath = join(externalCacheDir, `${libName.replace(/\//g, '_')}.js`);
        writeFileSync(libPath, createCJSExportDeclaration(externals[libName]));

        alias.push({ find: libName, replacement: libPath });
      }
    },

    options(opts) {
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
