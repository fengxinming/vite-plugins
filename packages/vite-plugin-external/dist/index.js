"use strict";
const node_path = require("node:path");
const node_fs = require("node:fs");
const node_module = require("node:module");
const node_util = require("node:util");
const fsExtra = require("fs-extra");
function setExternals(rollupOptions, libNames) {
  if (libNames.length === 0) {
    return;
  }
  const { external } = rollupOptions;
  if (!external) {
    rollupOptions.external = libNames;
  } else if (typeof external === "string" || node_util.types.isRegExp(external) || Array.isArray(external)) {
    rollupOptions.external = libNames.concat(external);
  } else if (typeof external === "function") {
    rollupOptions.external = function(source, importer, isResolved) {
      if (libNames.includes(source)) {
        return true;
      }
      return external(source, importer, isResolved);
    };
  }
}
function rollupOutputGlobals(output, externals) {
  let { globals } = output;
  if (!globals) {
    globals = {};
    output.globals = globals;
  }
  Object.assign(globals, externals);
}
function setOutputGlobals(rollupOptions, externals) {
  if (!externals) {
    return;
  }
  let { output } = rollupOptions;
  if (!output) {
    output = {};
    rollupOptions.output = output;
  }
  if (Array.isArray(output)) {
    output.forEach((n) => {
      rollupOutputGlobals(n, externals);
    });
  } else {
    rollupOutputGlobals(output, externals);
  }
}
function createFakeLib(globalName, libPath) {
  const cjs = `module.exports = ${globalName};`;
  return fsExtra.outputFile(libPath, cjs, "utf-8");
}
async function addAliases(config, cacheDir, externals, libNames) {
  fsExtra.emptyDirSync(cacheDir);
  if (libNames.length === 0 || !externals) {
    return;
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
  if (!Array.isArray(alias)) {
    alias = Object.entries(alias).map(([key, value]) => {
      return { find: key, replacement: value };
    });
    resolve.alias = alias;
  }
  await Promise.all(libNames.map((libName) => {
    const libPath = node_path.join(cacheDir, `${libName.replace(/\//g, "_")}.js`);
    alias.push({
      find: new RegExp(`^${libName}$`),
      replacement: libPath
    });
    return createFakeLib(externals[libName], libPath);
  }));
}
function buildOptions(opts, mode) {
  let {
    cwd,
    cacheDir,
    externals,
    // eslint-disable-next-line prefer-const
    ...rest
  } = opts || {};
  const modeOptions = opts[mode];
  if (modeOptions) {
    Object.entries(modeOptions).forEach(([key, value]) => {
      if (value) {
        switch (key) {
          case "cwd":
            cwd = value;
            break;
          case "cacheDir":
            cacheDir = value;
            break;
          case "externals":
            externals = Object.assign({}, externals, value);
            break;
        }
      }
    });
  }
  if (!cwd) {
    cwd = process.cwd();
  }
  if (!cacheDir) {
    cacheDir = node_path.join(cwd, "node_modules", ".vite_external");
  } else if (!node_path.isAbsolute(cacheDir)) {
    cacheDir = node_path.join(cwd, cacheDir);
  }
  return {
    ...rest,
    cwd,
    cacheDir,
    externals
  };
}
function createPlugin(opts) {
  let libNames;
  return {
    name: "vite-plugin-external",
    enforce: opts.enforce,
    async config(config, { mode, command }) {
      const { cacheDir, externals, interop } = buildOptions(opts, mode);
      libNames = !externals ? [] : Object.keys(externals);
      let externalLibs = libNames;
      let globals = externals;
      if (command === "serve" || interop === "auto") {
        await addAliases(config, cacheDir, globals, libNames);
        externalLibs = [];
        globals = void 0;
      }
      if (command === "build") {
        if (opts.nodeBuiltins) {
          externalLibs = externalLibs.concat(node_module.builtinModules.map((builtinModule) => {
            return new RegExp(`^(?:node:)?${builtinModule}(?:/.+)*$`);
          }));
        }
        const { externalizeDeps } = opts;
        if (externalizeDeps) {
          externalLibs = externalLibs.concat(externalizeDeps.map((dep) => {
            return new RegExp(`^${dep}(?:/.+)*$`);
          }));
        }
      }
      let { build } = config;
      if (!build) {
        build = {};
        config.build = build;
      }
      let { rollupOptions } = build;
      if (!rollupOptions) {
        rollupOptions = {};
        build.rollupOptions = rollupOptions;
      }
      setExternals(rollupOptions, externalLibs);
      setOutputGlobals(rollupOptions, globals);
    },
    configResolved(config) {
      if (config.command === "serve") {
        const viteCacheDir = node_path.join(config.cacheDir, "deps", "_metadata.json");
        let metadata;
        try {
          metadata = JSON.parse(node_fs.readFileSync(viteCacheDir, "utf-8"));
        } catch (e) {
        }
        if (metadata && libNames && libNames.length) {
          const { optimized } = metadata;
          if (optimized && Object.keys(optimized).length) {
            libNames.forEach((libName) => {
              if (optimized[libName]) {
                delete optimized[libName];
              }
            });
          }
          node_fs.writeFileSync(viteCacheDir, JSON.stringify(metadata));
        }
      }
    }
  };
}
module.exports = createPlugin;
