import { defineConfig } from 'vite';
import ts from '@rollup/plugin-typescript';
import vitePluginCombine from 'vite-plugin-combine';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    ts(),
    vitePluginCombine({
      src: 'src/*.ts',
      target: 'src/index.ts',
      dts: true
    })
  ],
  build: {
    minify: false,
    lib: {
      formats: ['es'],
      fileName: '[name]'
    }
  }
});
