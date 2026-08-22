import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import pluginExternal from 'vite-plugin-external';

import pkg from './package.json' with { type: 'json' };

export default defineConfig({
  plugins: [
    dts({
      entryRoot: 'src',
      include: 'src/**/*.ts'
    }),
    // pluginExternal is only needed for `vite build` (to keep runtime deps
    // out of the published bundle). Restricting it to apply:'build' keeps
    // it from hijacking module resolution under vitest (which runs in
    // 'serve' mode) — otherwise it rewrites the bare `vite` import to the
    // dev-server virtual id /@id/vite and breaks test loading.
    // pluginExternal 只在 `vite build` 时需要（把运行时依赖排除出发布产物）。
    // 限制为 apply:'build' 避免它在 vitest（serve 模式）下劫持模块解析——
    // 否则会把裸 `vite` import 改写成 dev server 虚拟 id /@id/vite，导致
    // 测试加载失败。
    pluginExternal({
      apply: 'build',
      nodeBuiltins: true,
      externalizeDeps: Object.keys(pkg.dependencies)
    })
  ],
  build: {
    rolldownOptions: {
      external: ['vite']
    },
    lib: {
      entry: 'src/index.ts',
      formats: ['es'],
      fileName: '[name]'
    },
    minify: false
  }
});
