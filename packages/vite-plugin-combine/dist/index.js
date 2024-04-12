"use strict";
const node_os = require("node:os");
const node_path = require("node:path");
const node_fs = require("node:fs");
const camelCase = require("camelcase");
const globby = require("globby");
function camelCaseName(name, filePath, transformName) {
  if (transformName) {
    switch (typeof transformName) {
      case "boolean":
        return camelCase(name);
      case "function":
        return transformName(name, filePath);
    }
  }
  return name;
}
function namedExport(files, target, transformName) {
  return files.map((file) => {
    const { name, dir } = node_path.parse(file);
    const exportName = camelCaseName(name, file, transformName);
    const relativeDir = node_path.relative(node_path.dirname(target), dir);
    return `export { default as ${exportName} } from '${`./${node_path.join(relativeDir, name)}`}';`;
  }).join(node_os.EOL).concat(node_os.EOL);
}
function defaultExport(files, target, transformName) {
  const importDeclare = [];
  const exportDeclare = [];
  let exportName;
  for (const file of files) {
    const { name, dir } = node_path.parse(file);
    exportName = camelCaseName(name, file, transformName);
    const relativeDir = node_path.relative(node_path.dirname(target), dir);
    importDeclare[importDeclare.length] = `import ${exportName} from '${`./${node_path.join(relativeDir, name)}`}';`;
    exportDeclare[exportDeclare.length] = exportName;
  }
  return exportDeclare.length ? `${importDeclare.join(node_os.EOL)}${node_os.EOL}export default { ${exportDeclare.join(", ")} };${node_os.EOL}` : "";
}
function noneExport(files, target) {
  return files.map((file) => {
    const { name, dir } = node_path.parse(file);
    const relativeDir = node_path.relative(node_path.dirname(target), dir);
    return `import '${relativeDir ? node_path.join(relativeDir, name) : `./${name}`}';`;
  }).join(node_os.EOL);
}
function createPlugin(opts) {
  if (!opts) {
    opts = {};
  }
  const { src, transformName, overwrite } = opts;
  const enforce = opts.enforce || "pre";
  const exportsType = opts.exports || "named";
  const target = opts.target || "index.js";
  const cwd = opts.cwd || process.cwd();
  let absTarget = target;
  if (!node_path.isAbsolute(absTarget)) {
    absTarget = node_path.join(cwd, absTarget);
  }
  absTarget = node_path.normalize(absTarget);
  if (!overwrite && node_fs.existsSync(absTarget)) {
    throw new Error(`'${absTarget}' exists.`);
  }
  const plugin = {
    name: "vite-plugin-combine",
    enforce
  };
  const files = globby.globbySync(src, { cwd, absolute: true });
  if (files.length) {
    let mainCode = "";
    switch (exportsType) {
      case "named":
        mainCode = namedExport(files, absTarget, transformName);
        break;
      case "default": {
        mainCode = defaultExport(files, absTarget, transformName);
        break;
      }
      default:
        mainCode = noneExport(files, absTarget);
    }
    node_fs.writeFileSync(absTarget, mainCode, "utf-8");
    plugin.config = function(config) {
      var _a;
      const { build } = config;
      if (!build || !(build.lib && build.lib.entry) && !((_a = build.rollupOptions) == null ? void 0 : _a.input)) {
        return {
          build: {
            lib: {
              entry: files.concat(target)
            }
          }
        };
      }
    };
    plugin.resolveId = function(id) {
      if (id === target || id === absTarget) {
        return absTarget;
      }
    };
    if (!overwrite) {
      plugin.closeBundle = function() {
        try {
          node_fs.unlinkSync(absTarget);
        } catch (e) {
        }
      };
    }
  }
  return plugin;
}
module.exports = createPlugin;
