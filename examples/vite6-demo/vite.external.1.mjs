import { defineConfig } from 'vite';
import pluginExternal from 'vite-plugin-external';

export default defineConfig({
  plugins: [
    pluginExternal({
      interop: 'auto',
      externals: {
        react: 'React',
        'react-dom/client': 'ReactDOM'
      }
    })
  ],
  build: {
    outDir: 'dist/external',
    minify: false,
    rollupOptions: {
      output: {
        format: 'iife'
      }
    }
  }
});
