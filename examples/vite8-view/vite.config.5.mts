import { defineConfig } from 'vite';
import { view } from 'vite-plugin-view';

/**
 * 示例 5：pretty: false — 关闭 HTML 美化
 *
 * 默认情况下 pug 渲染的 HTML 不做额外格式化（pretty 默认 false）。
 * 显式设置 pretty: false 确保输出紧凑，适合生产构建。
 * 设置 pretty: true 则通过 pretty 包美化输出（加换行 + 缩进）。
 */
export default defineConfig({
  plugins: [
    view({
      engine: 'pug',
      pretty: false,
      engineOptions: {
        title: 'Compact Build',
        description: 'No HTML beautification'
      }
    })
  ],
  build: {
    outDir: 'dist/5'
  }
});
