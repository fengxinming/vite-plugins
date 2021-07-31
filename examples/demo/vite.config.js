import { join } from 'path';
import { defineConfig } from 'vite';
import reactRefresh from '../../packages/vite-plugin-react-refresh';
import moduleScript from '../../packages/vite-plugin-module-script';
import createExternal from '../../packages/vite-plugin-external';

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
    createExternal({
      externals: {
        'history': '$linkdesign.History',
        'moment': '$linkdesign.Moment',
        'react-router': '$linkdesign.ReactRouter'
      },
      production: {
        externals: {
          '@linkdesign/components': 'LinkDesignComponents',
          '@alicloud/console-components': 'AlicloudConsoleComponents',
          'react': '$linkdesign.React',
          'react-dom': '$linkdesign.ReactDOM',
          'prop-types': '$linkdesign.PropTypes'
        }
      }
    }),
    reactRefresh({
      transformPlugins: [
        'babel-plugin-jsx-advanced'
      ]
    })
  ],
  build: {
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
