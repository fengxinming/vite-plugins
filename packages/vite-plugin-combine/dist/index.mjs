import { existsSync, writeFileSync, unlinkSync } from "node:fs";
import { EOL } from "node:os";
import { isAbsolute, join, parse, relative, dirname } from "node:path";
import { globSync } from "tinyglobby";
import { normalizePath } from "vite";
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
    const { name, dir } = parse(file);
    const exportName = camelCaseName(name, file, nameExport);
    const relativeDir = relative(dirname(target), dir);
    return `export { default as ${exportName} } from '${`./${join(relativeDir, name)}`}';`;
  }).join(EOL).concat(EOL);
}
function defaultExport(files, target, nameExport) {
  const importDeclare = [];
  const exportDeclare = [];
  let exportName;
  for (const file of files) {
    const { name, dir } = parse(file);
    exportName = camelCaseName(name, file, nameExport);
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
function rebuildInput(input, files) {
  if (typeof input === "string") {
    return [input].concat(files);
  } else if (Array.isArray(input)) {
    return input.concat(files);
  } else if (input && typeof input === "object") {
    return files.reduce((prev, cur) => {
      const obj = parse(cur);
      prev[obj.name] = cur;
      return prev;
    }, input);
  }
  return files;
}
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
function pluginCombine(opts) {
  if (!opts) {
    opts = {};
  }
  const { src, overwrite, nameExport } = opts;
  const enforce = "enforce" in opts ? opts.enforce : "pre";
  const exportsType = opts.exports || "named";
  const target = opts.target || "index.js";
  const cwd = opts.cwd || process.cwd();
  let absTarget = target;
  if (!isAbsolute(absTarget)) {
    absTarget = join(cwd, absTarget);
  }
  absTarget = normalizePath(absTarget);
  if (!overwrite && existsSync(absTarget)) {
    throw new Error(`'${absTarget}' exists.`);
  }
  const files = globSync(src, { cwd, absolute: true });
  if (!files.length) {
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
  const { beforeWrite } = opts;
  if (typeof beforeWrite === "function") {
    const str = beforeWrite(mainCode);
    if (typeof str === "string") {
      mainCode = str;
    }
  }
  writeFileSync(absTarget, mainCode);
  const plugin = {
    name: "vite-plugin-combine",
    enforce,
    async config(config) {
      const inputs = files.concat(absTarget);
      const { build } = config;
      if (build) {
        const { lib, rollupOptions } = build;
        if (lib && typeof lib === "object") {
          return {
            build: {
              lib: {
                entry: rebuildInput(lib.entry, inputs)
              }
            }
          };
        } else if (rollupOptions && typeof rollupOptions === "object") {
          return {
            build: {
              rollupOptions: {
                input: rebuildInput(rollupOptions.input, inputs)
              }
            }
          };
        }
      }
      return {
        build: {
          lib: {
            entry: inputs
          }
        }
      };
    }
  };
  if (!overwrite) {
    const clean = () => {
      try {
        if (existsSync(absTarget)) {
          unlinkSync(absTarget);
        }
        offExit(clean);
      } catch (e) {
      }
    };
    onExit(clean);
    plugin.closeBundle = function() {
      clean();
    };
  }
  return plugin;
}
export {
  pluginCombine as default
};
