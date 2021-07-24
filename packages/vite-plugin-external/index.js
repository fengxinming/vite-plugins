'use strict';

const { writeFileSync, existsSync, mkdirSync, emptyDirSync } = require('fs-extra');
const { join } = require('path');

function createES5ExportDeclaration(external) {
  return `module.exports = ${external};`;
}

function createES6ExportDeclaration(external) {
  return `export default ${external}`;
}

module.exports = function ({ externals = {} } = {}) {
  const external = Object.keys(externals);
  if (!external.length) {
    return;
  }

  const externalCacheDir = join(process.cwd(), 'node_modules', '.vite_external');
  // const moduleMappingPath = {};
  const pathMappingModule = {};
  let mode;

  return {
    name: 'external',

    config(config, { mode: _mode }) {
      mode = _mode;

      if (_mode !== 'development') {
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

      for (const modName of external) {
        const modPath = join(externalCacheDir, `${modName.replace(/\//g, '_')}.js`);
        writeFileSync(modPath, createES5ExportDeclaration(externals[modName]));

        alias.push({ find: modName, replacement: modPath });
        // moduleMappingPath[modName] = modPath;
        pathMappingModule[modPath] = modName;
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
      external.push(...external);
    },

    load(id) {
      if (mode !== 'development') {
        return;
      }

      const modName = pathMappingModule[id];
      if (modName) {
        return createES6ExportDeclaration(modName);
      }
    }
  };
};
