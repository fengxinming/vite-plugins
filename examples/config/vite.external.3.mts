import react from '@vitejs/plugin-react';
import type { Plugin } from 'vite';
import { defineConfig } from 'vite';
import vitePluginExternal from 'vite-plugin-external';
import { view } from 'vite-plugin-view';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      jsxRuntime: 'classic'
    }) as unknown as Plugin,
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
    }) as unknown as Plugin,
    view({
      engine: 'pug',
      engineOptions: {
        title: 'Vite + React + Pug',
        reactVersion: '16.x'
      }
    }) as unknown as Plugin
  ],
  server: {
    open: true
  },
  build: {
    minify: false,
    outDir: 'dist/external/3',
    rollupOptions: {
      output: {
        format: 'iife'
      }
    }
  }
});
