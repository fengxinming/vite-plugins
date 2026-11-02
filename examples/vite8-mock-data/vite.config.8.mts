import { defineConfig } from 'vite';
import pluginMockData from 'vite-plugin-mock-data';

/**
 * @example vite-plugin-mock-data
 *
 * `buildMock: true` —— 构建期通过虚拟模块 `virtual:mock-routes` 把文件型 mock
 * 路由（`./mock` 下的文件）连同 fastify 路由语义选项注入浏览器端运行时：
 *   应用入口静态引用 `vite-plugin-mock-data/axios-adapter`（内部再引用
 *   `vite-plugin-mock-data/mock-client`），路由表随 app 一起被打进产物。
 *
 * 使得打包后的静态页面（双击打开 / 静态托管）依然能拿到 mock 数据。
 * 浏览器端由 `createMockAdapter`（vite-plugin-mock-data/axios-adapter）拦截
 * axios 请求：命中返回 mock 数据，未命中按 404 拒绝（不回退真实网络）。
 *
 * 对应集成测试：test/adapter.test.ts（vitest.config.mts 注册同一插件，
 * 让 virtual:mock-routes 在 vite-node 里解析，测的就是这条静态导入链）
 */
export default defineConfig({
  plugins: [
    pluginMockData({
      routes: './mock',
      buildMock: true
    })
  ],
  build: {
    outDir: 'dist/8'
  }
});
