import { defineConfig } from 'vite';
import pluginExternal from 'vite-plugin-external';

/**
 * 示例 11：自定义 cacheDir — 指定 stash 文件存放目录
 *
 * 每个命名 external 都会在 cacheDir 下生成 JS shim 文件。
 * 默认存放于 ${cwd}/node_modules/.vite_external。
 * 通过 cacheDir 可自定义位置，便于统一清理或调试。
 */
export default defineConfig({
  plugins: [
    pluginExternal({
      cacheDir: '.external-cache',
      externals: {
        react: 'React',
        'react-dom': 'ReactDOM',
        'react-dom/client': 'ReactDOM'
      }
    })
  ],
  build: {
    outDir: 'dist/11',
    minify: false,
    rollupOptions: {
      output: {
        format: 'iife'
      }
    }
  }
});
