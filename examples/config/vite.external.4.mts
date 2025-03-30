import externalGlobals from 'rollup-plugin-external-globals';
import { defineConfig } from 'vite';
import vitePluginExternal from 'vite-plugin-external';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vitePluginExternal({
      externalGlobals,
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
    outDir: 'dist/external/4',
    rollupOptions: {
      input: 'index.html',
      output: {
        format: 'iife'
      }
    }
  }
});
