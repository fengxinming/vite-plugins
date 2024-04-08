import { defineConfig } from 'vite';
import ts from '@rollup/plugin-typescript';
import vitePluginCombine from 'vite-plugin-combine';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    ts(),
    vitePluginCombine({
      src: ['src/*.ts', '!src/noop.ts'],
      target: 'src/index.ts',
      exports: 'default',
      dts: true
    })
  ],
  build: {
    minify: false,
    lib: {
      entry: [
        'src/index.ts',
        'src/noop.ts'
      ],
      formats: ['es'],
      fileName: '[name]'
    }
  }
});
