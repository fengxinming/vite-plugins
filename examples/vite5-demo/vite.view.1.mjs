import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';
import pluginExternal from 'vite-plugin-external';
import pluginView from 'vite-plugin-view';

export default defineConfig({
  plugins: [
    pluginView({
      engine: 'pug',
      pretty: true
    }),
    vue(),
    pluginExternal({
      externals: {
        vue: 'Vue'
      }
    })
  ],
  optimizeDeps: {
    extensions: ['.pug']
  },
  resolve: {
    extensions: ['.pug']
  },
  server: {
    open: true
  },
  build: {
    outDir: 'dist/vue',
    minify: false,
    rollupOptions: {
      input: 'index.pug',
      output: {
        format: 'iife'
      }
    }
  }
});
