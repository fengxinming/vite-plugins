import type { Plugin } from 'vite';
import { defineConfig } from 'vite';
import pluginExternal from 'vite-plugin-external';
import { view } from 'vite-plugin-view';

/**
 * @example vite-plugin-external
 *
 * 示例 15：别的插件注入 optimizeDeps.include —— externals 仍然优先
 *
 * `@vitejs/plugin-react` 的 `vite:react-refresh` 子插件会在 config 钩子里返回
 * `optimizeDeps.include: ['react', 'react-dom', ...]`（见其 dist/index.js 的
 * dependencies 数组）。include 的依赖由 vite 用自己的内部 resolver 拍成
 * node_modules 绝对路径，再作为 rolldown 预打包的 **input**，也就是入口模块：
 * 说明符维度的判定看不到 'react' 这个字符串。若入口维度不做拦截，
 * deps/react.js 里装的就是真实 react 源码，用户声明的 externals 形同废纸。
 *
 * 本示例用下面的内联插件复刻第三方插件的行为，不要求用户自己维护 include。
 * 同时刻意让本示例**没有任何源码 import react**：这样 deps/react.js 只可能来自
 * include 那条入口链，断言它等于验证入口维度拦截，而不是被说明符维度顺带跑过。
 *
 * 命名 external（react → React）才能在入口维度生效：入口必须产出 chunk，
 * 纯 external 不生成 stash，vite 只能原样打包（那条链的实测结论见示例 14 文档）。
 *
 * 页面入口指向 src/lib2.ts（不引用 react），cdnScripts 留空：
 * 一旦页面挂上 src/index.tsx，react 就从源码进了模块图，
 * deps/react.js 就不再只可能来自 include 那条入口链，本示例的判定前提会失效。
 */
const injectOptimizeDepsInclude = (): Plugin => ({
  name: 'example-inject-optimize-deps-include',
  config(config) {
    config.optimizeDeps ??= {};
    config.optimizeDeps.include ??= [];
    config.optimizeDeps.include.push('react', 'react-dom');
  }
});

export default defineConfig({
  plugins: [
    view({
      engine: 'pug',
      engineOptions: {
        title: 'vite-plugin-external example 15',
        description: 'Powered by vite-plugin-external',
        // 本示例没有任何源码 import react，页面也就没有需要它提供的全局变量。
        cdnScripts: [],
        entry: '/src/lib2.ts'
      }
    }),
    injectOptimizeDepsInclude(),
    pluginExternal({
      // 每个 config 用各自的 stash 目录，测试串行复用缓存时互不覆盖。
      cacheDir: './node_modules/.vite_external/15',
      externals: {
        react: 'React',
        'react-dom': 'ReactDOM'
      }
    })
  ]
});
