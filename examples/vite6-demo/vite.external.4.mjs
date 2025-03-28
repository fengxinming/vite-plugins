import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import pluginExternal from 'vite-plugin-external';

export default defineConfig({
  plugins: [
    react(),
    pluginExternal({
      logLevel: 'TRACE',
      externals: {
        react: 'React',
        'react-dom/client': 'ReactDOM'
      }
    })
  ],
  server: {
    open: true
  },
  build: {
    outDir: 'dist/external/4',
    minify: false,
    rollupOptions: {
      output: {
        format: 'iife'
      }
    }
  }
});
