"use strict";
const node_os = require("node:os");
const node_path = require("node:path");
const tinyglobby = require("tinyglobby");
const vite = require("vite");
const UPPERCASE = /[\p{Lu}]/u;
const LOWERCASE = /[\p{Ll}]/u;
const LEADING_CAPITAL = /^[\p{Lu}](?![\p{Lu}])/gu;
const IDENTIFIER = /([\p{Alpha}\p{N}_]|$)/u;
const SEPARATORS = /[_.\- ]+/;
const LEADING_SEPARATORS = new RegExp("^" + SEPARATORS.source);
const SEPARATORS_AND_IDENTIFIER = new RegExp(SEPARATORS.source + IDENTIFIER.source, "gu");
const NUMBERS_AND_IDENTIFIER = new RegExp("\\d+" + IDENTIFIER.source, "gu");
const preserveCamelCase = (string, toLowerCase, toUpperCase, preserveConsecutiveUppercase2) => {
  let isLastCharLower = false;
  let isLastCharUpper = false;
  let isLastLastCharUpper = false;
  let isLastLastCharPreserved = false;
  for (let index = 0; index < string.length; index++) {
    const character = string[index];
    isLastLastCharPreserved = index > 2 ? string[index - 3] === "-" : true;
    if (isLastCharLower && UPPERCASE.test(character)) {
      string = string.slice(0, index) + "-" + string.slice(index);
      isLastCharLower = false;
      isLastLastCharUpper = isLastCharUpper;
      isLastCharUpper = true;
      index++;
    } else if (isLastCharUpper && isLastLastCharUpper && LOWERCASE.test(character) && (!isLastLastCharPreserved || preserveConsecutiveUppercase2)) {
      string = string.slice(0, index - 1) + "-" + string.slice(index - 1);
      isLastLastCharUpper = isLastCharUpper;
      isLastCharUpper = false;
      isLastCharLower = true;
    } else {
      isLastCharLower = toLowerCase(character) === character && toUpperCase(character) !== character;
      isLastLastCharUpper = isLastCharUpper;
      isLastCharUpper = toUpperCase(character) === character && toLowerCase(character) !== character;
    }
  }
  return string;
};
const preserveConsecutiveUppercase = (input, toLowerCase) => {
  LEADING_CAPITAL.lastIndex = 0;
  return input.replaceAll(LEADING_CAPITAL, (match) => toLowerCase(match));
};
const postProcess = (input, toUpperCase) => {
  SEPARATORS_AND_IDENTIFIER.lastIndex = 0;
  NUMBERS_AND_IDENTIFIER.lastIndex = 0;
  return input.replaceAll(NUMBERS_AND_IDENTIFIER, (match, pattern, offset) => ["_", "-"].includes(input.charAt(offset + match.length)) ? match : toUpperCase(match)).replaceAll(SEPARATORS_AND_IDENTIFIER, (_, identifier) => toUpperCase(identifier));
};
function camelCase(input, options) {
  if (!(typeof input === "string" || Array.isArray(input))) {
    throw new TypeError("Expected the input to be `string | string[]`");
  }
  options = {
    pascalCase: false,
    preserveConsecutiveUppercase: false,
    ...options
  };
  if (Array.isArray(input)) {
    input = input.map((x) => x.trim()).filter((x) => x.length).join("-");
  } else {
    input = input.trim();
  }
  if (input.length === 0) {
    return "";
  }
  const toLowerCase = options.locale === false ? (string) => string.toLowerCase() : (string) => string.toLocaleLowerCase(options.locale);
  const toUpperCase = options.locale === false ? (string) => string.toUpperCase() : (string) => string.toLocaleUpperCase(options.locale);
  if (input.length === 1) {
    if (SEPARATORS.test(input)) {
      return "";
    }
    return options.pascalCase ? toUpperCase(input) : toLowerCase(input);
  }
  const hasUpperCase = input !== toLowerCase(input);
  if (hasUpperCase) {
    input = preserveCamelCase(input, toLowerCase, toUpperCase, options.preserveConsecutiveUppercase);
  }
  input = input.replace(LEADING_SEPARATORS, "");
  input = options.preserveConsecutiveUppercase ? preserveConsecutiveUppercase(input, toLowerCase) : toLowerCase(input);
  if (options.pascalCase) {
    input = toUpperCase(input.charAt(0)) + input.slice(1);
  }
  return postProcess(input, toUpperCase);
}
function camelCaseName(name, filePath, nameExport) {
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
function namedExport(files, target, nameExport) {
  return files.map((file) => {
    const { name, dir } = node_path.parse(file);
    const exportName = camelCaseName(name, file, nameExport);
    const relativeDir = node_path.relative(node_path.dirname(target), dir);
    return `export { default as ${exportName} } from '${`./${node_path.join(relativeDir, name)}`}';`;
  }).join(node_os.EOL).concat(node_os.EOL);
}
function defaultExport(files, target, nameExport) {
  const importDeclare = [];
  const exportDeclare = [];
  let exportName;
  for (const file of files) {
    const { name, dir } = node_path.parse(file);
    exportName = camelCaseName(name, file, nameExport);
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
  const { src, nameExport } = opts;
  const enforce = opts.enforce || "pre";
  const exportsType = opts.exports || "named";
  const target = opts.target || "index.js";
  const cwd = opts.cwd || process.cwd();
  let absTarget = target;
  if (!node_path.isAbsolute(absTarget)) {
    absTarget = node_path.join(cwd, absTarget);
  }
  absTarget = vite.normalizePath(absTarget);
  const files = tinyglobby.globSync(src, { cwd, absolute: true });
  if (!files.length) {
    return;
  }
  const plugin = {
    name: "vite-plugin-combine",
    enforce,
    config(config) {
      var _a;
      const { build } = config;
      if (!build || !(build.lib && build.lib.entry) && !((_a = build.rollupOptions) == null ? void 0 : _a.input)) {
        return {
          build: {
            lib: {
              entry: files.concat(absTarget)
            }
          }
        };
      }
    },
    resolveId(id) {
      if (id === absTarget) {
        return id;
      }
    },
    load(id) {
      if (id !== absTarget) {
        return;
      }
      let mainCode = "";
      switch (exportsType) {
        case "named":
          mainCode = namedExport(files, absTarget, nameExport);
          break;
        case "default": {
          mainCode = defaultExport(files, absTarget, nameExport);
          break;
        }
        default:
          mainCode = noneExport(files, absTarget);
      }
      return mainCode;
    }
  };
  return plugin;
}
module.exports = createPlugin;
