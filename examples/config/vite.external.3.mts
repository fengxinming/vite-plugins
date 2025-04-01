import { defineConfig, Plugin } from 'vite';
import vitePluginExternal from 'vite-plugin-external';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vitePluginExternal({
      logLevel: 'TRACE',
      externals(libName) {
        if (libName === 'react') {
          return '$linkdesign.React';
        }
        if (libName === 'react-dom') {
          return '$linkdesign.ReactDOM';
        }
        if (libName === 'prop-types') {
          return '$linkdesign.PropTypes';
        }
      }
    }) as Plugin
  ],
  server: {
    open: true
  },
  build: {
    minify: false,
    outDir: 'dist/external/3',
    rollupOptions: {
      input: 'index.html',
      output: {
        format: 'iife'
      }
    }
  }
});
