import { defineConfig } from 'vite';
import pluginExternal from 'vite-plugin-external';

/**
 * 示例 2：使用函数形态的 externals
 *
 * externals 除了 Record 还支持函数签名：
 *   (source, importer, isResolved) => string | boolean | null
 * 返回 string → 作为全局变量名/CDN URL；返回 true → 纯 external。
 * 适合需要动态判断的场景（如按前缀批量外置）。
 */
export default defineConfig({
  plugins: [
    pluginExternal({
      externals(source) {
        // 所有 @scope/ 开头的包都外置，映射为 ScopeFoo 等驼峰全局名。
        // 触发函数 externals 的动态判断分支（按前缀匹配）。
        if (source.startsWith('@scope/')) {
          const name = source.split('/').pop() ?? 'scope';
          return `Scope${name.charAt(0).toUpperCase()}${name.slice(1)}`;
        }
        // react 系列映射到全局变量（与 Record 形态效果一致）
        if (source === 'react') {
          return 'React';
        }
        if (source === 'react-dom/client') {
          return 'ReactDOM';
        }
        return null;
      }
    })
  ],
  build: {
    outDir: 'dist/2',
    minify: false,
    // lib 模式直接指向独立入口，同时触发 react 分支和 @scope/* 分支
    lib: {
      entry: 'src/index-scoped.tsx',
      formats: ['iife'],
      name: 'ScopedApp'
    }
  }
});
