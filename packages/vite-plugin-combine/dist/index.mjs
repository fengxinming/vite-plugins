import { EOL } from "node:os";
import { isAbsolute, join, normalize, parse, relative, dirname } from "node:path";
import { existsSync, writeFileSync, unlinkSync } from "node:fs";
import camelCase from "camelcase";
import { globbySync } from "globby";
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
    const { name, dir } = parse(file);
    const exportName = camelCaseName(name, file, transformName);
    const relativeDir = relative(dirname(target), dir);
    return `export { default as ${exportName} } from '${`./${join(relativeDir, name)}`}';`;
  }).join(EOL).concat(EOL);
}
function defaultExport(files, target, transformName) {
  const importDeclare = [];
  const exportDeclare = [];
  let exportName;
  for (const file of files) {
    const { name, dir } = parse(file);
    exportName = camelCaseName(name, file, transformName);
    const relativeDir = relative(dirname(target), dir);
    importDeclare[importDeclare.length] = `import ${exportName} from '${`./${join(relativeDir, name)}`}';`;
    exportDeclare[exportDeclare.length] = exportName;
  }
  return exportDeclare.length ? `${importDeclare.join(EOL)}${EOL}export default { ${exportDeclare.join(", ")} };${EOL}` : "";
}
function noneExport(files, target) {
  return files.map((file) => {
    const { name, dir } = parse(file);
    const relativeDir = relative(dirname(target), dir);
    return `import '${relativeDir ? join(relativeDir, name) : `./${name}`}';`;
  }).join(EOL);
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
  if (!isAbsolute(absTarget)) {
    absTarget = join(cwd, absTarget);
  }
  absTarget = normalize(absTarget);
  if (!overwrite && existsSync(absTarget)) {
    throw new Error(`'${absTarget}' exists.`);
  }
  const plugin = {
    name: "vite-plugin-combine",
    enforce
  };
  const files = globbySync(src, { cwd, absolute: true });
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
    writeFileSync(absTarget, mainCode, "utf-8");
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
          unlinkSync(absTarget);
        } catch (e) {
        }
      };
    }
  }
  return plugin;
}
export {
  createPlugin as default
};
