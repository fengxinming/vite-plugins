import react from '@vitejs/plugin-react';
import { defineConfig, Plugin } from 'vite';
import vitePluginExternal from 'vite-plugin-external';
import { view } from 'vite-plugin-view';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vitePluginExternal({
      logLevel: 'TRACE',
      externals: {
        react: 'React',
        'react-dom/client': 'ReactDOM'
      }
    }) as Plugin,
    react({
      jsxRuntime: 'classic'
    }) as unknown as Plugin,
    view({
      entry: 'index.ejs',
      engine: 'ejs',
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
    outDir: 'dist/view/5',
    rollupOptions: {
      output: {
        format: 'iife'
      }
    }
  }
});
