"use strict";
const node_util = require("node:util");
const fsExtra = require("fs-extra");
const node_path = require("node:path");
function get(obj, key) {
  if (obj == null) {
    return {};
  }
  key.split(".").forEach((name) => {
    let val = obj[name];
    if (val == null) {
      val = {};
      obj[name] = val;
    }
    obj = val;
  });
  return obj;
}
function rollupOutputGlobals(output, externals) {
  let { globals } = output;
  if (!globals) {
    globals = {};
    output.globals = globals;
  }
  Object.assign(globals, externals);
}
function rollupExternal(rollupOptions, externals, libNames) {
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
function createFakeLib(globalName, libPath) {
  const cjs = `module.exports = ${globalName};`;
  return fsExtra.outputFile(libPath, cjs, "utf-8");
}
function createPlugin(opts) {
  return {
    name: "vite:external",
    enforce: opts.enforce,
    async config(config, { mode }) {
      let { cwd, cacheDir, externals } = opts;
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
        cacheDir = node_path.join(cwd, "node_modules", ".vite", "vite:external");
      }
      const libNames = !externals ? [] : Object.keys(externals);
      const shouldSkip = !libNames.length;
      if (shouldSkip) {
        return;
      }
      const devMode = opts.devMode || "development";
      if (mode !== devMode) {
        rollupExternal(get(config, "build.rollupOptions"), externals, libNames);
        return;
      }
      fsExtra.emptyDirSync(cacheDir);
      let alias = get(config, "resolve.alias");
      if (!Array.isArray(alias)) {
        alias = Object.entries(alias).map(([key, value]) => {
          return { find: key, replacement: value };
        });
        config.resolve.alias = alias;
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
  };
}
module.exports = createPlugin;
