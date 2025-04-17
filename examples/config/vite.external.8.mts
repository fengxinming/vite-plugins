import externalGlobals from 'rollup-plugin-external-globals';
import { defineConfig } from 'vite';
import vitePluginExternal from 'vite-plugin-external';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vitePluginExternal({
      externalGlobals,
      logLevel: 'TRACE',
      externals: {
        react: 'React',
        'react-dom/client': 'ReactDOM'
      }
    })
  ],
  build: {
    minify: false,
    outDir: 'dist/external/8',
    rollupOptions: {
      input: 'index2.html',
      output: {
        format: 'iife'
      }
    }
  }
});
