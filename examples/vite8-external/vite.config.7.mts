import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import pluginExternal from 'vite-plugin-external';
import { view } from 'vite-plugin-view';

/**
 * 示例 7：CDN URL 形态 externals — ESM 模块预取
 *
 * externals 的值可以是 CDN URL 而非全局变量名。
 * 构建产物中 import 指向 CDN 地址，
 * 同时自动注入 <link rel="modulepreload"> 实现首屏预取。
 */
export default defineConfig({
  plugins: [
    view({
      engine: 'pug',
      pretty: true,
      engineOptions: {
        title: 'vite-plugin-external example 7',
        description: 'Powered by vite-plugin-external',
        // 页面不手写 CDN：react 系列被 external 成 esm.sh 的 ESM 地址后，
        // 插件会往 HTML 注入 <link rel="modulepreload">，这里再挂脚本就是重复加载。
        cdnScripts: []
      }
    }),
    react(),
    pluginExternal({
      // 每个 config 用各自的 stash 目录，测试串行复用缓存时互不覆盖。
      cacheDir: './node_modules/.vite_external/7',
      // logLevel: 'TRACE',
      externals: {
        react: 'https://esm.sh/react@19.3.1',
        'react-dom': 'https://esm.sh/react-dom@19.3.1',
        'react-dom/client': 'https://esm.sh/react-dom@19.3.1/client',
        // react() 默认 automatic runtime，jsx 运行时也必须外置，
        // 否则 dev 的 jsx-dev-runtime 会拖着 react 主包一起进包
        'react/jsx-runtime': 'https://esm.sh/react@19.3.1/jsx-runtime',
        'react/jsx-dev-runtime': 'https://esm.sh/react@19.3.1/jsx-dev-runtime'
      }
    })
  ],
  build: {
    outDir: 'dist/7',
    minify: false
  }
});
