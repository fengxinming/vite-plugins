import { builtinModules } from 'node:module';

import dts from 'vite-plugin-dts';
import { defineConfig } from 'vite';

import { dependencies } from './package.json' with { type: 'json' };

const externals = Object.keys(dependencies)
  .concat(builtinModules, 'vite')
  .map((n) => new RegExp(`^${n}/?`))
  .concat(/^node:/);

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    dts({
      entryRoot: 'src',
      include: 'src/**/*.ts'
    })
  ],
  build: {
    lib: {
      entry: 'src/index.ts',
      formats: ['es', 'cjs'],
      fileName: '[name]'
    },
    minify: false,
    rolldownOptions: {
      external: externals
    }
  }
});
