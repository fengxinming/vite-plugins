"use strict";
const node_path = require("node:path");
const node_fs = require("node:fs");
const node_module = require("node:module");
const node_util = require("node:util");
const fsExtra = require("fs-extra");
function rollupOutputGlobals(output, externals) {
  let { globals } = output;
  if (!globals) {
    globals = {};
    output.globals = globals;
  }
  Object.assign(globals, externals);
}
function setOutputGlobals(rollupOptions, globals, externalGlobals) {
  if (!globals) {
    return;
  }
  if (typeof externalGlobals === "function") {
    rollupOptions.plugins = [
      externalGlobals(globals),
      ...rollupOptions.plugins || []
    ];
  } else {
    let { output } = rollupOptions;
    if (!output) {
      output = {};
      rollupOptions.output = output;
    }
    if (Array.isArray(output)) {
      output.forEach((n) => {
        rollupOutputGlobals(n, globals);
      });
    } else {
      rollupOutputGlobals(output, globals);
    }
  }
}
function setExternals(rollupOptions, externalNames) {
  if (externalNames.length === 0) {
    return;
  }
  const { external } = rollupOptions;
  if (!external) {
    rollupOptions.external = externalNames;
  } else if (typeof external === "string" || node_util.types.isRegExp(external) || Array.isArray(external)) {
    rollupOptions.external = externalNames.concat(external);
  } else if (typeof external === "function") {
    rollupOptions.external = function(source, importer, isResolved) {
      if (externalNames.some((libName) => node_util.types.isRegExp(libName) ? libName.test(source) : libName === source)) {
        return true;
      }
      return external(source, importer, isResolved);
    };
  }
}
function createFakeLib(globalName, libPath) {
  const cjs = `module.exports = ${globalName};`;
  return fsExtra.outputFile(libPath, cjs, "utf-8");
}
async function setAliases(config, cacheDir, globals) {
  fsExtra.emptyDirSync(cacheDir);
  if (!globals) {
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
  await Promise.all(Object.entries(globals).map(([libName, globalName]) => {
    const libPath = node_path.join(cacheDir, `${libName.replace(/\//g, "_")}.js`);
    alias.push({
      find: new RegExp(`^${libName}$`),
      replacement: libPath
    });
    return createFakeLib(globalName, libPath);
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
function pluginExternal(opts) {
  let externalNames;
  let globals;
  return {
    name: "vite-plugin-external",
    enforce: opts.enforce,
    async config(config, { mode, command }) {
      opts = buildOptions(opts, mode);
      globals = opts.externals;
      externalNames = globals ? Object.keys(globals) : [];
      if (externalNames.length === 0) {
        globals = void 0;
      }
      const cacheDir = opts.cacheDir;
      if (command === "serve" || opts.interop === "auto") {
        await setAliases(config, cacheDir, globals);
        return;
      }
      if (command === "build") {
        const { nodeBuiltins, externalizeDeps } = opts;
        if (nodeBuiltins) {
          externalNames = externalNames.concat(node_module.builtinModules.map((builtinModule) => {
            return new RegExp(`^(?:node:)?${builtinModule}(?:/.+)*$`);
          }));
        }
        if (externalizeDeps) {
          externalNames = externalNames.concat(externalizeDeps.map((dep) => {
            return node_util.types.isRegExp(dep) ? dep : new RegExp(`^${dep}(?:/.+)*$`);
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
      setExternals(rollupOptions, externalNames);
      setOutputGlobals(rollupOptions, globals, opts.externalGlobals);
    },
    configResolved(config) {
      if (config.command === "serve") {
        const depCache = node_path.join(config.cacheDir, "deps", "_metadata.json");
        let metadata;
        try {
          metadata = JSON.parse(node_fs.readFileSync(depCache, "utf-8"));
        } catch (e) {
          return;
        }
        if (metadata && externalNames && externalNames.length) {
          const { optimized } = metadata;
          if (optimized && Object.keys(optimized).length) {
            externalNames.forEach((libName) => {
              if (optimized[libName]) {
                delete optimized[libName];
              }
            });
          }
          node_fs.writeFileSync(depCache, JSON.stringify(metadata));
        }
      }
    }
  };
}
module.exports = pluginExternal;
