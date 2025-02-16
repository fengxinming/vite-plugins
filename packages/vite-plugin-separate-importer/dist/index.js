"use strict";
const node_os = require("node:os");
const esModuleLexer = require("es-module-lexer");
function processLibs(libName, specifiers, lib) {
  const { importerSource, insertImport, importerSourceForCJS } = lib;
  let newImportDeclarationStr = "";
  const insertSourceFn = (importer, libName2) => {
    if (typeof insertImport === "function") {
      let source = insertImport(importer, libName2);
      if (typeof source === "string") {
        source = [{ es: source }];
      } else if (Array.isArray(source)) {
        source = source.map((n) => {
          if (typeof n === "string") {
            return { es: n };
          }
          return n;
        });
      } else {
        source = [source];
      }
      if (source) {
        newImportDeclarationStr += source.reduce((prev, { es, cjs } = { es: "" }) => {
          if (es) {
            prev += `import "${es}";${node_os.EOL}`;
            if (cjs) {
              importerSourceForCJS.push((code) => {
                return code.replace(es, cjs);
              });
            }
          }
          return prev;
        }, "");
      }
    }
  };
  for (const specifier of specifiers) {
    switch (specifier.type) {
      case "ImportDefaultSpecifier":
        insertSourceFn(specifier.local.name, libName);
        break;
      case "ImportSpecifier": {
        const importer = specifier.imported.name;
        if (importer) {
          if (typeof importerSource === "function") {
            let source = importerSource(importer, libName);
            if (typeof source === "string") {
              source = { es: source };
            }
            const { es, cjs } = source || {};
            if (es) {
              newImportDeclarationStr += `import ${importer} from "${es}";${node_os.EOL}`;
              if (cjs) {
                importerSourceForCJS.push((code) => {
                  return code.replace(es, cjs);
                });
              }
            }
          }
        }
        insertSourceFn(importer, libName);
        break;
      }
    }
  }
  return newImportDeclarationStr.slice(0, -1);
}
function createPlugin({ libs = [] } = {}) {
  if (!Array.isArray(libs) || libs.length === 0) {
    return;
  }
  const libMap = {};
  for (const lib of libs) {
    const { name, importerSource } = lib;
    const makeLibInfo = (n) => {
      libMap[n] = {
        ...lib,
        name: n,
        importerSourceForCJS: []
      };
    };
    if (importerSource) {
      if (Array.isArray(name)) {
        name.forEach(makeLibInfo);
      } else {
        makeLibInfo(name);
      }
    }
  }
  return {
    name: "vite-plugin-separate-importer",
    async transform(code) {
      await esModuleLexer.init;
      const [imports] = esModuleLexer.parse(code);
      let dest = code;
      for (const { n: libName, ss: startIndex, se: endIndex } of imports) {
        const importStr = code.substring(startIndex, endIndex);
        if (!libName || importStr.startsWith("import(")) {
          continue;
        }
        const ast = this.parse(importStr);
        const statement = ast.body[0];
        const { type } = statement;
        if (type !== "ImportDeclaration") {
          continue;
        }
        const { specifiers } = statement;
        const currentLibInfo = libMap[libName];
        if (!currentLibInfo) {
          continue;
        }
        const newImportStr = processLibs(libName, specifiers, currentLibInfo);
        if (newImportStr) {
          dest = dest.replace(importStr, newImportStr);
        }
      }
      return dest;
    },
    generateBundle(outputOptions, bundle) {
      if (outputOptions.format === "cjs") {
        Object.entries(bundle).forEach(([, chunk]) => {
          if (chunk.type === "chunk") {
            Object.entries(libMap).forEach(([, libInfo]) => {
              libInfo.importerSourceForCJS.forEach((fn) => {
                chunk.code = fn(chunk.code);
              });
            });
          }
        });
      }
    }
  };
}
module.exports = createPlugin;
