import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import pluginExternal from 'vite-plugin-external';

export default defineConfig({
  plugins: [
    vue(),
    pluginExternal({
      externals: {
        vue: 'Vue'
      }
    })
  ],
  server: {
    open: true
  },
  build: {
    outDir: 'dist/vue',
    minify: false,
    rollupOptions: {
      output: {
        format: 'iife'
      }
    }
  }
});
