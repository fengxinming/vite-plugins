import react from '@vitejs/plugin-react';
import Handlebars from 'handlebars';
import { defineConfig, Plugin } from 'vite';
import vitePluginExternal from 'vite-plugin-external';
import { view } from 'vite-plugin-view';

Handlebars.registerHelper('stringify', (obj) => {
  return JSON.stringify(obj, null, 2);
});

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      jsxRuntime: 'classic'
    }) as unknown as Plugin,
    vitePluginExternal({
      logLevel: 'TRACE',
      externals: {
        react: 'React',
        'react-dom/client': 'ReactDOM'
      }
    }) as Plugin,
    view({
      entry: 'index.handlebars',
      engine: 'handlebars',
      logLevel: 'TRACE'
    }) as Plugin
  ],
  server: {
    open: true
  },
  build: {
    minify: false,
    outDir: 'dist/view/4',
    rollupOptions: {
      output: {
        format: 'iife'
      }
    }
  }
});
