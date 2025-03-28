import { defineConfig } from 'vite';
import vitePluginExternal from 'vite-plugin-external';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vitePluginExternal({
      logLevel: 'TRACE',
      interop: 'auto',
      rollback: true,
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
    outDir: 'dist/external/2',
    rollupOptions: {
      output: {
        format: 'iife'
      }
    }
  }
});
