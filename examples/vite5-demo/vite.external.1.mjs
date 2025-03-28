import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';
import pluginExternal from 'vite-plugin-external';

export default defineConfig({
  plugins: [
    vue(),
    pluginExternal({
      logLevel: 'TRACE',
      interop: 'auto',
      rollback: true,
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
