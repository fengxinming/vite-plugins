import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import pluginExternal from 'vite-plugin-external';

import pkg from './package.json' with { type: 'json' };

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    pluginExternal({
      apply: 'build',
      nodeBuiltins: true,
      externalizeDeps: Object.keys(pkg.dependencies).concat('vite')
    }),
    dts({
      entryRoot: 'src',
      include: 'src/**/*.ts'
    })
  ],
  build: {
    lib: {
      entry: 'src/index.ts',
      formats: ['es'],
      fileName: '[name]'
    },
    minify: false
  }
});
