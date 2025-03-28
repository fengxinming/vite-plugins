import ts from '@rollup/plugin-typescript';
import { defineConfig } from 'vite';
import vitePluginCombine from 'vite-plugin-combine';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vitePluginCombine({
      logLevel: 'TRACE',
      src: ['src/*.ts', '!src/noop.ts', '!src/entry.ts'],
      target: 'src/combine.ts',
      exports: 'auto'
    }),
    ts({
      compilerOptions: {
        declarationDir: 'dist/combine',
        emitDeclarationOnly: true
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
