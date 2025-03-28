import vue from '@vitejs/plugin-vue';
import externalGlobals from 'rollup-plugin-external-globals';
import { defineConfig } from 'vite';
import pluginExternal from 'vite-plugin-external';

export default defineConfig({
  plugins: [
    vue(),
    pluginExternal({
      rollback: true,
      externalGlobals,
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
