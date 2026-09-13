import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vite';
import pluginMockData from 'vite-plugin-mock-data';

const root = dirname(fileURLToPath(import.meta.url));

/**
 * 示例 5：插件 Options 参数覆盖
 *
 * - `fastifyOptions`：透传给 fastify 实例（此处 bodyLimit: 16，
 *   POST body 超限返回 413，验证透传真的生效）
 * - `isAfter: true`：mock 中间件挂载在 Vite 内置中间件之后，
 *   页面/模块请求先走 Vite 管线
 * - `routes` 混合数组：mock 目录（字符串）+ 内联 RouteConfig 对象
 * - `cacheDir`：自定义 TS 编译临时文件目录
 * - `cwd`：显式指定项目根目录（routes 相对路径与 sendFile root 的基准）
 */
export default defineConfig({
  plugins: [
    pluginMockData({
      routes: [
        './mock/api',
        {
          '/api/inline': { via: 'inline-object' },
          'POST /api/echo': async (request) => ({ echo: request.body })
        }
      ],
      fastifyOptions: {
        bodyLimit: 16
      },
      cacheDir: resolve(root, 'node_modules/.vite-plugin-mock-data-test'),
      cwd: root
    })
  ],
  build: {
    outDir: 'dist/5',
    lib: {
      entry: 'src/index.ts',
      formats: ['es'],
      fileName: 'index'
    }
  }
});
