import type { Plugin } from 'vite';
import { defineConfig } from 'vite';
import pluginExternal from 'vite-plugin-external';
import pluginMockData from 'vite-plugin-mock-data';
import { view } from 'vite-plugin-view';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    pluginExternal({
      externals: {
        react: '$linkdesign.React',
        'react-dom': '$linkdesign.ReactDOM',
        'prop-types': '$linkdesign.PropTypes'
      }
    }) as unknown as Plugin,
    pluginMockData({
      logLevel: 'TRACE',
      routes: './mock'
    }) as unknown as Plugin,
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
    outDir: 'dist/mock-data/1',
    minify: false,
    rollupOptions: {

      output: {
        format: 'iife'
      }
    }
  }
});
