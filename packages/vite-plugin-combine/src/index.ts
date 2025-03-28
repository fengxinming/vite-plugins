import { existsSync, unlinkSync, writeFileSync } from 'node:fs';
// import { writeFile } from 'node:fs/promises';
import { EOL } from 'node:os';
import { dirname, isAbsolute, join, parse, relative } from 'node:path';

import camelCase from 'camelcase';
import { InputOption } from 'rollup';
import { globSync } from 'tinyglobby';
import { normalizePath, PluginOption } from 'vite';

import { NameExport, Options } from './typings';

export * from './typings';

function camelCaseName(name: string, filePath: string, nameExport?: NameExport | boolean): string {
  if (nameExport) {
    switch (typeof nameExport) {
      case 'boolean':
        return camelCase(name);
      case 'function':
        return nameExport(name, filePath);
    }
  }
  return name;
}

function namedExport(files: string[], target: string, nameExport?: NameExport | boolean): string {
  return files
    .map((file) => {
      const { name, dir } = parse(file);
      const exportName = camelCaseName(name, file, nameExport);
      const relativeDir = relative(dirname(target), dir);
      return `export { default as ${exportName} } from '${`./${join(relativeDir, name)}`}';`;
    })
    .join(EOL)
    .concat(EOL);
}

function defaultExport(files: string[], target: string, nameExport?: NameExport | boolean): string {
  const importDeclare: string[] = [];
  const exportDeclare: string[] = [];
  let exportName;
  for (const file of files) {
    const { name, dir } = parse(file);
    exportName = camelCaseName(name, file, nameExport);
    const relativeDir = relative(dirname(target), dir);
    importDeclare[importDeclare.length]
     = `import ${exportName} from '${`./${join(relativeDir, name)}`}';`;
    exportDeclare[exportDeclare.length] = exportName;
  }
  return exportDeclare.length
    ? `${importDeclare.join(EOL)}${EOL}export default { ${exportDeclare.join(', ')} };${EOL}`
    : '';
}

function noneExport(files: string[], target: string): string {
  return files
    .map((file) => {
      const { name, dir } = parse(file);
      const relativeDir = relative(dirname(target), dir);
      return `import '${relativeDir ? join(relativeDir, name) : `./${name}`}';`;
    })
    .join(EOL);
}

function rebuildInput(input: InputOption | undefined, files: string[]): InputOption {
  if (typeof input === 'string') {
    return [input].concat(files);
  }
  else if (Array.isArray(input)) {
    return input.concat(files);
  }
  else if (input && typeof input === 'object') {
    return files.reduce((prev, cur) => {
      const obj = parse(cur);
      prev[obj.name] = cur;
      return prev;
    }, input);
  }
  return files;
}

function onExit(listener: (...args: any[]) => any): void {
  process.on('exit', listener);
  process.on('SIGHUP', listener);
  process.on('SIGINT', listener);
  process.on('SIGTERM', listener);
  process.on('SIGBREAK', listener);
  process.on('uncaughtException', listener);
  process.on('unhandledRejection', listener);
}

function offExit(listener: (...args: any[]) => any): void {
  process.off('exit', listener);
  process.off('SIGHUP', listener);
  process.off('SIGINT', listener);
  process.off('SIGTERM', listener);
  process.off('SIGBREAK', listener);
  process.off('uncaughtException', listener);
  process.off('unhandledRejection', listener);
}


export default function pluginCombine(opts: Options): PluginOption {
  if (!opts) {
    opts = {} as Options;
  }

  const { src, overwrite, nameExport } = opts;

  const enforce = ('enforce' in opts) ? opts.enforce : 'pre';
  // 导出类型
  const exportsType = opts.exports || 'named';
  // 组合到目标文件中
  const target = opts.target || 'index.js';
  // 当前工作目录
  const cwd = opts.cwd || process.cwd();

  // target 绝对地址
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

  let mainCode = '';
  switch (exportsType) {
    case 'named':
      mainCode = namedExport(files, absTarget, nameExport);
      break;
    case 'default': {
      mainCode = defaultExport(files, absTarget, nameExport);
      break;
    }
    default:
      mainCode = noneExport(files, absTarget);
  }
  const { beforeWrite } = opts;
  if (typeof beforeWrite === 'function') {
    const str = beforeWrite(mainCode);
    if (typeof str === 'string') {
      mainCode = str;
    }
  }
  writeFileSync(absTarget, mainCode);

  const plugin: PluginOption = {
    name: 'vite-plugin-combine',
    enforce,

    async config(config) {
      const inputs = files.concat(absTarget);
      const { build } = config;
      if (build) {
        const { lib, rollupOptions } = build;

        // 库模式
        if (lib && typeof lib === 'object') {
          return {
            build: {
              lib: {
                entry: rebuildInput(lib.entry, inputs)
              }
            }
          };
        }

        // 可能配置了 input
        else if (rollupOptions && typeof rollupOptions === 'object') {
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
      }
      catch (e) {}
    };
    onExit(clean);
    plugin.closeBundle = function () {
      clean();
    };
  }

  return plugin;
}
