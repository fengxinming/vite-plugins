import { EOL } from "node:os";
import { isAbsolute, join, normalize, dirname, parse, relative } from "node:path";
import { writeFile } from "node:fs";
import camelCase from "camelcase";
import { globbySync } from "globby";
function camelCaseName(file, camelCaseOptions) {
  let { name } = parse(file);
  if (camelCaseOptions !== false) {
    name = camelCase(name, camelCaseOptions);
  }
  return name;
}
function namedExport(files, target, camelCaseOptions) {
  return files.map((file) => {
    const { name, dir } = parse(file);
    const exportName = camelCaseName(name, camelCaseOptions);
    const relativeDir = relative(dirname(target), dir);
    return `export { default as ${exportName} } from '${relativeDir ? join(relativeDir, name) : `./${name}`}';`;
  }).join(EOL);
}
function defaultExport(files, target, camelCaseOptions) {
  const importDeclare = [];
  const exportDeclare = [];
  let exportName;
  for (const file of files) {
    const { name, dir } = parse(file);
    exportName = camelCaseName(name, camelCaseOptions);
    const relativeDir = relative(dirname(target), dir);
    importDeclare[importDeclare.length] = `import ${exportName} from '${relativeDir ? join(relativeDir, name) : `./${name}`}';`;
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
  const { src, camelCase: camelCase2, dts } = opts;
  const exportsType = opts.exports || "named";
  let target = opts.target || "index.js";
  const cwd = opts.cwd || process.cwd();
  if (!isAbsolute(target)) {
    target = join(cwd, target);
  }
  target = normalize(target);
  const files = globbySync(src, { cwd, absolute: true });
  let mainCode = "";
  return {
    name: "vite-plugin-combine",
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
          p = dirname(file);
        } else if (dir) {
          p = dir;
        }
        if (p && !isAbsolute(p)) {
          p = join(cwd, p);
        }
        if (p && mainCode) {
          const mainObj = parse(target);
          writeFile(join(p, `${mainObj.name}.d.ts`), mainCode.replace(new RegExp(join(cwd, mainObj.dir), "g"), "."), (err) => {
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
export {
  createPlugin as default
};
