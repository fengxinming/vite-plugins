import { builtinModules } from 'node:module';

import ts from '@rollup/plugin-typescript';
import { defineConfig } from 'vite';

import { dependencies } from './package.json';

const externals = Object.keys(dependencies)
  .concat(builtinModules, 'vite')
  .map((n) => new RegExp(`^${n}/?`))
  .concat(/^node:/);

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    ts({
      tsconfig: './tsconfig.build.json'
    })
  ],
  build: {
    lib: {
      entry: 'src/index.ts',
      formats: ['es', 'cjs'],
      fileName: '[name]'
    },
    minify: false,
    rollupOptions: {
      external: externals
    }
  }
});
