import { defineConfig } from 'vite';
import vitePluginMockData from 'vite-plugin-mock-data';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vitePluginMockData({
      mockAssetsDir: './mockAssets',
      mockRoutesDir: './mock',
      mockRoutes: {
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
    })
  ],
  build: {
    lib: {
      entry: './src/utils/isNumber.js',
      formats: ['es']
    }
  }
});
