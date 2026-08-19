import ts from '@rollup/plugin-typescript';
import { defineConfig } from 'vite';
import pluginExternal from 'vite-plugin-external';

import pkg from './package.json' with { type: 'json' };

// Under vitest, skip pluginExternal: it installs a resolveId hook in
// optimizeDeps that externalises vp-runtime-helper (listed in
// `dependencies`), which prevents vitest from processing the file and
// breaks its runtime `import 'vite'` (rewritten to the virtual `/@id/vite`).
// The build still uses pluginExternal to keep deps out of the published
// bundle.
//
// vitest 下跳过 pluginExternal：它会在 optimizeDeps 里装一个 resolveId
// 钩子，把 `dependencies` 里的 vp-runtime-helper 标记成 external，导致
// vitest 不处理该文件，其内部 `import 'vite'` 被改写成虚拟 `/@id/vite`
// 后运行时报错。build 仍然使用 pluginExternal 把依赖排除出发布产物。
const isTest = !!process.env.VITEST;

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    ...(isTest
      ? []
      : [
        pluginExternal({
          nodeBuiltins: true,
          externalizeDeps: Object.keys(pkg.dependencies)
        })
      ]),
    ts({
      tsconfig: './tsconfig.build.json'
    })
  ],
  build: {
    rolldownOptions: {
      external: ['vite']
    },
    lib: {
      entry: 'src/index.ts',
      formats: ['es', 'cjs'],
      fileName: '[name]'
    },
    minify: false
  }
});
