import { defineConfig } from 'rollup';
import typescript from '@rollup/plugin-typescript';
import empty from 'rollup-plugin-empty';
import filesize from 'rollup-plugin-filesize';

export default [
  defineConfig({
    input: 'src/index.ts',
    plugins: [
      empty({
        dir: 'dist'
      }),
      typescript({
        tsconfig: './tsconfig.build.json'
      }),
      filesize()
    ],
    output: [{
      file: 'dist/index.mjs',
      format: 'esm',
      exports: 'auto'
    }, {
      file: 'dist/index.js',
      format: 'cjs',
      exports: 'auto',
      externalLiveBindings: false
    }]
  })
];
