import { defineConfig } from 'vite';
import pluginExternal from 'vite-plugin-external';

/**
 * 示例 5：interop: 'auto' — 修复 IIFE 构建中 require 包装问题
 *
 * 某些库被 output.globals 处理后仍生成错误的 require 包装。
 * interop: 'auto' 让构建阶段通过 stash 文件路径走 resolveId 解析，
 * 而非 Rolldown 原生 external 机制，从而避免 IIFE 包装异常。
 */
export default defineConfig({
  plugins: [
    pluginExternal({
      interop: 'auto',
      externals: {
        react: 'React',
        'react-dom': 'ReactDOM',
        'react-dom/client': 'ReactDOM'
      }
    })
  ],
  build: {
    outDir: 'dist/5',
    minify: false,
    rollupOptions: {
      output: {
        format: 'iife'
      }
    }
  }
});
