import { EOL } from 'node:os';

import type { Identifier, ImportDefaultSpecifier, ImportNamespaceSpecifier, ImportSpecifier, Program } from 'acorn';
import { init, parse } from 'es-module-lexer';
import { Plugin } from 'vite';
import { banner } from 'vp-runtime-helper';

import { logger, PLUGIN_NAME } from './logger';
import { ImportSource, libConfig, Options } from './typings';

export * from './typings';


interface LibInfo extends libConfig {
  /**
   * 模块名称
   * Module name
   */
  name: string;
  /**
   * 替换新的模块路径
   * Replace with new module path
   */
  cjsTransformers: Array<(code: string) => string>;
 }

/**
 * 处理命名导出的模块
 * process named export modules
 */
function processLibs(
  libName: string,
  specifiers: Array<ImportSpecifier | ImportDefaultSpecifier | ImportNamespaceSpecifier>,
  lib: LibInfo
): string {
  const { importFrom, insertFrom, cjsTransformers } = lib;

  let newImportDeclarationStr = '';
  const insertSourceFn = (importer: string, libName: string) => {
    if (typeof insertFrom === 'function') {
      let importSources = insertFrom(importer, libName);
      if (typeof importSources === 'string') {
        importSources = [{ es: importSources }];
      }
      else if (Array.isArray(importSources)) {
        importSources = importSources.map((n) => {
          if (typeof n === 'string') {
            return { es: n };
          }
          return n;
        });
      }
      else {
        importSources = [importSources];
      }
      if (importSources) {
        newImportDeclarationStr += (importSources as ImportSource[]).reduce((prev, { es, cjs } = { es: '' }) => {
          if (es) {
            prev += `import "${es}";${EOL}`;
            if (cjs) {
              cjsTransformers.push((code) => {
                return code.replace(es, cjs);
              });
            }
          }
          return prev;
        }, '');
      }
    }
  };

  for (const specifier of specifiers) {
    switch (specifier.type) {
      case 'ImportDefaultSpecifier':
        insertSourceFn(specifier.local.name, libName);
        break;

      case 'ImportSpecifier': {
        const { name: importer } = specifier.imported as Identifier;
        if (importer) {
          if (typeof importFrom === 'function') {
            let source = importFrom(importer, libName);
            if (typeof source === 'string') {
              source = { es: source };
            }
            const { es, cjs } = source || {};
            if (es) {
              newImportDeclarationStr += `import ${importer} from "${es}";${EOL}`;
              if (cjs) {
                cjsTransformers.push((code) => {
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

/**
 * Separate importers from your code.
 *
 * @example
 * ```js
  import { defineConfig } from 'vite';
  import ts from '@rollup/plugin-typescript';
  import createExternal from 'vite-plugin-external';
  import separateImporter from 'vite-plugin-separate-importer';
  import decamelize from 'decamelize';

  export default defineConfig({
    plugins: [
      createExternal({
        externalizeDeps: ['react', 'antd']
      }),
      ts({
        compilerOptions: {
          declarationDir: 'dist'
        }
      }),
      separateImporter({
        libs: [
          {
            name: 'antd',
            importFrom(importer, libName) {
              return {
                es: `${libName}/es/${decamelize(importer)}`,
                cjs: `${libName}/lib/${decamelize(importer)}`
              };
            },
            insertFrom(importer, libName) {
              return {
                es: `${libName}/es/${decamelize(importer)}/style`,
                cjs: `${libName}/lib/${decamelize(importer)}/style`
              };
            }
          }
        ]
      })
    ],
    build: {
      minify: false,
      lib: {
        formats: ['es', 'cjs'],
        entry: ['src/*.tsx'],
        fileName(format, entryName) {
          return entryName + (format === 'es' ? '.mjs' : '.js');
        }
      }
    }
  });
 * ```
 *
 * @param opts options
 * @returns a vite plugin
 */
function pluginSeparateImporter(
  { enforce, libs = [], logLevel }: Options = {}
): Plugin | undefined {
  if (!Array.isArray(libs) || libs.length === 0) {
    logger.warn('No libs specified.');
    return;
  }

  if (logLevel) {
    logger.level = logLevel;
  }

  banner(PLUGIN_NAME);

  const libMap: Record<string, LibInfo> = {};
  for (const lib of libs) {
    const { name, importFrom } = lib;

    const makeLibInfo = (n: string) => {
      libMap[n] = {
        ...lib,
        name: n,
        cjsTransformers: []
      };
    };

    if (importFrom) {
      if (Array.isArray(name)) {
        name.forEach(makeLibInfo);
      }
      else {
        makeLibInfo(name);
      }
    }
  }

  return {
    name: PLUGIN_NAME,
    enforce,

    async transform(
      code: string,
      // id: string
    ) {
      // 转换文件内容，处理模块导入语句
      await init;

      const [imports] = parse(code);
      // n: package name
      // s: start
      // e: end
      // ss: statement start
      // se: statement end
      // d: dynamic import
      // a: assert

      let dest = code;
      for (const { n: libName, ss: startIndex, se: endIndex } of imports) {
        // 申明语句字符串 Statement string
        const importStr = code.substring(startIndex, endIndex);

        // 忽略异常import申明语句 Ignore invalid import declaration
        if (!libName || importStr.startsWith('import(')) {
          continue;
        }

        // 抽象语法树对象 AST Node object
        const ast = this.parse(importStr) as Program;

        const statement = ast.body[0];

        const { type } = statement;

        // 只处理import语法 Only ImportDeclaration
        if (type !== 'ImportDeclaration') {
          continue;
        }

        const { specifiers } = statement;

        // matched package name
        const currentLibInfo = libMap[libName];
        if (!currentLibInfo) {
          continue;
        }

        logger.trace('Matched lib name:', libName);

        // 处理模块 Process modules if it is valid
        const newImportStr = processLibs(libName, specifiers, currentLibInfo);

        if (newImportStr) {
          logger.trace('New import statement:', newImportStr);
          dest = dest.replace(importStr, newImportStr);
        }
      }
      return dest;
    },

    generateBundle(outputOptions, bundle) {
      // 在生成 bundle 时处理 cjs 格式源码
      if (outputOptions.format === 'cjs') {
        Object.entries(bundle).forEach(([, chunk]) => {
          if (chunk.type === 'chunk') {
            Object.entries(libMap).forEach(([, libInfo]) => {
              libInfo.cjsTransformers.forEach((fn) => {
                chunk.code = fn(chunk.code);
              });
            });
          }
        });
      }
    }
  } as Plugin;
}

export default pluginSeparateImporter;
