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
      exports: 'default',
      dts: true
    })
  ],
  build: {
    minify: false,
    lib: {
      entry: [
        'src/index.ts',
        'src/isAsyncFunction.ts',
        'src/isDate.ts',
        'src/isError.ts',
        'src/isNil.ts',
        'src/isNumber.ts'
      ],
      formats: ['es'],
      fileName: '[name]'
    }
  }
});
