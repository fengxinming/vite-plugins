import { defineConfig } from 'vite';
import pluginReverseProxy from 'vite-plugin-reverse-proxy';

/**
 * 示例 2：注入 preambleCode
 *
 * preambleCode 会在被代理的脚本开头注入一段代码。
 * 典型场景：@vitejs/plugin-react 需要注入 runtime 自动导入，
 * 反代到线上的脚本也需要这段 preamble 才能正常运行。
 */
export default defineConfig({
  plugins: [
    pluginReverseProxy({
      preambleCode: 'window.__PROXY__ = true;',
      targets: {
        '/app.js': 'src/main.ts',
        '/vendor.js': 'src/vendor.ts'
      }
    })
  ],
  server: {
    port: 3000
  },
  build: {
    outDir: 'dist/2',
    rollupOptions: {
      output: {
        entryFileNames: '[name].js',
        format: 'iife'
      }
    }
  }
});
