import { defineConfig } from 'vite';
import pluginMockData from 'vite-plugin-mock-data';

/**
 * 示例 3：使用 RouteConfig 对象直接声明路由
 *
 * 除了文件路由，routes 也接受 RouteConfig 数组，
 * 适合不想创建 mock 文件目录、只想在 vite.config 里
 * 快速定义几个接口的场景。
 */
export default defineConfig({
  plugins: [
    pluginMockData({
      routes: [
        {
          'GET /api/config': () => ({
            version: '1.0.0',
            features: ['mock', 'proxy']
          }),
          'POST /api/echo': (req: any) => req.body
        }
      ]
    })
  ],
  build: {
    outDir: 'dist/3',
    lib: {
      entry: 'src/index.ts',
      formats: ['es'],
      fileName: 'index'
    }
  }
});
