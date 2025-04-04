import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';
import vitePluginExternal from 'vite-plugin-external';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vitePluginExternal({
      logLevel: 'TRACE',
      externals: {
        vue: 'Vue'
      }
    }),
    vue()
  ],
  server: {
    open: true
  },
  build: {
    minify: false,
    outDir: 'dist/external/10',
    rollupOptions: {
      input: 'index4.html',
      output: {
        format: 'iife'
      }
    }
  }
});
