import ts from '@rollup/plugin-typescript';
import { defineConfig } from 'vite';
import pluginExternal from 'vite-plugin-external';

import pkg from './package.json';

const externalizeDeps = Object.keys(pkg.dependencies)
  .concat('vite');

export default defineConfig({
  plugins: [
    ts({
      tsconfig: './tsconfig.build.json'
    }),
    pluginExternal({
      nodeBuiltins: true,
      externalizeDeps
    })
  ],
  build: {
    lib: {
      entry: 'src/index.ts',
      formats: ['es', 'cjs'],
      fileName: 'index'
    },
    minify: false
  }
});
