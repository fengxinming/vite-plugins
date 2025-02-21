import { defineConfig } from 'vite';
import pluginExternal from 'vite-plugin-external';
import pluginSeparateImporter from 'vite-plugin-separate-importer';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    pluginExternal({
      nodeBuiltins: true,
      externalizeDeps: Object.keys()
    }),
    pluginSeparateImporter({
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
