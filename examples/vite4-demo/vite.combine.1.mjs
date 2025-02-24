import { defineConfig } from 'vite';
import ts from '@rollup/plugin-typescript';
import vitePluginCombine from 'vite-plugin-combine';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vitePluginCombine({
      src: 'src/*.ts',
      target: 'src/index.ts'
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
      formats: ['es'],
      fileName: '[name]'
    }
  }
});
