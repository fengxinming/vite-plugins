import { PluginContext } from 'rollup';
import { Plugin } from 'vite';
import { Options } from './typings';
export * from './typings';
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
        externalizeDeps: ['antd']
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
            importerSource(importer, libName) {
              return {
                es: `${libName}/es/${decamelize(importer)}`,
                cjs: `${libName}/lib/${decamelize(importer)}`
              };
            },
            insertImport(importer, libName) {
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
declare function createPlugin(this: PluginContext, { enforce, libs }?: Options): Plugin | undefined;
export default createPlugin;
