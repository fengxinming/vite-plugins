import ts from '@rollup/plugin-typescript';
import { defineConfig } from 'vite';
import vitePluginCombine from 'vite-plugin-combine';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vitePluginCombine({
      src: ['src/*.ts', '!src/index.ts'],
      target: 'src/combine.ts',
      nameExport: (name) => `my${name}`
    }),
    ts({
      compilerOptions: {
        declarationDir: 'dist/combine/types'
      }
    })
  ],
  resolve: {
    preserveSymlinks: true
  },
  build: {
    outDir: 'dist/combine',
    minify: false,
    lib: {
      formats: ['es'],
      fileName: '[name]'
    }
  }
});
