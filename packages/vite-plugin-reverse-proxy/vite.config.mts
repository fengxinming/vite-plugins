import ts from '@rollup/plugin-typescript';
import { defineConfig } from 'vite';
import pluginExternal from 'vite-plugin-external';

const externalizeDeps = ['vite'];

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    pluginExternal({
      nodeBuiltins: true,
      externalizeDeps
    }),
    ts({
      tsconfig: './tsconfig.build.json'
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
