import react from '@vitejs/plugin-react';
import externalGlobals from 'rollup-plugin-external-globals';
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
      externalGlobals,
      logLevel: 'TRACE',
      externals: {
        react: 'React',
        'react-dom/client': 'ReactDOM'
      }
    }) as unknown as Plugin,
    view({
      engine: 'pug',
      engineOptions: {
        title: 'Vite + React + Pug',
        reactVersion: '18.x'
      }
    }) as unknown as Plugin
  ],
  server: {
    open: true
  },
  build: {
    minify: false,
    outDir: 'dist/external/8',
    rollupOptions: {
      output: {
        format: 'iife'
      }
    }
  }
});
