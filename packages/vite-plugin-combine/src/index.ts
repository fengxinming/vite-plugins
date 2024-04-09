import { EOL } from 'node:os';
import { parse, isAbsolute, join, normalize, relative, dirname } from 'node:path';
import { writeFile } from 'node:fs';
import camelCase, { Options as CamelCaseOptions } from 'camelcase';
import { globbySync } from 'globby';

import { Plugin } from 'vite';

export type CamelCase = CamelCaseOptions;

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
   * Configuration for the camelcase function.
   * https://github.com/sindresorhus/camelcase?tab=readme-ov-file#camelcaseinput-options
   *
   * camelcase 函数的配置
   */
  camelCase?: CamelCaseOptions;

  /**
   * Exported module types.
   *
   * 导出的模块类型
   *
   * @default 'named'
   */
  exports?: 'named' | 'default' | 'none';

  /**
   * Whether to generate `.d.ts` files.
   *
   * 是否生成 d.ts 文件
   *
   * @default false
   */
  dts?: boolean;

  /**
   * Current Working Directory.
   *
   * 当前工作目录
   */
  cwd?: string;
}

function camelCaseName(file: string, camelCaseOptions?: CamelCaseOptions | false): string {
  let { name } = parse(file);
  if (camelCaseOptions !== false) {
    name = camelCase(name, camelCaseOptions);
  }
  return name;
}

function namedExport(files: string[], target: string, camelCaseOptions?: CamelCaseOptions | false): string {
  return files
    .map((file) => {
      const { name, dir } = parse(file);
      const exportName = camelCaseName(name, camelCaseOptions);
      const relativeDir = relative(dirname(target), dir);
      return `export { default as ${exportName} } from '${relativeDir ? join(relativeDir, name) : `./${name}`}';`;
    })
    .join(EOL);
}

function defaultExport(files: string[], target: string, camelCaseOptions?: CamelCaseOptions | false): string {
  const importDeclare: string[] = [];
  const exportDeclare: string[] = [];
  let exportName;
  for (const file of files) {
    const { name, dir } = parse(file);
    exportName = camelCaseName(name, camelCaseOptions);
    const relativeDir = relative(dirname(target), dir);
    importDeclare[importDeclare.length]
     = `import ${exportName} from '${relativeDir ? join(relativeDir, name) : `./${name}`}';`;
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

  const { src, camelCase, dts } = opts;

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
            mainCode = namedExport(files, id, camelCase);
            break;
          case 'default': {
            mainCode = defaultExport(files, id, camelCase);
            break;
          }
          default:
            mainCode = noneExport(files, id);
        }
        return mainCode;
      }
    },

    writeBundle(options) {
      if (dts && ['es', 'esm'].includes(options.format)) {
        const { dir, file } = options;
        let p;
        if (file) {
          p = dirname(file);
        }
        else if (dir) {
          p = dir;
        }

        if (p && !isAbsolute(p)) {
          p = join(cwd, p);
        }
        if (p && mainCode) {
          const mainObj = parse(target);
          writeFile(
            join(p, `${mainObj.name}.d.ts`), mainCode.replace(new RegExp(join(cwd, mainObj.dir), 'g'), '.'),
            (err) => {
              if (err) {
                console.error(err);
              }
              mainCode = '';
            });
        }
      }
    }
  };
}
