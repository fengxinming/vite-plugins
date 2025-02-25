import ts from '@rollup/plugin-typescript';
import { defineConfig } from 'vite';
import vitePluginCombine from 'vite-plugin-combine';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vitePluginCombine({
      src: ['src/*.ts', '!src/noop.ts', '!src/entry.ts'],
      target: 'src/combine.ts',
      exports: 'default'
    }),
    ts({
      compilerOptions: {
        declarationDir: 'dist/combine'
      }
    })
  ],
  build: {
    outDir: 'dist/combine',
    minify: false,
    lib: {
      entry: [
        'src/noop.ts'
      ],
      formats: ['es'],
      fileName: '[name]'
    }
  }
});
