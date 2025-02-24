import { defineConfig } from 'vite';
import vitePluginCp from 'vite-plugin-cp';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vitePluginCp({
      targets: [
        { src: './node_modules/vite/dist', dest: 'dist/cp/test' },
        { src: './node_modules/vite/dist', dest: 'dist/cp/test2', flatten: false },
        { src: './node_modules/vite/README.md', dest: 'dist/cp' },
        { src: './node_modules/vite/**/*.ts', dest: 'dist/cp/types' }
      ]
    })
  ],
  build: {
    outDir: 'dist/cp',
    lib: {
      entry: 'src/isAsyncFunction.ts',
      formats: ['es'],
      fileName: 'cp'
    }
  }
});
