import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vite';
import pluginMockData from 'vite-plugin-mock-data';

const root = dirname(fileURLToPath(import.meta.url));

/**
 * @example vite-plugin-mock-data
 *
 * `base` 的**兜底**：不配插件 `base`，只配 Vite 顶层 `base: '/app'`。
 * 插件在 configResolved 阶段用 resolvedConfig.base 作为前缀来源，归一化后是 '/app'，
 * dev 端 fastify 注册的路由因此带 /app 前缀，与 config 9 显式写 base 的结果一致。
 *
 * 客户端侧不在这里验证：vitest 的 server base 固定在根路径，插件兜底拿到的
 * resolvedConfig.base 与真实 dev/build 环境（Vite base='/app'）不同。兜底的服务端
 * 表现由 test/build.test.ts 的 dev:10 用例覆盖（真实 vite CLI）。
 *
 * `mock-client.html` 与 config 9 相同：产物端有真实页面引用 axios adapter，
 * 打包后打开该页面即可拿到 mock 数据；产物断言依赖页面真正引用的 chunk。
 *
 * 对应集成测试：
 *   - dev 端兜底前缀：test/build.test.ts 的 base 分组（真实 vite CLI）；
 *   - 构建 + 产物含 mock：test/build.test.ts 的 build:9 / build:10 用例。
 */
export default defineConfig({
  base: '/app',
  plugins: [
    pluginMockData({
      routes: './mock',
      mockIn: 'client'
    })
  ],
  build: {
    outDir: 'dist/10',
    minify: false,
    rolldownOptions: {
      input: {
        main: resolve(root, 'index.html'),
        mockClient: resolve(root, 'mock-client.html')
      }
    }
  }
});
