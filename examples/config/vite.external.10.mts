import react from '@vitejs/plugin-react';
import type { Plugin } from 'vite';
import { defineConfig } from 'vite';
import vitePluginExternal from 'vite-plugin-external';
import { view } from 'vite-plugin-view';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      jsxRuntime: 'classic'
    }) as unknown as Plugin,
    vitePluginExternal({
      logLevel: 'TRACE',
      externals: {
        react: 'https://esm.sh/react@18.3.1',
        'react-dom/client': 'https://esm.sh/react-dom@18.3.1'
      }
      // externals(libName) {
      //   if (libName === 'react') {
      //     return 'https://esm.sh/react@18.3.1';
      //   }
      //   if (libName === 'react-dom/client') {
      //     return 'https://esm.sh/react-dom@18.3.1';
      //   }
      // }
    }) as unknown as Plugin,
    view({
      engine: 'pug',
      engineOptions: {
        title: 'Vite + React + Pug',
        reactFormat: 'esm'
      }
    }) as unknown as Plugin
  ],
  // resolve: {
  //   alias: {
  //     react: 'https://esm.sh/react@18.3.1',
  //     'react-dom/client': 'https://esm.sh/react-dom@18.3.1'
  //   }
  // },
  server: {
    open: true
  },
  build: {
    minify: false,
    outDir: 'dist/external/10'
  }
});
