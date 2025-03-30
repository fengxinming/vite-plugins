import { EOL } from 'node:os';

import ts from '@rollup/plugin-typescript';
import { defineConfig } from 'vite';
import vitePluginCombine from 'vite-plugin-combine';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vitePluginCombine({
      logLevel: 'TRACE',
      src: ['src/*.ts', '!src/index.ts', '!src/typings.ts'],
      target: 'src/combine.ts',
      exports: 'default',
      beforeWrite(code) {
        return `${code + EOL}export * from './typings';`;
      }
    }),
    ts({
      compilerOptions: {
        declarationDir: 'dist/combine/2'
      }
    })
  ],
  resolve: {
    preserveSymlinks: true
  },
  build: {
    outDir: 'dist/combine/2',
    minify: false,
    lib: {
      formats: ['es'],
      fileName: '[name]'
    }
  }
});
