"use strict";
const node_fs = require("node:fs");
const node_os = require("node:os");
const node_path = require("node:path");
const camelCase = require("camelcase");
const replaceAll = require("fast-replaceall");
const fsExtra = require("fs-extra");
const tinyglobby = require("tinyglobby");
const vite = require("vite");
const baseLogFactory = require("base-log-factory");
const blfColorfulAppender = require("blf-colorful-appender");
const PLUGIN_NAME = "vite-plugin-combine";
const logFactory = new baseLogFactory.LogFactory({
  level: baseLogFactory.Level.WARN,
  appenders: [
    new blfColorfulAppender.ColorfulAppender()
  ]
});
const logger = logFactory.getLogger(PLUGIN_NAME);
function onExit(listener) {
  process.on("exit", listener);
  process.on("SIGHUP", listener);
  process.on("SIGINT", listener);
  process.on("SIGTERM", listener);
  process.on("SIGBREAK", listener);
  process.on("uncaughtException", listener);
  process.on("unhandledRejection", listener);
}
function offExit(listener) {
  process.off("exit", listener);
  process.off("SIGHUP", listener);
  process.off("SIGINT", listener);
  process.off("SIGTERM", listener);
  process.off("SIGBREAK", listener);
  process.off("uncaughtException", listener);
  process.off("unhandledRejection", listener);
}
function handleExport(name, filePath, nameExport) {
  if (nameExport) {
    switch (typeof nameExport) {
      case "boolean":
        return camelCase(name);
      case "function":
        return nameExport(name, filePath);
    }
  }
  return name;
}
function spliceCode(files, target, exportsType, nameExport) {
  const importDeclare = [];
  const exportDeclare = [];
  for (const file of files) {
    const { name, dir } = node_path.parse(file);
    const exportName = handleExport(name, file, nameExport);
    const relativeDir = node_path.relative(node_path.dirname(target), dir);
    const relativePath = `./${node_path.join(relativeDir, name)}`;
    importDeclare.push(`import ${exportName} from '${relativePath}';`);
    exportDeclare.push(exportName);
  }
  if (exportDeclare.length === 0) {
    return "";
  }
  let code = importDeclare.join(node_os.EOL) + node_os.EOL;
  const exportStr = exportDeclare.join(", ");
  if (exportsType === "named" || exportsType === "auto") {
    code += `export { ${exportStr} };${node_os.EOL}`;
  }
  if (exportsType === "default" || exportsType === "auto") {
    code += `export default { ${exportDeclare.join(", ")} };${node_os.EOL}`;
  }
  return code;
}
function noneExport(files, target) {
  return files.map((file) => {
    const { name, dir } = node_path.parse(file);
    const relativeDir = node_path.relative(node_path.dirname(target), dir);
    return `import '${relativeDir ? node_path.join(relativeDir, name) : `./${name}`}';`;
  }).join(node_os.EOL);
}
function makeESModuleCode(files, absTarget, opts) {
  const exportsType = opts.exports || "named";
  const { nameExport, beforeWrite } = opts;
  let mainCode = "";
  switch (exportsType) {
    case "named":
    case "default":
    case "auto":
      mainCode = spliceCode(files, absTarget, exportsType, nameExport);
      break;
    default:
      mainCode = noneExport(files, absTarget);
  }
  if (typeof beforeWrite === "function") {
    const code = beforeWrite(mainCode);
    if (typeof code === "string") {
      mainCode = code;
    }
  }
  return mainCode;
}
function rebuildInput(input, files) {
  const whatType = typeof input;
  if (whatType === "string") {
    return [input].concat(files);
  } else if (Array.isArray(input)) {
    return input.concat(files);
  } else if (whatType === "object" && input !== null) {
    return files.reduce((prev, cur) => {
      const obj = node_path.parse(cur);
      prev[obj.name] = cur;
      return prev;
    }, input);
  }
  return files;
}
function normalizeTarget(cwd, target) {
  let absTarget = target;
  if (!node_path.isAbsolute(absTarget)) {
    absTarget = node_path.join(cwd, absTarget);
  }
  absTarget = vite.normalizePath(absTarget);
  return absTarget;
}
function pluginCombine(opts) {
  if (!opts) {
    opts = {};
  }
  const { src, logLevel } = opts;
  if (logLevel) {
    logFactory.updateLevel(logLevel);
  }
  const cwd = opts.cwd || process.cwd();
  const prefix = `${PLUGIN_NAME}-temp-`;
  const files = tinyglobby.globSync(src, { cwd, absolute: true, ignore: `**/${prefix}**` });
  if (!files.length) {
    logger.warn(`No files found in "${src}".`);
    return;
  }
  const target = opts.target || "index.js";
  const absTarget = normalizeTarget(cwd, target);
  const virtualName = `${prefix}${Math.random().toString(36).slice(2)}`;
  const { ext: targetExt, dir: targetDir, name: targetName } = node_path.parse(absTarget);
  const virtualInput = node_path.join(targetDir, virtualName + targetExt);
  node_fs.writeFileSync(virtualInput, makeESModuleCode(files, absTarget, opts));
  logger.trace(`Temporary file "${virtualInput}" has been created.`);
  const clean = (err) => {
    try {
      node_fs.unlinkSync(virtualInput);
      logger.trace(`Clean up "${virtualInput}".`);
    } catch (e) {
    }
    offExit(clean);
    if (err != null) {
      logger.debug("Exit event received:", err);
    }
  };
  onExit(clean);
  let outDir;
  return {
    name: PLUGIN_NAME,
    enforce: "enforce" in opts ? opts.enforce : "pre",
    async config(config) {
      const inputs = files.concat(virtualInput);
      const { build } = config;
      if (build) {
        const { lib, rollupOptions } = build;
        let entry;
        if (lib && typeof lib === "object") {
          entry = rebuildInput(lib.entry, inputs);
          logger.debug("Entry:", entry);
          return {
            build: {
              lib: {
                entry
              }
            }
          };
        } else if (rollupOptions && typeof rollupOptions === "object") {
          entry = rebuildInput(rollupOptions.input, inputs);
          logger.debug("Entry:", entry);
          return {
            build: {
              rollupOptions: {
                input: entry
              }
            }
          };
        }
      }
      logger.debug("Entry:", inputs);
      return {
        build: {
          lib: {
            entry: inputs
          }
        }
      };
    },
    configResolved({ root, build }) {
      outDir = node_path.join(root, build.outDir);
    },
    closeBundle() {
      const { overwrite } = opts;
      const list = node_fs.readdirSync(outDir);
      const promises = [];
      for (const file of list) {
        const state = node_fs.statSync(node_path.join(outDir, file));
        if (state.isFile()) {
          if (file.startsWith(virtualName)) {
            const newPath = node_path.join(outDir, replaceAll(file, virtualName, targetName));
            if (node_fs.existsSync(newPath) && !overwrite) {
              logger.warn(`"${newPath}" already exists, please set overwrite to true.`);
            } else {
              const oldPath = node_path.join(outDir, file);
              promises.push(fsExtra.move(oldPath, newPath).then(() => {
                logger.info(`"${newPath}" has been created.`);
                logger.trace(`"${oldPath}" exists?`, node_fs.existsSync(oldPath));
              }));
            }
          }
        }
      }
      Promise.allSettled(promises).then(clean);
    }
  };
}
module.exports = pluginCombine;
