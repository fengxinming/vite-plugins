import react from '@vitejs/plugin-react';
import nunjucks from 'nunjucks';
import { defineConfig, Plugin } from 'vite';
import vitePluginExternal from 'vite-plugin-external';
import { engineSource, view } from 'vite-plugin-view';

const env = new nunjucks.Environment();

env.addFilter('stringify', (obj) => {
  return JSON.stringify(obj, null, 2);
});

engineSource.requires.nunjucks = env;

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
    }) as unknown as Plugin,
    view({
      entry: 'index.njk',
      engine: 'nunjucks',
      extension: '.njk',
      logLevel: 'TRACE',
      engineOptions: {
        title: 'Vite + React'
      }
    }) as Plugin
  ],
  server: {
    open: true
  },
  build: {
    minify: false,
    outDir: 'dist/view/3',
    rollupOptions: {
      output: {
        format: 'iife'
      }
    }
  }
});
