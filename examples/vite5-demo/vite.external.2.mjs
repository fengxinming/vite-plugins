import { globSync } from 'tinyglobby';
import { defineConfig } from 'vite';
import vitePluginExternal from 'vite-plugin-external';

import pkg from './package.json';

export default defineConfig({
  plugins: [
    vitePluginExternal({
      // for build mode
      nodeBuiltins: true,
      externalizeDeps: Object.keys(pkg.devDependencies)

      // for serve mode
      // externals: {}
    })
  ],
  build: {
    outDir: 'dist/external',
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
