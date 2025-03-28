import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import pluginExternal from 'vite-plugin-external';

export default defineConfig({
  plugins: [
    react({
      jsxRuntime: 'classic'
    }),
    pluginExternal({
      interop: 'auto',
      logLevel: 'TRACE',
      externals(libName) {
        if (libName === 'react') {
          return 'React';
        }
        if (libName === 'react-dom/client') {
          return 'ReactDOM';
        }
      }
    })
  ],
  server: {
    open: true
  },
  build: {
    outDir: 'dist/external/5',
    minify: false,
    rollupOptions: {
      output: {
        format: 'iife'
      }
    }
  }
});
