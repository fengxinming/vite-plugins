import react from '@vitejs/plugin-react';
import { defineConfig, Plugin } from 'vite';
import vitePluginExternal from 'vite-plugin-external';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      jsxRuntime: 'classic'
    }) as unknown as Plugin,
    vitePluginExternal({
      interop: 'auto',
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
    outDir: 'dist/external/2',
    rollupOptions: {
      input: 'index.html',
      output: {
        format: 'iife'
      }
    }
  }
});
