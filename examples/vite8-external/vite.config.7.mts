import { defineConfig } from 'vite';
import pluginExternal from 'vite-plugin-external';

/**
 * 示例 7：CDN URL 形态 externals — ESM 模块预取
 *
 * externals 的值可以是 CDN URL 而非全局变量名。
 * 构建产物中 import 指向 CDN 地址，
 * 同时自动注入 <link rel="modulepreload"> 实现首屏预取。
 */
export default defineConfig({
  plugins: [
    pluginExternal({
      externals: {
        react: 'https://esm.sh/react@18.3.1',
        'react-dom/client': 'https://esm.sh/react-dom@18.3.1'
      }
    })
  ],
  build: {
    outDir: 'dist/7',
    minify: false
  }
});
