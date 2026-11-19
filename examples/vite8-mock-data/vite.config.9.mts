import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vite';
import pluginMockData from 'vite-plugin-mock-data';

const root = dirname(fileURLToPath(import.meta.url));

/**
 * @example vite-plugin-mock-data
 *
 * `base` 双端对齐（**显式** base）：Vite 顶层 `base` 与插件 `base` 都取 '/app'。
 * `./mock` 里注册的路由 key 保持 'GET /api/users' 不变，前缀由两端各自加上：
 *   - dev 端（服务端）：configureServer 用 fastify `register(..., { prefix })` 注册，
 *     实际访问路径为 /app/api/users；
 *   - 客户端（浏览器端）：虚拟模块把 base 下发给客户端，normalizeRoutes 把前缀编进
 *     路径正则，axios adapter 只命中 /app/api/users（未带前缀的 /api/users 按 404 拒绝）。
 *
 * 客户端要用带前缀的路径有两种写法，都得命中：配 axios baseURL='/app' 再请求
 * '/api/users'，或直接写全 '/app/api/users'。
 *
 * `mockIn: 'client'` 让浏览器端这条链在 dev/serve 与产物端都生效。
 *
 * `mock-client.html` 是产物端的真实使用场景：静态页面自己引用 axios adapter，
 * 打包后打开该页面即可拿到 mock 数据。产物断言也依赖这个页面真正引用的 chunk，
 * 而不是塞一个没人加载的孤立入口。
 *
 * 对应集成测试：
 *   - dev 前缀：test/build.test.ts 的 base 分组（真实 vite CLI）；
 *   - 客户端前缀：test/adapter-base.test.ts（`pnpm test:base`，vitest 以本配置解析
 *     virtual:mock-routes，走与产物一致的静态导入链）；
 *   - 产物含 mock：test/build.test.ts 的 build:9 用例。
 */
export default defineConfig({
  base: '/app',
  plugins: [
    pluginMockData({
      routes: './mock',
      base: '/app',
      mockIn: 'client'
    })
  ],
  build: {
    outDir: 'dist/9',
    minify: false,
    rolldownOptions: {
      input: {
        main: resolve(root, 'index.html'),
        mockClient: resolve(root, 'mock-client.html')
      }
    }
  },
  test: {
    dir: './test/',
    include: [
      'adapter-base.test.ts'
    ]
  }
});
