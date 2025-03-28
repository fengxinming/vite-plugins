import { globSync } from 'tinyglobby';
import { defineConfig } from 'vite';
import vitePluginExternal from 'vite-plugin-external';

import pkg from './package.json';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vitePluginExternal({
      logLevel: 'TRACE',
      // for build mode
      nodeBuiltins: true,
      externalizeDeps: Object.keys(pkg.devDependencies)

      // for serve mode
      // externals: {}
    })
  ],
  build: {
    outDir: 'dist/external/2',
    minify: false,
    lib: {
      formats: ['es', 'cjs'],
      entry: globSync('src/*.js'),
      fileName(format, entryName) {
        return entryName + (format === 'es' ? '.mjs' : '.js');
      }
    }
  }
});
