import { defineConfig } from 'vite';
import ts from '@rollup/plugin-typescript';
import pkg from './package.json';

const externals = Object.keys(pkg.dependencies)
  .concat('vite')
  .map((n) => new RegExp(`^${n}/?`))
  .concat(/^node:/);

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    ts()
  ],
  build: {
    lib: {
      entry: 'src/index.ts',
      formats: ['es', 'cjs'],
      fileName: 'index'
    },
    minify: false,
    rollupOptions: {
      external: externals
    }
  }
});
