import ts from '@rollup/plugin-typescript';
import decamelize from 'decamelize';
import { defineConfig } from 'vite';
import pluginExternal from 'vite-plugin-external';
import pluginSeparateImporter from 'vite-plugin-separate-importer';

export default defineConfig({
  plugins: [
    pluginExternal({
      externalizeDeps: ['antd']
    }),
    ts({
      compilerOptions: {
        declarationDir: 'dist/separate-importer'
      }
    }),
    pluginSeparateImporter({
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
    outDir: 'dist/separate-importer',
    minify: false,
    lib: {
      formats: ['es', 'cjs'],
      entry: ['src/separate-importer.tsx'],
      fileName(format, entryName) {
        return entryName + (format === 'es' ? '.mjs' : '.js');
      }
    }
  }
});
