import { defineConfig } from 'vite';
import vitePluginCombine from 'vite-plugin-combine';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vitePluginCombine({
      src: 'src/utils/*.js',
      target: 'src/index.js'
    })
  ],
  build: {
    outDir: 'dist/combine',
    minify: false,
    lib: {
      entry: 'src/index.js',
      formats: ['es'],
      fileName: '[name]'
    }
  }
});
