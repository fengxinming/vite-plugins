import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import react from '@vitejs/plugin-react';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';
import pluginMockData from 'vite-plugin-mock-data';

const root = dirname(fileURLToPath(import.meta.url));

/**
 * 示例 6：双框架真实应用（React .tsx + Vue .vue 共存）+ mock 接口
 *
 * - react() / vue() 插件同时挂载，dev 时两类页面都由 Vite 转译管线处理
 *   （证明 @fastify/static 的 serve:false 没有劫持 .tsx / .vue 文件）
 * - mock 插件基于文件路由提供 GET /api/users
 * - 多页应用（MPA）：rollupOptions.input 列出 index.html / react.html / vue.html
 *
 * 本配置用于验证：
 *   - React 页面（/react.html → /src/react/main.tsx）经 Vite 转译
 *   - Vue 页面（/vue.html → /src/vue/App.vue）经 Vite 转译
 *   - mock 接口与两类框架页面在同一 dev server 下并存、互不干扰
 */
export default defineConfig({
  plugins: [
    react(),
    vue(),
    pluginMockData({ routes: './mock' })
  ],
  build: {
    outDir: 'dist/6',
    rollupOptions: {
      input: {
        main: resolve(root, 'index.html'),
        react: resolve(root, 'react.html'),
        vue: resolve(root, 'vue.html')
      }
    }
  }
});
