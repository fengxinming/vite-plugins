import { EOL } from 'node:os';
import { parse, isAbsolute, join, normalize, relative, dirname } from 'node:path';
import { writeFileSync, existsSync, unlinkSync } from 'node:fs';
import camelCase from 'camelcase';
import { globbySync } from 'globby';

import { Plugin } from 'vite';

export type TransformName = (name: string, filePath: string) => string;

export interface Options {
  /**
   * Files prepared for combine.
   *
   * 准备合并的文件
   */
  src: string | string[];
  /**
   * Combines into the target file.
   *
   * 组合到目标文件
   *
   * @default 'index.js'
   */
  target: string;

  /**
   * Whether to overwrite the target file.
   *
   * 是否覆盖目标文件
   *
   * @default false
   */
  overwrite?: boolean;

  /**
   * Transforms file names.
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
   * The value of enforce can be either `"pre"` or `"post"`, see more at https://vitejs.dev/guide/api-plugin.html#plugin-ordering.
   *
   * 强制执行顺序，`pre` 前，`post` 后，参考 https://cn.vitejs.dev/guide/api-plugin.html#plugin-ordering。
   */
  enforce?: 'pre' | 'post';

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
    .join(EOL)
    .concat(EOL);
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

  const { src, transformName, overwrite } = opts;

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
  absTarget = normalize(absTarget);
  if (!overwrite && existsSync(absTarget)) {
    throw new Error(`'${absTarget}' exists.`);
  }

  const plugin: Plugin = {
    name: 'vite-plugin-combine',
    enforce
  };

  const files = globbySync(src, { cwd, absolute: true });

  if (files.length) {
    let mainCode = '';
    switch (exportsType) {
      case 'named':
        mainCode = namedExport(files, absTarget, transformName);
        break;
      case 'default': {
        mainCode = defaultExport(files, absTarget, transformName);
        break;
      }
      default:
        mainCode = noneExport(files, absTarget);
    }

    writeFileSync(absTarget, mainCode, 'utf-8');

    plugin.config = function (config) {
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
    };

    plugin.resolveId = function (id) {
      if (id === target || id === absTarget) {
        return absTarget;
      }
    };

    if (!overwrite) {
      plugin.closeBundle = function () {
        try {
          unlinkSync(absTarget);
        }
        catch (e) {}
      };
    }
  }

  return plugin;
}
