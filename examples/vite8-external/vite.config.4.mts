import { defineConfig } from 'vite';
import pluginExternal from 'vite-plugin-external';

/**
 * 示例 4：多环境覆盖 — development / production 不同 externals
 *
 * 开发环境用 React 全局变量（unpkg CDN），
 * 生产环境切换到自有 CDN 的 $linkdesign.React。
 * 只需覆盖 externals 字段，其他插件配置保持不变。
 */
export default defineConfig({
  plugins: [
    pluginExternal({
      externals: {
        react: 'React',
        'react-dom': 'ReactDOM'
      },
      development: {
        externals: {
          react: 'React',
          'react-dom': 'ReactDOM'
        }
      },
      production: {
        externals: {
          react: '$linkdesign.React',
          'react-dom': '$linkdesign.ReactDOM'
        }
      }
    })
  ],
  build: {
    outDir: 'dist/4',
    minify: false,
    rollupOptions: {
      output: {
        format: 'iife'
      }
    }
  }
});
