import { defineConfig } from 'vite';
import pluginMockData from 'vite-plugin-mock-data';
import pluginExternal from 'vite-plugin-external';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    pluginExternal({
      externals: {
        react: '$linkdesign.React',
        'react-dom': '$linkdesign.ReactDOM',
        'prop-types': '$linkdesign.PropTypes'
      }
    }),
    pluginMockData({
      assets: './mockAssets',
      routes: [
        './mock',
        {
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
      ]
    })
  ],
  server: {
    open: true
  },
  build: {
    outDir: 'dist/mock-data',
    minify: false,
    rollupOptions: {
      output: {
        format: 'iife'
      }
    }
  }
});
