import { EOL } from 'node:os';
import { parse, isAbsolute, join, normalize, relative, dirname } from 'node:path';
import { writeFile } from 'node:fs';
import camelCase from 'camelcase';
import { globbySync } from 'globby';

import { Plugin } from 'vite';

export type TransformName = (name: string, filePath: string) => string;

export interface Options {
  /**
   * Files prepared for merging.
   *
   * 准备合并的文件
   */
  src: string | string[];
  /**
   * Merging into the target file.
   *
   * @default 'index.js'
   */
  target: string;

  /**
   * Transform file names
   *
   * 转换文件名
   */
  transformName?: TransformName | boolean;

  /**
   * Exported module types.
   *
   * 导出的模块类型
   *
   * @default 'named'
   */
  exports?: 'named' | 'default' | 'none';

  /**
   * Generate the `index.d.ts` file to a specified path.
   *
   * 生成 `index.d.ts` 文件到指定路径
   */
  dts?: string;

  /**
   * Current Working Directory.
   *
   * 当前工作目录
   */
  cwd?: string;
}

function camelCaseName(name: string, filePath: string, transformName?: TransformName | boolean): string {
  if (transformName) {
    switch (typeof transformName) {
      case 'boolean':
        return camelCase(name);
      case 'function':
        return transformName(name, filePath);
    }
  }
  return name;
}

function namedExport(files: string[], target: string, transformName?: TransformName | boolean): string {
  return files
    .map((file) => {
      const { name, dir } = parse(file);
      const exportName = camelCaseName(name, file, transformName);
      const relativeDir = relative(dirname(target), dir);
      return `export { default as ${exportName} } from '${`./${join(relativeDir, name)}`}';`;
    })
    .join(EOL);
}

function defaultExport(files: string[], target: string, transformName?: TransformName | boolean): string {
  const importDeclare: string[] = [];
  const exportDeclare: string[] = [];
  let exportName;
  for (const file of files) {
    const { name, dir } = parse(file);
    exportName = camelCaseName(name, file, transformName);
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

export default function createPlugin(opts: Options): Plugin {
  if (!opts) {
    opts = {} as Options;
  }

  const { src, transformName, dts } = opts;

  const exportsType = opts.exports || 'named';
  let target = opts.target || 'index.js';
  const cwd = opts.cwd || process.cwd();

  if (!isAbsolute(target)) {
    target = join(cwd, target);
  }
  target = normalize(target);

  const files = globbySync(src, { cwd, absolute: true });
  let mainCode = '';

  return {
    name: 'vite-plugin-combine',

    config(config) {
      const { build } = config;
      if (!build || (!(build.lib && build.lib.entry) && !build.rollupOptions?.input)) {
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
          return '';
        }

        switch (exportsType) {
          case 'named':
            mainCode = namedExport(files, id, transformName);
            break;
          case 'default': {
            mainCode = defaultExport(files, id, transformName);
            break;
          }
          default:
            mainCode = noneExport(files, id);
        }
        return mainCode;
      }
    },

    closeBundle() {
      if (dts) {
        let dtsPath = dts;
        if (!isAbsolute(dtsPath)) {
          dtsPath = join(cwd, dtsPath);
        }
        if (mainCode) {
          writeFile(join(dtsPath, 'index.d.ts'), mainCode, (err) => {
            if (err) {
              console.error(err);
            }
          });
        }
      }
    }
  };
}
