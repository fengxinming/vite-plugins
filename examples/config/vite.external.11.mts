import vue from '@vitejs/plugin-vue';
import type { Plugin } from 'vite';
import { defineConfig } from 'vite';
import vitePluginExternal from 'vite-plugin-external';
import { view } from 'vite-plugin-view';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue() as Plugin,
    vitePluginExternal({
      logLevel: 'TRACE',
      externals: {
        vue: 'Vue'
      }
    }) as unknown as Plugin,
    view({
      engine: 'pug',
      logLevel: 'TRACE',
      engineOptions: {
        title: 'Vite + Vue + Pug',
        vueVersion: '3.x'
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
