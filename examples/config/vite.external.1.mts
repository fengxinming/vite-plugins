import react from '@vitejs/plugin-react';
import type { Plugin } from 'vite';
import { defineConfig } from 'vite';
import vitePluginExternal from 'vite-plugin-external';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      jsxRuntime: 'classic'
    }) as unknown as Plugin,
    vitePluginExternal({
      logLevel: 'TRACE',
      externals: {
        react: '$linkdesign.React',
        'react-dom': '$linkdesign.ReactDOM',
        'prop-types': '$linkdesign.PropTypes'
      }
    })
  ],
  server: {
    open: true
  },
  build: {
    minify: false,
    cssCodeSplit: false,
    outDir: 'dist/external/1',
    rollupOptions: {
      input: 'index.html',
      output: {
        format: 'iife'
      }
    }
  }
});
