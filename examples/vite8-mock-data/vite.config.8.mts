import { defineConfig } from 'vite';
import pluginMockData from 'vite-plugin-mock-data';

/**
 * @example vite-plugin-mock-data
 *
 * `mockIn: 'client'` —— 把 mock 路由表注入**浏览器端运行时**，dev/serve 与产物端都生效。
 *
 * 装载链路（与浏览器产物完全一致）：
 *   `vite-plugin-mock-data/axios-adapter`
 *     → 静态 import `vite-plugin-mock-data/mock-client`
 *     → `virtual:mock-routes`（本配置注册的 pluginMockData { mockIn: 'client' }
 *        在 configResolved 阶段注入 ./mock 文件清单 + routeOptions + base）
 *
 * 对应集成测试：test/adapter.test.ts（本配置以 `vitest --config vite.config.8.mts` 运行，
 * virtual:mock-routes 在 vite-node 里解析，走的就是这条静态导入链）。
 *
 * `mockIn` 的三种取值：
 *   - `false`（默认）：不注入；
 *   - `'build'`：只在 `vite build` 时把 mock 目录编进产物，供产物端（静态页面）使用；
 *   - `'client'`：dev/serve 与产物端都注入（本配置）。
 * 只影响浏览器端这条链；dev 端的服务端 mock 由 fastify 中间件提供，不受影响。
 */
export default defineConfig({
  plugins: [
    pluginMockData({
      routes: './mock',
      mockIn: 'client'
    })
  ],
  build: {
    outDir: 'dist/8',
    minify: false
  },
  test: {
    dir: './test/',
    include: [
      'adapter.test.ts',
      'build.test.ts'
    ]
  }
});
