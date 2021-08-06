import { join } from 'path';
import { defineConfig } from 'vite';
import { getBabelInputPlugin } from '@rollup/plugin-babel';
import reactRefresh from '../../packages/vite-plugin-react-refresh';
import createExternal from '../../packages/vite-plugin-external';

// https://vitejs.dev/config/
export default function ({ mode }) {
  const isProd = mode === 'production';

  return defineConfig({
    esbuild: isProd ? false : undefined,
    resolve: {
      alias: [
        { find: '@', replacement: join(__dirname, 'src') }
      ]
    },
    plugins: [
      createExternal({
        externals: {
          'history': '$linkdesign.History',
          'moment': '$linkdesign.Moment'
        },
        production: {
          externals: {
            '@linkdesign/components': 'LinkDesignComponents',
            '@alicloud/console-components': 'AlicloudConsoleComponents',
            'react': '$linkdesign.React',
            'react-dom': '$linkdesign.ReactDOM',
            'react-router': '$linkdesign.ReactRouter',
            'prop-types': '$linkdesign.PropTypes'
          }
        }
      }),
      reactRefresh({
        transformPlugins: [
          'babel-plugin-jsx-advanced'
        ]
      }),
      isProd && getBabelInputPlugin({
        babelHelpers: 'runtime'
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
          entryFileNames: 'assets/[name].js',
          format: 'iife'
        }
      }
    }
  });
}
