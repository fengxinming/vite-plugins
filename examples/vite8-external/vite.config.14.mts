import { defineConfig } from 'vite';
import pluginExternal from 'vite-plugin-external';
import { view } from 'vite-plugin-view';

/**
 * @example vite-plugin-external
 *
 * 示例 14：纯 external（externals 函数返回 true）—— 覆盖 dev 预打包的转换路径
 *
 * externals 函数返回 true 表示"纯 external"：没有全局名、也不生成 stash shim，
 * 产物里保留裸 import，由宿主环境在运行时提供该依赖。
 *
 * 覆盖的是 dev 的**运行时缺依赖登记**链：浏览器请求 src/lib.ts 时，vite 发现裸说明符
 * 'lodash' 不在已优化列表里，走 registerMissingImport 再预构建一轮，此时才经过本插件
 * 说明符维度的判定，命中「纯 external → 转换 shim → 标 external」这条与命名 external
 * 不同的分支。
 *
 * 不要在这里配 optimizeDeps 来"制造"这条链，两种写法都实测排不上用场：
 *   - entries: ['src/lib.ts'] —— 产物与不配时逐字相同，但扫描器会在扫描阶段撞上
 *     转换协议 id 'vite-dep-pre-bundle-external:lodash' 且无人能 load 它，整轮扫描
 *     报废并打印 "Failed to run dependency scan. Skipping dependency pre-bundling."。
 *   - include: ['lodash'] —— include 的依赖由 vite 自己的 resolver 拍成绝对路径当
 *     预打包**入口**，而入口必须产出 chunk，纯 external 在入口维度无法生效
 *     （见 handleOptimizeDeps 的 entryPluginForExternals），实测 vite 把 1.4MB 真实
 *     lodash 源码写进了 deps/lodash.js。include 维度要用命名 external 才看得到效果
 *     （示例 1 的 react 正是被 @vitejs/plugin-react 注入 include 的）。
 *
 * src/lib.ts 真实引用了 lodash，externalizeDeps 不是空配置。
 *
 * 页面入口指向 src/lib.ts，cdnScripts 留空：纯 external 的依赖由宿主提供，
 * 浏览器侧没有对应的 CDN，页面只用于观察 dev 的模块改写。
 *
 * view() 只在 serve 下挂：ES lib 构建和 html 入口不能共存，build 下配页面会把
 * lib 的 export 全 tree-shake 掉（示例 3 同因，实测产物只剩 side-effect import）。
 */
export default defineConfig(({ command }) => ({
  plugins: [
    ...(command === 'serve'
      ? [view({
        engine: 'pug',
        engineOptions: {
          title: 'vite-plugin-external example 14',
          description: 'Powered by vite-plugin-external',
          // 纯 external 的依赖由宿主提供，浏览器侧没有对应的 CDN，
          // 页面只用于观察 dev 的模块改写。
          cdnScripts: [],
          entry: '/src/lib.ts'
        }
      })]
      : []),
    pluginExternal({
      // 每个 config 用各自的 stash 目录，测试串行复用缓存时互不覆盖。
      cacheDir: './node_modules/.vite_external/14',
      externals(source) {
        if (source === 'lodash') {
          // true → 纯 external：不提供全局名，不生成 shim。
          return true;
        }
        return false;
      }
    })
  ],
  build: {
    outDir: 'dist/14',
    minify: false,
    lib: {
      entry: 'src/lib.ts',
      formats: ['es'],
      fileName: 'my-lib'
    }
  }
}));
