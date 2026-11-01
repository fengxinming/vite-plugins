import { defineConfig } from 'vitest/config';

import pluginMockData from 'vite-plugin-mock-data';

/**
 * vitest 配置：注册 pluginMockData（buildMock: true）让
 * `virtual:mock-routes` 在 vite-node 环境里可解析——
 * 测试即可直接 import `vite-plugin-mock-data/axios-adapter`，
 * 走与浏览器产物完全相同的静态导入链（adapter → client → 虚拟模块 → ./mock 文件）。
 *
 * `inline` 必须显式声明：workspace 链接包的 dist/client.js 静态导入
 * `virtual:mock-routes`，Node 原生 ESM 无法解析该 id，必须交给 vite-node 转换。
 */
export default defineConfig({
  plugins: [
    pluginMockData({
      routes: './mock',
      buildMock: true
    })
  ],
  test: {
    server: {
      deps: {
        inline: ['vite-plugin-mock-data']
      }
    }
  }
});
