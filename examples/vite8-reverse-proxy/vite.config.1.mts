import { defineConfig } from 'vite';
import pluginReverseProxy from 'vite-plugin-reverse-proxy';

/**
 * @example vite-plugin-reverse-proxy
 *
 * 将线上 CDN 的脚本请求反向代理到本地 dev server，
 * 使本地开发代码能以 text/javascript MIME 类型被线上页面加载，
 * 用于线上问题本地复现调试。
 *
 * 配合浏览器代理插件（如 XSwitch）使用：
 *   https://cdn.example.com/app.js → http://localhost:3000/app.js
 */
export default defineConfig({
  plugins: [
    pluginReverseProxy({
      targets: {
        '/app.js': 'src/main.ts'
      }
    })
  ],
  server: {
    port: 3000
  },
  build: {
    outDir: 'dist/1',
    rollupOptions: {
      output: {
        entryFileNames: '[name].js',
        format: 'iife'
      }
    }
  }
});
