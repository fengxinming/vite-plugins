import vue from '@vitejs/plugin-vue';
import { defineConfig, Plugin } from 'vite';
import vitePluginExternal from 'vite-plugin-external';
import { view } from 'vite-plugin-view';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vitePluginExternal({
      logLevel: 'TRACE',
      externals: {
        vue: 'Vue'
      }
    }) as Plugin,
    vue() as Plugin,
    view({
      engine: 'pug',
      logLevel: 'TRACE',
      engineOptions: {
        title: 'Vite + Vue'
      }
    }) as Plugin
  ],
  server: {
    open: true
  },
  build: {
    minify: false,
    outDir: 'dist/view/6',
    rollupOptions: {
      output: {
        format: 'iife'
      }
    }
  }
});
