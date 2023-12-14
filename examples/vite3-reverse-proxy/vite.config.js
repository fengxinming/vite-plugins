import { defineConfig } from 'vite';
import vitePluginExternal from 'vite-plugin-external';
import vitePluginReverseProxy from 'vite-plugin-reverse-proxy';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vitePluginExternal({
      externals: {
        react: '$linkdesign.React',
        'react-dom': '$linkdesign.ReactDOM',
        'prop-types': '$linkdesign.PropTypes'
      }
    }),
    vitePluginReverseProxy({
      targets: {
        '/app.js': 'index.jsx'
      }
    })
  ],
  server: {
    open: true
  },
  build: {
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
