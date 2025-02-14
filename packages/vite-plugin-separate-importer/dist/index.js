"use strict";
const node_os = require("node:os");
const esModuleLexer = require("es-module-lexer");
function processLibs(libName, specifiers, lib, opts) {
  const { transformImporter, importExtra } = lib;
  let newImportDeclarationStr = "";
  for (const specifier of specifiers) {
    switch (specifier.type) {
      case "ImportDefaultSpecifier":
        if (importExtra) {
          newImportDeclarationStr += importExtra(specifier.local.name, libName, opts) + node_os.EOL;
        }
        break;
      case "ImportSpecifier": {
        const importer = specifier.imported.name;
        if (transformImporter) {
          const newModule = transformImporter(importer, libName, opts);
          if (newModule) {
            newImportDeclarationStr += `import ${importer} from "${newModule}";${node_os.EOL}`;
          }
        }
        if (importExtra) {
          newImportDeclarationStr += importExtra(importer, libName, opts) + node_os.EOL;
        }
        break;
      }
    }
  }
  return newImportDeclarationStr.slice(0, -2);
}
async function transform(opts, libMap) {
  await esModuleLexer.init;
  const code = typeof opts === "string" ? opts : opts.code;
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
    const currentLib = libMap[libName];
    if (!currentLib) {
      continue;
    }
    const newImportStr = processLibs(libName, specifiers, currentLib, typeof opts === "string" ? { code: opts } : opts);
    if (newImportStr) {
      dest = dest.replace(importStr, newImportStr);
    }
  }
  return dest;
}
function createPlugin({ libs = [] } = {}) {
  if (!Array.isArray(libs) || libs.length === 0) {
    return;
  }
  const libMap = {};
  for (const lib of libs) {
    const { name, importExtra, transformImporter } = lib;
    const makeLibInfo = (n) => {
      libMap[n] = {
        name: n,
        transformImporter,
        importExtra
      };
    };
    if (transformImporter) {
      if (Array.isArray(name)) {
        name.forEach(makeLibInfo);
      } else {
        makeLibInfo(name);
      }
    }
  }
  return {
    name: "vite-plugin-separate-importer",
    renderChunk(code, chunk, outputOptions, meta) {
      return transform.call(this, { code, chunk, outputOptions, meta }, libMap);
    }
  };
}
module.exports = createPlugin;
