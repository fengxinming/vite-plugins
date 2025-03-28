import externalGlobals from 'rollup-plugin-external-globals';
import { defineConfig } from 'vite';
import pluginExternal from 'vite-plugin-external';

export default defineConfig({
  plugins: [
    pluginExternal({
      externalGlobals,
      externals: {
        react: 'React',
        'react-dom/client': 'ReactDOM'
      }
    })
  ],
  build: {
    outDir: 'dist/external/3',
    minify: false,
    rollupOptions: {
      output: {
        format: 'iife'
      }
    }
  }
});
