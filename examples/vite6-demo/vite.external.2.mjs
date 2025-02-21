import { defineConfig } from 'vite';
import vitePluginExternal from 'vite-plugin-external';
import { globbySync } from 'globby';
import pkg from './package.json';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vitePluginExternal({
      // for build mode
      nodeBuiltins: true,
      externalizeDeps: Object.keys(pkg.devDependencies),

      // for serve mode
      externals: {}
    })
  ],
  build: {
    outDir: 'dist/external',
    minify: false,
    lib: {
      formats: ['es', 'cjs'],
      entry: globbySync('src/*.js'),
      fileName(format, entryName) {
        return entryName + (format === 'es' ? '.mjs' : '.js');
      }
    }
  }
});
