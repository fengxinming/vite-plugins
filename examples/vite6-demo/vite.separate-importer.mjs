import { defineConfig } from 'vite';
import ts from '@rollup/plugin-typescript';
import createExternal from 'vite-plugin-external';
import separateImporter from 'vite-plugin-separate-importer';
import decamelize from 'decamelize';

export default defineConfig({
  plugins: [
    createExternal({
      externalizeDeps: ['vue', 'vant']
    }),
    ts({
      compilerOptions: {
        declarationDir: 'dist/separate-importer'
      }
    }),
    separateImporter({
      libs: [
        {
          name: 'vant',
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
      entry: ['src/separate-importer.ts'],
      fileName(format, entryName) {
        return entryName + (format === 'es' ? '.mjs' : '.js');
      }
    }
  }
});
