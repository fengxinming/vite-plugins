import { defineConfig } from 'vite';
import pluginExternal from 'vite-plugin-external';
import { view } from 'vite-plugin-view';

/**
 * 示例 16：importmap 开关 — CDN 形态 externals 改由 import map 提供地址
 *
 * 与示例 7（同为 CDN URL 形态）的差别只在这个开关：
 *   · 关掉：build 把 stash shim 当普通模块打包，产物里的 import 直接指向 CDN 绝对地址。
 *   · 打开：build 的 resolveId 返回 { id: '<说明符>', external: 'absolute' }，
 *     产物里留的是裸说明符；地址由插件拼进 HTML 的
 *     <script type="importmap">{"imports":{…}}</script> 交给浏览器解析，
 *     每个 CDN 地址另附一条 <link rel="modulepreload" crossorigin>。
 *     stash 文件仍然照写（dev 预打包与标签名单都依赖它），只是 build 不再以它为解析目标。
 *
 * 开关只作用于 build：
 *   · dev：DepsOptimizer 照旧把依赖预打包成本地 deps 模块，页面不会得到 import map；
 *   · build：产物里是裸说明符，表键也是裸名。
 *
 * 只用 lodash / dayjs：react 系列会被 @vitejs/plugin-react 塞进 optimizeDeps.include，
 * 而 include 维度是预打包的**入口**，入口必须产出 chunk，纯 external 在这条维度上
 * 拦不住（示例 14 的头注释有实测记录），到时候看到的就是真 react 被打进 deps，
 * 而不是这张表在起作用。
 */
export default defineConfig({
  plugins: [
    view({
      engine: 'pug',
      pretty: true,
      engineOptions: {
        title: 'vite-plugin-external example 16',
        description: 'Powered by vite-plugin-external',
        // 脚本一个都不挂：地址全在插件注入的 import map 里，
        // 页面再手写 CDN script 就是同一份依赖取两次。
        cdnScripts: [],
        entry: '/src/importmap-app.ts'
      }
    }),
    pluginExternal({
      // 每个 config 用各自的 stash 目录，测试串行复用缓存时互不覆盖。
      cacheDir: './node_modules/.vite_external/16',
      externals: {
        lodash: 'https://esm.sh/lodash@4.18.1',
        dayjs: 'https://esm.sh/dayjs@1.11.23'
      },
      importmap: true
    })
  ],
  build: {
    outDir: 'dist/16',
    minify: false
  }
});
