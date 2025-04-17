import { globSync } from 'tinyglobby';
import { defineConfig } from 'vite';
import vitePluginExternal from 'vite-plugin-external';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vitePluginExternal({
      logLevel: 'TRACE',
      nodeBuiltins: true,
      externalizeDeps: ['vite']
    })
  ],
  build: {
    outDir: 'dist/external/9',
    minify: false,
    lib: {
      formats: ['es', 'cjs'],
      entry: globSync('src/util/*.js'),
      fileName(format, entryName) {
        return entryName + (format === 'es' ? '.mjs' : '.js');
      }
    }
  }
});
