import externalGlobalsLib from 'rollup-plugin-external-globals';
import { defineConfig } from 'vite';
import pluginExternal from 'vite-plugin-external';

/**
 * 示例 6：externalGlobals — 修复 Rolldown/Rollup #3188
 *
 * 当 IIFE 构建时 top-level require 未被正确改写为全局变量引用，
 * 传入 rollup-plugin-external-globals 作为 escape-hatch 插件修复。
 *
 * `options.externalGlobals` 在当前 vite-plugin-external 里是一个回调函数：
 *   externalGlobals(globals) => Rolldown.Plugin
 * `globals(id)` 会返回 externals 里声明的全局名字（如 'react' → 'React'），
 * 回调里调用 rollup-plugin-external-globals 生成插件实例并返回。
 * 插件会在 transform 阶段把顶层 import/require 改写为 window.X 的访问形式，
 * 不走 Rolldown 原生 output.globals，用于解决 Issue #3188 边界场景。
 */
export default defineConfig({
  plugins: [
    pluginExternal({
      externalGlobals: externalGlobalsLib as any,
      externals: {
        react: 'React',
        'react-dom': 'ReactDOM',
        'react-dom/client': 'ReactDOM'
      }
    })
  ],
  build: {
    outDir: 'dist/6',
    minify: false,
    rolldownOptions: {
      output: {
        format: 'iife'
      }
    }
  }
});
