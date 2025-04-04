import externalGlobals from 'rollup-plugin-external-globals';
import { defineConfig } from 'vite';
import vitePluginExternal from 'vite-plugin-external';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vitePluginExternal({
      logLevel: 'TRACE',
      externalGlobals,
      externals(libName) {
        if (libName === 'react') {
          return 'React';
        }
        if (libName === 'react-dom/client') {
          return 'ReactDOM';
        }
      }
    })
  ],
  server: {
    open: true
  },
  build: {
    minify: false,
    outDir: 'dist/external/7',
    rollupOptions: {
      input: 'index2.html',
      output: {
        format: 'iife'
      }
    }
  }
});
