import { defineConfig } from 'vite';
import ts from '@rollup/plugin-typescript';
import vitePluginExternal from 'vite-plugin-external';
import vitePluginSeparateImporter from 'vite-plugin-separate-importer';
import pkg from './package.json';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vitePluginExternal({
      nodeBuiltins: true,
      externalizeDeps: Object.keys(pkg.dependencies)
    }),
    ts({
      compilerOptions: {
        declarationDir: 'dist/separate-importer'
      }
    }),
    vitePluginSeparateImporter({
      libs: [
        {
          name: 'celia',
          importerSource(importer, libName) {
            return `${libName}/es/${importer}`;
          },
          importerSourceForCJS(importerSource) {
            return importerSource.replace('/es/', '/lib/');
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
      entry: ['src/separate-importer.ts', 'src/separate-importer2.js'],
      fileName(format, entryName) {
        return entryName + (format === 'es' ? '.mjs' : '.js');
      }
    }
  }
});
