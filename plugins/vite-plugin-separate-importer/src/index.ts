import { EOL } from 'node:os';

import type {
  ExportSpecifier, IdentifierName, ImportDefaultSpecifier, ImportNamespaceSpecifier, ImportSpecifier
} from '@oxc-project/types';
import { init, parse } from 'es-module-lexer';
import type { Plugin } from 'vite';
import { banner } from 'vp-runtime-helper';

import { logger, PLUGIN_NAME } from './logger';
import type { ImportSource, libConfig, Options } from './types';

export * from './types';


interface LibInfo extends libConfig {
  /**
   * 模块名称
   * Module name
   */
  name: string;
  /**
   * CJS 产物的路径替换器数组：每个函数把代码里的 es 路径换成对应 cjs 路径，
   * 在 generateBundle 阶段对 cjs chunk 逐条执行（由 resolveModule / insertSideEffect 登记）。
   * Replacers that rewrite es paths to their cjs counterparts in CJS output,
   * registered by resolveModule / insertSideEffect and applied in generateBundle.
   */
  cjsTransformers: Array<(code: string) => string>;
 }

/**
 * 处理命名导出的模块
 * process named export modules
 */
function processLibs(
  libName: string,
  specifiers: Array<ImportSpecifier | ImportDefaultSpecifier | ImportNamespaceSpecifier | ExportSpecifier>,
  lib: LibInfo
): string {
  const { resolveModule, insertSideEffect, cjsTransformers } = lib;

  let newImportDeclarationStr = '';
  const insertSourceFn = (importer: string, libName: string) => {
    if (typeof insertSideEffect === 'function') {
      let importSources = insertSideEffect(importer, libName);
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
        const { name: importedName } = specifier.imported as IdentifierName;
        if (importedName) {
          if (typeof resolveModule === 'function') {
            let source = resolveModule(importedName, libName);
            if (typeof source === 'string') {
              source = { es: source };
            }
            const { es, cjs, name: newImporter } = source || {};
            if (es) {
              newImportDeclarationStr += `import ${newImporter || importedName} from "${es}";${EOL}`;
              if (cjs) {
                cjsTransformers.push((code) => {
                  return code.replace(es, cjs);
                });
              }
            }
          }
        }
        insertSourceFn(importedName, libName);
        break;
      }

      case 'ExportSpecifier': {
        const { name: importedName } = specifier.local as IdentifierName;
        const { name: exportedName } = specifier.exported as IdentifierName;
        if (importedName) {
          if (typeof resolveModule === 'function') {
            let source = resolveModule(importedName, libName);
            if (typeof source === 'string') {
              source = { es: source };
            }
            const { es, cjs } = source || {};
            if (es) {
              newImportDeclarationStr += `export { default as ${exportedName} } from "${es}";${EOL}`;
              if (cjs) {
                cjsTransformers.push((code) => {
                  return code.replace(es, cjs);
                });
              }
            }
          }
        }
        insertSourceFn(importedName, libName);
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
  import createExternal from 'vite-plugin-external';
  import separateImporter from 'vite-plugin-separate-importer';
  import { decamelize } from 'camel-kit';

  export default defineConfig({
    plugins: [
      createExternal({
        externalizeDeps: ['react', 'antd']
      }),
      separateImporter({
        libs: [
          {
            name: 'antd',
            resolveModule(importer, libName) {
              return {
                es: `${libName}/es/${decamelize(importer)}`,
                cjs: `${libName}/lib/${decamelize(importer)}`
              };
            },
            insertSideEffect(importer, libName) {
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
  opts: Options = {}
): Plugin | undefined {
  const { enforce, libs = [], logLevel } = opts;

  if (!Array.isArray(libs) || libs.length === 0) {
    logger.warn('No libs specified.');
    return;
  }

  if (logLevel) {
    logger.level = logLevel;
  }

  if (opts.enableBanner) {
    banner(PLUGIN_NAME);
  }

  const libMap: Record<string, LibInfo> = {};
  for (const lib of libs) {
    const { name, resolveModule } = lib;

    const makeLibInfo = (n: string) => {
      libMap[n] = {
        ...lib,
        name: n,
        cjsTransformers: []
      };
    };

    if (resolveModule) {
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
    apply: opts.apply ?? 'build',

    async transform(
      code: string,
      // id: string
    ) {
      // 转换文件内容，处理模块导入语句
      await init();

      const [imports] = parse(code);

      let dest = code;
      for (const { type: importType, specifier: libName, importStart: startIndex, importEnd: endIndex } of imports) {
        // 只处理静态导入 Only static imports
        if (importType !== 'static' || !libName) {
          continue;
        }

        // 申明语句字符串 Statement string
        const importStr = code.substring(startIndex, endIndex);

        // 抽象语法树对象 AST Node object
        const ast = this.parse(importStr);

        const statement = ast.body[0];
        const { type: statementType } = statement;

        // 只处理 import 与 named re-export Only ImportDeclaration / ExportNamedDeclaration
        if (statementType !== 'ImportDeclaration' && statementType !== 'ExportNamedDeclaration') {
          continue;
        }

        // re-export 必须带 source（export { x } from 'mod'）；本地 export { x } 无来源可拆
        if (statementType === 'ExportNamedDeclaration' && !statement.source) {
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
