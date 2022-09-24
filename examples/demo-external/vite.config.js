import { fileURLToPath, URL } from 'url';

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import createExternal from '../../packages/vite-plugin-external';

// https://vitejs.dev/config/
export default () => {
  return defineConfig({
    plugins: [
      react(),
      createExternal({
        externals: {
          '@linkdesign/components': 'LinkDesignComponents',
          '@alicloud/console-components': 'AlicloudConsoleComponents',
          react: '$linkdesign.React',
          'react-dom': '$linkdesign.ReactDOM',
          'prop-types': '$linkdesign.PropTypes'
        }
      })
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    },
    server: {
      open: true
    }
  });
};
