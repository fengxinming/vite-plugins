import ts from '@rollup/plugin-typescript';
import { defineConfig } from 'vite';
import pluginExternal from 'vite-plugin-external';

import pkg from './package.json';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    ts({
      tsconfig: './tsconfig.build.json'
    }),
    pluginExternal({
      nodeBuiltins: true,
      externalizeDeps: Object.keys(pkg.dependencies)
    })
  ],
  build: {
    rollupOptions: {
      external: ['vite']
    },
    lib: {
      entry: 'src/index.ts',
      formats: ['es', 'cjs'],
      fileName: 'index'
    },
    minify: false
  }
});
