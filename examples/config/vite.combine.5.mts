
import { defineConfig, Plugin } from 'vite';
import vitePluginCombine from 'vite-plugin-combine';
import ts from 'vite-plugin-dts';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vitePluginCombine({
      logLevel: 'TRACE',
      src: ['src/util/*.ts', '!src/util/typings.ts'],
      target: 'src/combine.5.ts',
      beforeWrite(code) {
        return `${code}export * from './util/typings';`;
      }
    }),
    ts({
      tsconfigPath: './tsconfig.build.json',
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
