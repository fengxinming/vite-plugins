import { defineConfig } from 'vite';
import vitePluginCp from 'vite-plugin-cp';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vitePluginCp({
      targets: [
        { src: '../../node_modules/vite/dist', dest: 'dist/test' },
        { src: '../../node_modules/vite/dist', dest: 'dist/test2', flatten: false },
        { src: '../../node_modules/vite/README.md', dest: 'dist' },
        { src: '../../node_modules/vite/**/*.ts', dest: 'dist/types' }
      ]
    })
  ],
  build: {
    lib: {
      entry: './src/isAsyncFunction.ts',
      formats: ['es'],
      fileName: 'cp'
    }
  }
});
