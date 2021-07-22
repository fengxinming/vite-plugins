import { join } from 'path';
import { defineConfig } from 'vite';
import reactRefresh from '@vitejs/plugin-react-refresh';
import libs from '@ali/linkdesign-lib';
import moduleScript from 'vite-plugin-module-script';
import external from './vite-plugin-external';

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: [
      { find: '@', replacement: join(__dirname, 'src') }
    ]
  },
  plugins: [
    moduleScript({
      mapping: {
        '/app.js': '/src/index.jsx'
      }
    }),
    external({
      externals: {
        '@linkdesign/components': 'LinkDesignComponents',
        '@alicloud/console-components': 'AlicloudConsoleComponents',
        "react": "$linkdesign.React",
         "react-dom": "$linkdesign.ReactDOM",
         "prop-types": "$linkdesign.PropTypes",
          "history": "$linkdesign.History",
          "moment": "$linkdesign.Moment",
          "react-router": "$linkdesign.ReactRouter"
      }
    }),
    reactRefresh()
  ],
  build: {
    outDir: 'build',
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        manualChunks: undefined,
        assetFileNames: 'assets/[name][extname]',
        entryFileNames: 'assets/[name].js',
        format: 'iife'
      }
    },
    minify: 'esbuild'
  }
});
