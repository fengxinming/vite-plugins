import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import pluginExternal from 'vite-plugin-external';

import pkg from './package.json' with { type: 'json' };

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    pluginExternal({
      nodeBuiltins: true,
      // 'vite' is a dev-only peer that must stay external when building the
      // dist, but resolvable at runtime during tests. 'externalizeDeps' is
      // wired only for the 'build' command, so listing 'vite' here keeps it
      // out of the bundle WITHOUT externalising it in vitest's dev server
      // (which would break `import { build } from 'vite'` in src/index.ts).
      // vite 是 dev 依赖，构建 dist 时必须外部化，但测试时需要可解析。
      // externalizeDeps 仅在 build 命令生效，把 vite 放这里既能避免打包进
      // 产物，又不会在 vitest 的 dev server 阶段把它标成 external
      // （否则 src/index.ts 里的 import { build } from 'vite' 会挂）。
      externalizeDeps: [...Object.keys(pkg.dependencies), 'vite']
    }),
    dts({
      entryRoot: 'src',
      include: 'src/**/*.ts'
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
