import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import pluginExternal from 'vite-plugin-external';

export default defineConfig({
  plugins: [
    vue(),
    pluginExternal({
      interop: 'auto',
      externals: {
        vue: 'Vue'
      }
    })
  ],
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
