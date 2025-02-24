import { EOL } from 'node:os';
import { parse, isAbsolute, join, relative, dirname } from 'node:path';
import camelCase from 'camelcase';
import { globSync } from 'tinyglobby';

import { PluginOption, normalizePath } from 'vite';
import { Options, NameExport } from './typings';

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

function noneExport(files: string[], target: string) {
  return files
    .map((file) => {
      const { name, dir } = parse(file);
      const relativeDir = relative(dirname(target), dir);
      return `import '${relativeDir ? join(relativeDir, name) : `./${name}`}';`;
    })
    .join(EOL);
}


export default function createPlugin(opts: Options): PluginOption {
  if (!opts) {
    opts = {} as Options;
  }

  const { src, nameExport } = opts;

  const enforce = opts.enforce || 'pre';
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

  const files = globSync(src, { cwd, absolute: true });

  if (!files.length) {
    return;
  }

  const plugin: PluginOption = {
    name: 'vite-plugin-combine',
    enforce,

    config(config) {
      const { build } = config;
      if (!build || (!(build.lib && build.lib.entry) && !build.rollupOptions?.input)) {
        return {
          build: {
            lib: {
              entry: files.concat(absTarget)
            }
          }
        };
      }
    },
    resolveId(id: string) {
      if (id === absTarget) {
        return id;
      }
    },
    load(id: string) {
      if (id !== absTarget) {
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
      return mainCode;
    }
  };

  return plugin;
}
