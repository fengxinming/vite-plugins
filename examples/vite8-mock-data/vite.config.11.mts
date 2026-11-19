import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vite';
import pluginMockData from 'vite-plugin-mock-data';

const root = dirname(fileURLToPath(import.meta.url));

/**
 * @example vite-plugin-mock-data
 *
 * `mockIn: 'build'` **不越界到 serve**：只在 `vite build` 时注入。
 * 插件在 configResolved 阶段判定：
 *   mockIn === 'client' || (mockIn === 'build' && command === 'build')
 * dev/serve 下 command 是 'serve'、mockIn 是 'build' → 虚拟模块不下发路由表，
 * 前端没有 mock；`vite build` 时 command 是 'build' → 产物端照常注入。
 *
 * 对应集成测试：
 *   - serve 不注入：test/no-client-mock.test.ts（`pnpm test:no-client-mock`）；
 *   - build 注入实际配置：test/build.test.ts 的 build:11 用例（产物含 mock 数据）。
 *     默认入口 index.html 用原生 fetch、不 import adapter，故必须把 mock-client.html
 *     加进 input，产物才真正带上路由表，build 侧注入才有可验收的产物。
 * dev 端的服务端 mock（fastify 中间件）不受这两个参数影响，
 * 由 test/build.test.ts 的 dev:11 用例单独覆盖。
 */
export default defineConfig({
  plugins: [
    pluginMockData({
      routes: './mock',
      mockIn: 'build'
    })
  ],
  build: {
    outDir: 'dist/11',
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
      'no-client-mock.test.ts'
    ]
  }
});
