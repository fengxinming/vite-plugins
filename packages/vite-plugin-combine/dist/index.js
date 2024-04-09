"use strict";
const node_os = require("node:os");
const node_path = require("node:path");
const node_fs = require("node:fs");
const camelCase = require("camelcase");
const globby = require("globby");
function camelCaseName(file, camelCaseOptions) {
  let { name } = node_path.parse(file);
  if (camelCaseOptions !== false) {
    name = camelCase(name, camelCaseOptions);
  }
  return name;
}
function namedExport(files, target, camelCaseOptions) {
  return files.map((file) => {
    const { name, dir } = node_path.parse(file);
    const exportName = camelCaseName(name, camelCaseOptions);
    const relativeDir = node_path.relative(node_path.dirname(target), dir);
    return `export { default as ${exportName} } from '${relativeDir ? node_path.join(relativeDir, name) : `./${name}`}';`;
  }).join(node_os.EOL);
}
function defaultExport(files, target, camelCaseOptions) {
  const importDeclare = [];
  const exportDeclare = [];
  let exportName;
  for (const file of files) {
    const { name, dir } = node_path.parse(file);
    exportName = camelCaseName(name, camelCaseOptions);
    const relativeDir = node_path.relative(node_path.dirname(target), dir);
    importDeclare[importDeclare.length] = `import ${exportName} from '${relativeDir ? node_path.join(relativeDir, name) : `./${name}`}';`;
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
  const { src, camelCase: camelCase2, dts } = opts;
  const exportsType = opts.exports || "named";
  let target = opts.target || "index.js";
  const cwd = opts.cwd || process.cwd();
  if (!node_path.isAbsolute(target)) {
    target = node_path.join(cwd, target);
  }
  target = node_path.normalize(target);
  const files = globby.globbySync(src, { cwd, absolute: true });
  let mainCode = "";
  return {
    name: "vite-plugin-combine",
    config(config) {
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
    },
    resolveId(id) {
      if (id === target) {
        return target;
      }
    },
    load(id) {
      if (id === target) {
        if (!files.length) {
          return "";
        }
        switch (exportsType) {
          case "named":
            mainCode = namedExport(files, id, camelCase2);
            break;
          case "default": {
            mainCode = defaultExport(files, id, camelCase2);
            break;
          }
          default:
            mainCode = noneExport(files, id);
        }
        return mainCode;
      }
    },
    writeBundle(options) {
      if (dts && ["es", "esm"].includes(options.format)) {
        const { dir, file } = options;
        let p;
        if (file) {
          p = node_path.dirname(file);
        } else if (dir) {
          p = dir;
        }
        if (p && !node_path.isAbsolute(p)) {
          p = node_path.join(cwd, p);
        }
        if (p && mainCode) {
          const mainObj = node_path.parse(target);
          node_fs.writeFile(node_path.join(p, `${mainObj.name}.d.ts`), mainCode.replace(new RegExp(node_path.join(cwd, mainObj.dir), "g"), "."), (err) => {
            if (err) {
              console.error(err);
            }
            mainCode = "";
          });
        }
      }
    }
  };
}
module.exports = createPlugin;
