"use strict";
var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
const vite = require("vite");
const baseLogFactory = require("base-log-factory");
const blfColorfulAppender = require("blf-colorful-appender");
const node_fs = require("node:fs");
const node_path = require("node:path");
const crypto = require("node:crypto");
const fsExtra = require("fs-extra");
const node_module = require("node:module");
const node_util = require("node:util");
const PLUGIN_NAME = "vite-plugin-external";
const ESBUILD_PLUGIN_NAME = `${PLUGIN_NAME}-resolve`;
const logFactory = new baseLogFactory.LogFactory({
  level: baseLogFactory.Level.WARN,
  appenders: [
    new blfColorfulAppender.ColorfulAppender()
  ]
});
const logger$1 = logFactory.getLogger(PLUGIN_NAME);
function toPath(deepKey) {
  const result = [];
  const length = deepKey.length;
  if (length === 0) {
    return result;
  }
  let index = 0;
  let key = "";
  let quoteChar = "";
  let bracket = false;
  if (deepKey.charCodeAt(0) === 46) {
    result.push("");
    index++;
  }
  while (index < length) {
    const char = deepKey[index];
    if (quoteChar) {
      if (char === "\\" && index + 1 < length) {
        index++;
        key += deepKey[index];
      } else if (char === quoteChar) {
        quoteChar = "";
      } else {
        key += char;
      }
    } else if (bracket) {
      if (char === '"' || char === "'") {
        quoteChar = char;
      } else if (char === "]") {
        bracket = false;
        result.push(key);
        key = "";
      } else {
        key += char;
      }
    } else if (char === "[") {
      bracket = true;
      if (key) {
        result.push(key);
        key = "";
      }
    } else if (char === ".") {
      if (key) {
        result.push(key);
        key = "";
      }
    } else {
      key += char;
    }
    index++;
  }
  if (key) {
    result.push(key);
  }
  return result;
}
function isDeepKey(key) {
  switch (typeof key) {
    case "number":
      return false;
    case "string": {
      return key.includes(".") || key.includes("[") || key.includes("]");
    }
  }
}
function getWithPath(object, path, defaultValue) {
  if (path.length === 0 || object == null) {
    return defaultValue;
  }
  let lastPath = "";
  let lastObject = object;
  let current = null;
  const len = path.length - 1;
  let index = 0;
  const next = (givenValue) => {
    lastPath = path[index];
    current = lastObject[lastPath];
    if (current == null) {
      current = givenValue;
      lastObject[lastPath] = current;
    }
  };
  for (; index < len; index++) {
    next({});
    lastObject = current;
  }
  if (index === len) {
    next(defaultValue);
  }
  return current;
}
function getValue(object, path, defaultValue) {
  if (object == null) {
    return defaultValue;
  }
  switch (typeof path) {
    case "string": {
      const result = object[path];
      if (result === void 0) {
        if (isDeepKey(path)) {
          return getValue(object, toPath(path), defaultValue);
        }
        object[path] = defaultValue;
        return defaultValue;
      }
      return result;
    }
    case "number": {
      const result = object[path];
      if (result === void 0) {
        object[path] = defaultValue;
        return defaultValue;
      }
      return result;
    }
    default: {
      if (Array.isArray(path)) {
        return getWithPath(object, path, defaultValue);
      }
      const result = object[path];
      if (result === void 0) {
        object[path] = defaultValue;
        return defaultValue;
      }
      return result;
    }
  }
}
const hash = crypto.hash ?? ((algorithm, data, outputEncoding) => crypto.createHash(algorithm).update(data).digest(outputEncoding));
function getHash(text, length = 8) {
  const h = hash("sha256", text, "hex").substring(0, length);
  if (length <= 64) {
    return h;
  }
  return h.padEnd(length, "_");
}
const FLATTEN_ID_HASH_LENGTH = 8;
const FLATTEN_ID_MAX_FILE_LENGTH = 170;
const limitFlattenIdLength = (id, limit = FLATTEN_ID_MAX_FILE_LENGTH) => {
  if (id.length <= limit) {
    return id;
  }
  return `${id.slice(0, limit - (FLATTEN_ID_HASH_LENGTH + 1))}_${getHash(id)}`;
};
const replaceSlashOrColonRE = /[/:]/g;
const replaceDotRE = /\./g;
const replaceNestedIdRE = /\s*>\s*/g;
const replaceHashRE = /#/g;
const flattenId = (id) => {
  const flatId = limitFlattenIdLength(id.replace(replaceSlashOrColonRE, "_").replace(replaceDotRE, "__").replace(replaceNestedIdRE, "___").replace(replaceHashRE, "____"));
  return flatId;
};
function getDepsCacheSuffix(config, ssr) {
  let suffix = "";
  if (config.command === "build") {
    const { outDir } = config.build;
    const buildId = outDir.length > 8 || outDir.includes("/") ? getHash(outDir) : outDir;
    suffix += `_build-${buildId}`;
  }
  if (ssr) {
    suffix += "_ssr";
  }
  return suffix;
}
function getDepsCacheDirPrefix(config) {
  return vite.normalizePath(node_path.resolve(config.cacheDir, "deps"));
}
function getDepsCacheDir(config, ssr) {
  return getDepsCacheDirPrefix(config) + getDepsCacheSuffix(config, ssr);
}
function makeStashFilePath(cacheDir, libName) {
  return node_path.join(cacheDir, `${flattenId(libName)}.js`);
}
function makeCjsExternalCode(globalName) {
  return `module.exports = ${globalName};`;
}
async function stash(libName, globalName, cacheDir) {
  const libPath = makeStashFilePath(cacheDir, libName);
  logger$1.trace(`Stashing a file: "${libPath}" for "${globalName}".`);
  await fsExtra.outputFile(libPath, makeCjsExternalCode(globalName), "utf-8");
  return libPath;
}
function eachExternal(obj, cacheDir, cb) {
  if (Array.isArray(obj)) {
    const promises = [];
    for (const [libName, globalName] of obj) {
      promises.push(cb(libName, globalName));
    }
    return Promise.all(promises);
  }
  return eachExternal(Object.entries(obj), cacheDir, cb);
}
class Resolver {
  constructor(cacheDir) {
    __publicField(this, "cacheDir");
    __publicField(this, "stashed", false);
    __publicField(this, "stashMap", /* @__PURE__ */ new Map());
    __publicField(this, "resolveHook");
    this.cacheDir = cacheDir;
  }
  async stash(libName, globalName) {
    const { stashMap } = this;
    let stashPath = stashMap.get(libName);
    if (stashPath) {
      logger$1.trace(`"${libName}" has already been stashed, skipping.`);
    } else {
      stashPath = await stash(libName, globalName, this.cacheDir);
      this.stashMap.set(libName, stashPath);
    }
    return stashPath;
  }
  async stashObject(obj) {
    return eachExternal(obj, this.cacheDir, (libName, globalName) => this.stash(libName, globalName));
  }
  async resolve(source, importer, isResolved) {
    if (this.stashed) {
      return this.stashMap.get(source);
    }
    const { resolveHook } = this;
    if (resolveHook) {
      const globalName = resolveHook(source, importer, isResolved);
      if (globalName && typeof globalName === "string") {
        return this.stash(source, globalName);
      }
      return !!globalName;
    }
  }
  addHook(fn) {
    const { resolveHook } = this;
    if (!resolveHook) {
      this.resolveHook = fn;
      return;
    }
    this.resolveHook = (source, importer, isResolved) => {
      let val = resolveHook(source, importer, isResolved);
      if (!val) {
        val = fn(source, importer, isResolved);
      }
      return val;
    };
  }
}
async function setAliases(opts, config) {
  const { externals } = opts;
  if (typeof externals === "function") {
    throw new TypeError("`options.externals` function is not supported.");
  }
  if (!externals) {
    logger$1.debug("`options.externals` is not specified.");
    return;
  }
  const globalObject = externals;
  if (Object.keys(globalObject).length === 0) {
    logger$1.warn("`options.externals` is empty.");
    return;
  }
  const { cacheDir } = opts;
  fsExtra.emptyDirSync(cacheDir);
  logger$1.debug("Cleanup stash dir.");
  let alias = getValue(config, "resolve.alias", []);
  if (!Array.isArray(alias)) {
    alias = Object.entries(alias).map(([key, value]) => {
      return { find: key, replacement: value };
    });
    config.resolve.alias = alias;
  }
  await eachExternal(globalObject, cacheDir, async (libName, globalName) => {
    const libPath = await stash(libName, globalName, cacheDir);
    alias.push({
      find: new RegExp(`^${libName}$`),
      replacement: libPath
    });
    return libPath;
  });
}
function rollupOutputGlobals(output, globalObject) {
  const { globals: originalGlobals } = output;
  output.globals = (libName) => {
    let globalName = globalObject[libName];
    logger$1.trace(`Got the global name "${globalName}".`, "external:", libName);
    if (!globalName) {
      const whatType = typeof originalGlobals;
      if (whatType === "function") {
        globalName = originalGlobals(libName);
      } else if (whatType === "object" && originalGlobals !== null) {
        globalName = originalGlobals[libName];
      }
    }
    logger$1.trace(`The global name "${globalName}" will be resolved.`);
    return globalName;
  };
}
function setOutputGlobals(rollupOptions, globalObject, opts) {
  const { externalGlobals } = opts;
  if (typeof externalGlobals === "function") {
    rollupOptions.plugins = [
      externalGlobals((id) => {
        return globalObject[id];
      }),
      ...rollupOptions.plugins || []
    ];
  } else {
    const output = getValue(rollupOptions, "output", {});
    if (Array.isArray(output)) {
      output.forEach((n) => {
        rollupOutputGlobals(n, globalObject);
      });
    } else {
      rollupOutputGlobals(output, globalObject);
    }
  }
}
function checkLibName(externalArray, source) {
  return externalArray.some((external) => node_util.types.isRegExp(external) ? external.test(source) : external === source);
}
function collectExternals(globalObject, opts) {
  const externalArray = Object.keys(globalObject);
  const { nodeBuiltins, externalizeDeps } = opts;
  let builtinModuleArray = [];
  let deps = [];
  if (nodeBuiltins) {
    builtinModuleArray = node_module.builtinModules.map((builtinModule) => {
      return new RegExp(`^(?:node:)?${builtinModule}(?:/.+)*$`);
    });
    logger$1.debug("Externalize nodejs built-in modules:", builtinModuleArray);
  }
  if (externalizeDeps) {
    deps = externalizeDeps.map((dep) => {
      return node_util.types.isRegExp(dep) ? dep : new RegExp(`^${dep}(?:/.+)*$`);
    });
    logger$1.debug("Externalize given dependencies:", deps);
  }
  return externalArray.concat(builtinModuleArray, deps);
}
function mergeExternals(externalArray, originalExternal) {
  if (typeof originalExternal === "string" || node_util.types.isRegExp(originalExternal) || Array.isArray(originalExternal)) {
    return externalArray.concat(originalExternal);
  }
  if (typeof originalExternal === "function") {
    return function(source, importer, isResolved) {
      return checkLibName(externalArray, source) ? true : originalExternal(source, importer, isResolved);
    };
  }
  return externalArray;
}
function setExternals(opts, config) {
  let globalObject = {};
  let externalFn;
  const { externals } = opts;
  const whatType = typeof externals;
  if (whatType === "function") {
    externalFn = externals;
    logger$1.debug("`options.externals` is a function.");
  } else if (whatType === "object" && externals !== null) {
    globalObject = externals;
    logger$1.debug("`options.externals` is an object.");
  } else {
    logger$1.debug("`options.externals` is not a function or object.");
  }
  const externalArray = collectExternals(globalObject, opts);
  const rollupOptions = getValue(config, "build.rollupOptions", {});
  const newExternals = mergeExternals(externalArray, rollupOptions.external);
  if (externalFn) {
    rollupOptions.external = function(source, importer, isResolved) {
      let val = externalFn(source, importer, isResolved);
      logger$1.trace(`Got the global name "${val}". source: "${source}", importer: "${importer}", isResolved: ${isResolved}`);
      if (!val) {
        if (typeof newExternals === "function") {
          val = newExternals(source, importer, isResolved);
        } else if (externalArray.length > 0) {
          val = externalArray.some((n) => {
            const isMatched = node_util.types.isRegExp(n) ? n.test(source) : n === source;
            if (isMatched) {
              logger$1.trace(`The module "${source}" will be externalized due to the match "${n}".`);
            }
            return isMatched;
          });
        }
      } else if (typeof val === "string") {
        globalObject[source] = val;
      }
      if (val) {
        logger$1.trace(`The module "${source}" will be externalized.`);
      }
      return !!val;
    };
  } else if (externalArray.length > 0) {
    rollupOptions.external = newExternals;
  }
  setOutputGlobals(rollupOptions, globalObject, opts);
}
const logger = logFactory.getLogger(PLUGIN_NAME);
function buildOptions(opts, env) {
  const { mode } = env;
  let {
    cwd,
    cacheDir,
    logLevel,
    externals,
    // eslint-disable-next-line prefer-const
    ...rest
  } = opts || {};
  const modeOptions = rest[mode];
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
          case "logLevel":
            logLevel = value;
            break;
          case "externals":
            if (typeof value === "object") {
              externals = Object.assign({}, externals, value);
            } else {
              externals = value;
            }
            break;
        }
      }
    });
    delete rest[mode];
  }
  if (logLevel != null) {
    logFactory.updateLevel(logLevel);
  }
  logger.debug("Options:", opts);
  if (!cwd) {
    cwd = process.cwd();
  }
  if (!cacheDir) {
    cacheDir = node_path.join(cwd, "node_modules", ".vite_external");
  } else if (!node_path.isAbsolute(cacheDir)) {
    cacheDir = node_path.join(cwd, cacheDir);
  }
  const resolvedOpts = Object.assign({
    ...rest,
    cacheDir,
    cwd,
    externals,
    logLevel
  }, env);
  logger.debug("Resolved Options:", resolvedOpts);
  return resolvedOpts;
}
function isRuntime({ command, interop }) {
  return command === "serve" || command === "dev" || interop === "auto";
}
async function cleanupCache(externals, config) {
  if (!externals || typeof externals === "function") {
    return;
  }
  const ssr = config.command === "build" && !!config.build.ssr;
  const depsCacheDir = getDepsCacheDir(config, ssr);
  const cachedMetadataPath = node_path.join(depsCacheDir, "_metadata.json");
  let metadata;
  try {
    metadata = JSON.parse(node_fs.readFileSync(cachedMetadataPath, "utf-8"));
  } catch (e) {
    return;
  }
  if (!metadata) {
    return;
  }
  const { optimized } = metadata;
  if (optimized && Object.keys(optimized).length) {
    Object.keys(externals).forEach((libName) => {
      if (optimized[libName]) {
        delete optimized[libName];
      }
    });
    try {
      node_fs.writeFileSync(cachedMetadataPath, JSON.stringify(metadata));
      logger$1.debug("Cleanup cache metadata.");
    } catch (e) {
    }
  }
}
function rollback(opts) {
  let resolvedOptions;
  return {
    name: PLUGIN_NAME,
    async config(config, env) {
      resolvedOptions = buildOptions(opts, env);
      if (isRuntime(resolvedOptions)) {
        await setAliases(resolvedOptions, config);
      } else {
        setExternals(resolvedOptions, config);
      }
    },
    configResolved(config) {
      if (isRuntime(resolvedOptions)) {
        logger$1.debug("Resolved alias:", config.resolve.alias);
      } else {
        logger$1.debug("Resolved rollupOptions:", config.build.rollupOptions);
      }
      cleanupCache(resolvedOptions.externals, config);
    }
  };
}
async function setOptimizeDeps(opts, config) {
  let externalEntries;
  let externalFn;
  const { externals } = opts;
  const whatType = typeof externals;
  const resolver = new Resolver(opts.cacheDir);
  if (whatType === "function") {
    externalFn = externals;
    logger$1.debug("`options.externals` is a function.");
    resolver.addHook(externalFn);
  } else if (whatType === "object" && externals !== null) {
    externalEntries = Object.entries(externals);
    if (!externalEntries.length) {
      logger$1.warn("`options.externals` is empty.");
      return null;
    }
    logger$1.debug("`options.externals` is an object.");
    await resolver.stashObject(externals);
    resolver.stashed = true;
  }
  const newExternals = collectExternals({}, opts);
  if (newExternals.length > 0) {
    resolver.addHook((id) => {
      return checkLibName(newExternals, id);
    });
  }
  const plugins = getValue(config, "optimizeDeps.esbuildOptions.plugins", []);
  plugins.push({
    name: ESBUILD_PLUGIN_NAME,
    setup(build) {
      logger$1.debug(`Setup esbuild plugin "${ESBUILD_PLUGIN_NAME}".`);
      build.onResolve({
        filter: /.*/
        // namespace: 'file',
      }, async (args) => {
        const { path, importer, kind } = args;
        const globalName = await resolver.resolve(path, importer, kind === "entry-point");
        if (globalName) {
          if (globalName === true) {
            return {
              path,
              external: true
            };
          }
          if (typeof globalName === "string") {
            return {
              path: globalName
            };
          }
        }
      });
      build.onEnd(() => {
        resolver.stashed = true;
        logger$1.debug("Pre-bundling externals:", Array.from(resolver.stashMap.keys()));
      });
    }
  });
  return resolver;
}
function v6(opts) {
  let resolvedOptions;
  let resolver = null;
  return {
    name: PLUGIN_NAME,
    enforce: opts.interop === "auto" ? "pre" : opts.enforce,
    async config(config, env) {
      resolvedOptions = buildOptions(opts, env);
      if (isRuntime(resolvedOptions)) {
        resolver = await setOptimizeDeps(resolvedOptions, config);
      } else {
        setExternals(resolvedOptions, config);
      }
    },
    configResolved(config) {
      if (isRuntime(resolvedOptions)) {
        resolver && logger$1.debug("Stashed resolved path:", Array.from(resolver.stashMap.keys()));
      } else {
        logger$1.debug("Resolved rollupOptions:", config.build.rollupOptions);
      }
      cleanupCache(resolvedOptions.externals, config);
    },
    async resolveId(id, importer, { isEntry }) {
      if (resolver === null) {
        logger$1.trace(`External resolver is not ready for "${id}".`);
        return;
      }
      const resolvedId = await resolver.resolve(id, importer, isEntry);
      if (resolvedId === true) {
        logger$1.trace(`'${id}' is marked as external`);
        return { id, external: true };
      }
      if (!resolvedId) {
        logger$1.trace(`'${id}' is not resolved`);
        return;
      }
      const { mode } = this.environment;
      if (mode === "build") {
        logger$1.trace(`'${id}' is resolved to ${resolvedId}`);
        return resolvedId;
      }
      const depsOptimizer = this.environment.depsOptimizer;
      const depInfo = depsOptimizer.registerMissingImport(id, resolvedId);
      const depId = depsOptimizer.getOptimizedDepId(depInfo);
      logger$1.trace(`'${id}' is resolved to ${depId}`);
      return depId;
    }
  };
}
let major;
if (vite.version) {
  const [v] = vite.version.split(".");
  major = parseInt(v, 10);
}
function pluginExternal(opts) {
  const plugin = {
    name: PLUGIN_NAME,
    enforce: opts.enforce
  };
  if (major >= 6 && !opts.rollback) {
    logger$1.name += "-v6";
    Object.assign(plugin, v6(opts));
  } else {
    Object.assign(plugin, rollback(opts));
  }
  return plugin;
}
module.exports = pluginExternal;
