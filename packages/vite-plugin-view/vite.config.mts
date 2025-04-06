import ts from '@rollup/plugin-typescript';
import { defineConfig, Plugin } from 'vite';
import pluginExternal from 'vite-plugin-external';

import pkg from './package.json';


// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    pluginExternal({
      nodeBuiltins: true,
      externalizeDeps: Object.keys(pkg.dependencies)
    }) as Plugin,
    ts({
      tsconfig: './tsconfig.build.json'
    }) as Plugin
  ],
  build: {
    rollupOptions: {
      external: Object.keys(pkg.devDependencies)
    },
    lib: {
      entry: 'src/index.ts',
      formats: ['es', 'cjs'],
      fileName: 'index'
    },
    minify: false
  }
});
