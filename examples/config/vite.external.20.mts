import vue from '@vitejs/plugin-vue';
import { defineConfig, Plugin } from 'vite';
import vitePluginExternal from 'vite-plugin-external';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vitePluginExternal({
      logLevel: 'TRACE',
      externals: {
        vue: 'Vue'
      }
    }) as Plugin,
    vue() as Plugin
  ],
  build: {
    minify: false,
    outDir: 'dist/external/20',
    rollupOptions: {
      input: 'index4.html',
      output: {
        format: 'iife'
      }
    }
  }
});
