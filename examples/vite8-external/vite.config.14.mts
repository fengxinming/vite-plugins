import { defineConfig } from 'vite';
import pluginExternal from 'vite-plugin-external';

/**
 * @example vite-plugin-external
 *
 * 示例 14：纯 external（externals 函数返回 true）—— 覆盖 dev 预打包的转换路径
 *
 * externals 函数返回 true 表示"纯 external"：没有全局名、也不生成 stash shim，
 * 产物里保留裸 import，由宿主环境在运行时提供该依赖。
 *
 * 配 optimizeDeps.include 让 vite 主动去预构建 lodash，于是预打包阶段会走到
 * 「纯 external → 生成转换 shim → 标记 external」这条链路（纯 external 走的是
 * 与命名 external 不同的分支，必须单独覆盖）。
 *
 * src/lib.ts 真实引用了 lodash，externalizeDeps 不是空配置。
 */
export default defineConfig({
  plugins: [
    pluginExternal({
      externals(source) {
        if (source === 'lodash') {
          // true → 纯 external：不提供全局名，不生成 shim。
          return true;
        }
        return false;
      }
    })
  ],
  optimizeDeps: {
    // 用 entries 而不是 include：include 的依赖会直接成为预构建入口，
    // 入口解析不走 plugin resolveId，就绕开了「纯 external → 转换 shim」那条分支。
    // entries 让 scanner 从业务入口出发，把 lodash 作为"被依赖的模块"纳入预构建，
    // 预构建解析它时才会经过我们的 resolveId。
    entries: ['src/lib.ts']
  },
  build: {
    outDir: 'dist/14',
    minify: false,
    lib: {
      entry: 'src/lib.ts',
      formats: ['es'],
      fileName: 'my-lib'
    }
  }
});
