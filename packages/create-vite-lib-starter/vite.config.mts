import ts from '@rollup/plugin-typescript';
import { globSync } from 'tinyglobby';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    ts({
      tsconfig: './tsconfig.build.json'
    })
  ],
  build: {
    lib: {
      entry: globSync(['./src/*.ts', '!./src/types.ts']),
      formats: ['es', 'cjs'],
      fileName: '[name]'
    },
    minify: false
  }
});
