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
      logLevel: 'TRACE',
      // interop: 'auto',
      externals(libName) {
        if (libName === 'react') {
          return 'https://esm.sh/react@18.3.1';
        }
        if (libName === 'react-dom/client') {
          return 'https://esm.sh/react-dom@18.3.1';
        }
      }
    })
  ],
  // resolve: {
  //   alias: {
  //     react: 'https://esm.sh/react@18.3.1',
  //     'react-dom/client': 'https://esm.sh/react-dom@18.3.1'
  //   }
  // },
  build: {
    minify: false,
    outDir: 'dist/external/10',
    rollupOptions: {
      input: 'index5.html'
    }
  }
});
