import { defineConfig } from 'vite';
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
      entry: ['src/separate-importer.js', 'src/separate-importer2.js'],
      fileName(format, entryName) {
        return entryName + (format === 'es' ? '.mjs' : '.js');
      }
    }
  }
});
