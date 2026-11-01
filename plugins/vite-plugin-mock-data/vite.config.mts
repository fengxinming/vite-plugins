import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import pluginExternal from 'vite-plugin-external';

import pkg from './package.json' with { type: 'json' };
import { VIRTUAL_MOCK_ROUTES } from './src/lib/constants.ts';

export default defineConfig({
  plugins: [
    dts({
      entryRoot: 'src',
      include: 'src/**/*.ts'
    }),
    pluginExternal({
      apply: 'build',
      nodeBuiltins: true,
      externalizeDeps: Object.keys(pkg.dependencies).concat('vite', 'axios', pkg.name, VIRTUAL_MOCK_ROUTES)
    })
  ],
  build: {
    lib: {
      entry: {
        index: 'src/index.ts',
        'axios-adapter': 'src/axios-adapter.ts',
        'mock-client': 'src/mock-client.ts'
      },
      formats: ['es'],
      fileName: '[name]'
    },
    minify: false
  }
});
