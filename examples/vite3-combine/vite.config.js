import { defineConfig } from 'vite';
import vitePluginCombine from 'vite-plugin-combine';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vitePluginCombine({
      src: 'src/*.js',
      target: 'src/index.js'
    })
  ],
  build: {
    minify: false,
    lib: {
      entry: 'src/index.js',
      formats: ['es'],
      fileName: '[name]'
    }
  }
});
