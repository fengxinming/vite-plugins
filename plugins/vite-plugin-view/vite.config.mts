import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import pluginExternal from 'vite-plugin-external';

import pkg from './package.json' with { type: 'json' };

// vitest sets VITEST=true when running tests. The build-only plugins below
// (pluginExternal + @rollup/plugin-typescript) are designed for `vite build`:
// they externalise deps and emit .d.ts files. Running them under vitest breaks
// module resolution (vp-runtime-helper → vite gets externalised to /@id/vite)
// and produces spurious TS diagnostics on test files, so we skip them in test
// mode and let vitest's own esbuild transform handle .ts.
//
// vitest 运行时会把 VITEST 设为 true。下面的构建期插件（pluginExternal +
// @rollup/plugin-typescript）是给 `vite build` 用的：外化依赖、生成 .d.ts。
// 在 vitest 下跑会破坏模块解析（vp-runtime-helper → vite 被外化成 /@id/vite）
// 还会对测试文件产生多余 TS 诊断，所以测试模式下跳过，让 vitest 自己的
// esbuild 处理 .ts 转换。
const isTest = !!process.env.VITEST;

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    !isTest
      ? [
        pluginExternal({
          nodeBuiltins: true,
          externalizeDeps: Object.keys(pkg.dependencies)
        }),
        dts({
          entryRoot: 'src',
          include: 'src/**/*.ts'
        })
      ]
      : []
  ],
  build: {
    rolldownOptions: {
      external: Object.keys(pkg.devDependencies)
    },
    lib: {
      entry: 'src/index.ts',
      formats: ['es'],
      fileName: '[name]'
    },
    minify: false
  }
});
