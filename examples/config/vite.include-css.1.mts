import type { Plugin } from 'vite';
import { defineConfig } from 'vite';
import vitePluginExternal from 'vite-plugin-external';
import vitePluginIncludeCss from 'vite-plugin-include-css';
import { view } from 'vite-plugin-view';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vitePluginExternal({
      externals: {
        react: '$linkdesign.React',
        'react-dom': '$linkdesign.ReactDOM',
        'prop-types': '$linkdesign.PropTypes'
      }
    }) as unknown as Plugin,
    vitePluginIncludeCss() as unknown as Plugin,
    view({
      engine: 'pug',
      engineOptions: {
        title: 'Vite + React + Pug',
        reactVersion: '16.x'
      }
    }) as unknown as Plugin
  ],
  server: {
    open: true
  },
  build: {
    outDir: 'dist/include-css',
    cssCodeSplit: false,
    minify: false,
    rollupOptions: {
      output: {
        format: 'iife'
      }
    }
  }
});
