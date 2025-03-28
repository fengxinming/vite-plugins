import { defineConfig } from 'vite';
import pluginExternal from 'vite-plugin-external';

export default defineConfig({
  plugins: [
    pluginExternal({
      logLevel: 'TRACE',
      interop: 'auto',
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
    outDir: 'dist/external/1',
    minify: false,
    rollupOptions: {
      output: {
        format: 'iife'
      }
    }
  }
});
