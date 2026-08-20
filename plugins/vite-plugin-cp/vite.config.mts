import dts from 'vite-plugin-dts';
import pluginExternal from 'vite-plugin-external';
import { defineConfig } from 'vitest/config';

import pkg from './package.json' with { type: 'json' };

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    dts({
      entryRoot: 'src',
      include: 'src/**/*.ts'
    }),
    pluginExternal({
      nodeBuiltins: true,
      // 'vite' is a dev-only peer that must stay external when building the
      // dist, but resolvable at runtime during tests. 'externalizeDeps' is
      // wired only for the 'build' command, so listing 'vite' here keeps it
      // out of the bundle WITHOUT externalising it in vitest's dev server
      // (vp-runtime-helper imports `vite` at runtime, so externalising it
      // would break loading src/ under tests).
      // vite 是 dev 依赖，构建 dist 时必须外部化，但测试时需要可解析。
      // externalizeDeps 仅在 build 命令生效，把 vite 放这里既能避免打包进
      // 产物，又不会在 vitest 的 dev server 阶段把它标成 external
      // （vp-runtime-helper 运行时 import vite，external 化会导致 src 无法加载）。
      externalizeDeps: [...Object.keys(pkg.dependencies), 'vite']
    })
  ],
  build: {
    lib: {
      entry: 'src/index.ts',
      formats: ['es', 'cjs'],
      fileName: 'index'
    },
    minify: false
  },
  test: {
    // Tests live OUTSIDE src/ to keep production code clean.
    // 测试文件独立放在 test/ 下，和生产代码分离。
    include: ['test/**/*.test.ts'],
    environment: 'node',
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.d.ts']
    }
  }
});
