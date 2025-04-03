import babel from '@vitejs/plugin-react';
import { defineConfig, Plugin } from 'vite';
import vitePluginExternal from 'vite-plugin-external';
import vitePluginReverseProxy from 'vite-plugin-reverse-proxy';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    babel({
      jsxRuntime: 'classic'
    }) as unknown as Plugin,
    vitePluginExternal({
      externals: {
        react: '$linkdesign.React',
        'react-dom': '$linkdesign.ReactDOM',
        'prop-types': '$linkdesign.PropTypes'
      }
    }),
    vitePluginReverseProxy({
      preambleCode: babel.preambleCode,
      targets: {
        '/app.js': 'index.jsx'
      }
    })
  ],
  server: {
    open: true
  },
  build: {
    outDir: 'dist/reverse-proxy',
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        manualChunks: undefined,
        assetFileNames: 'assets/[name][extname]',
        entryFileNames: '[name].js',
        format: 'iife'
      }
    }
  }
});
