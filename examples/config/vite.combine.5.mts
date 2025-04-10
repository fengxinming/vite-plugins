
import ts from '@rollup/plugin-typescript';
import { defineConfig, Plugin } from 'vite';
import vitePluginCombine from 'vite-plugin-combine';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vitePluginCombine({
      logLevel: 'TRACE',
      src: ['src/util/*.ts', '!src/util/typings.ts'],
      target: 'src/combine.ts',
      beforeWrite(code) {
        return `${code}export * from './util/typings';`;
      }
    }),
    ts({
      tsconfig: './tsconfig.build.json',
      compilerOptions: {
        declarationDir: 'dist/combine/5'
      }
    }) as Plugin
  ],
  build: {
    outDir: 'dist/combine/5',
    minify: false,
    lib: {
      entry: [],
      formats: ['es', 'cjs'],
      fileName(format, entryName) {
        return entryName + (format === 'es' ? '.mjs' : '.js');
      }
    }
  }
});
