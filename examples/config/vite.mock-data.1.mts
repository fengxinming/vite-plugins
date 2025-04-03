import { defineConfig } from 'vite';
import pluginExternal from 'vite-plugin-external';
import pluginMockData from 'vite-plugin-mock-data';

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
      logLevel: 'TRACE',
      routes: './mock'
    })
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
