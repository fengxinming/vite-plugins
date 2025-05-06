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
      routes: {
        '/hello': 'hello',
        '/hello2'(req, res) {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'text/html');
          res.end('hello2');
        },
        '/hello3': {
          handler(req, res) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'text/html');
            res.end('hello3');
          }
        },
        '/json': {
          handler: { hello: 1 }
        },
        '/package.json': {
          file: './package.json'
        }
      }
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
    outDir: 'dist/mock-data/2',
    minify: false,
    rollupOptions: {
      output: {
        format: 'iife'
      }
    }
  }
});
