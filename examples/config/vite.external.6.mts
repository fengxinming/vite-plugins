import { defineConfig, Plugin } from 'vite';
import vitePluginExternal from 'vite-plugin-external';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vitePluginExternal({
      interop: 'auto',
      logLevel: 'TRACE',
      externals: {
        react: 'React',
        'react-dom/client': 'ReactDOM'
      }
    }) as Plugin
  ],
  build: {
    minify: false,
    outDir: 'dist/external/6',
    rollupOptions: {
      input: 'index2.html',
      output: {
        format: 'iife'
      }
    }
  }
});
