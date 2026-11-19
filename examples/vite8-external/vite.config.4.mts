import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import pluginExternal from 'vite-plugin-external';
import { view } from 'vite-plugin-view';

/**
 * 示例 4：React 16.12 — dev / prod 两套 CDN，按 command 分支。
 *
 * 用配置函数拿到 env.command：
 *   - dev（serve）：unpkg 上钉住 16.12.0 的 UMD development 构建，挂
 *     window.React / window.ReactDOM，externals 映射到 React / ReactDOM；
 *   - build：阿里 linkdesign CDN（同为 React 16.12），一个 UMD 同时挂
 *     $linkdesign.React / $linkdesign.ReactDOM，externals 映射到 $linkdesign.*。
 * 两端版本一致（16.12），只是全局名与 host 不同——这正是"开发用公共 CDN、生产用
 * 自有 CDN"的典型场景。全局名必须跟着 CDN 一起分支，而插件的 development/production
 * 块覆盖不到 view 的 cdnScripts，所以整体放在配置函数里按 command 判定。
 *
 * 16.12 没有 react-dom/client（createRoot 是 18+ 的 API），
 * 因此入口用 src/index-legacy.tsx（ReactDOM.render），键写 'react-dom'。
 */
export default defineConfig(({ command }) => {
  const isServe = command === 'serve';

  return {
    plugins: [
      react({
        jsxRuntime: 'classic'
      }),
      pluginExternal({
        // 每个 config 用各自的 stash 目录，测试串行复用缓存时互不覆盖。
        cacheDir: './node_modules/.vite_external/4',
        // logLevel: 'TRACE',
        externals: {
          react: '$linkdesign.React',
          'react-dom': '$linkdesign.ReactDOM'
        },
        development: {
          externals: {
            react: 'React',
            'react-dom': 'ReactDOM'
          }
        }
      }),
      view({
        engine: 'pug',
        engineOptions: {
          title: 'vite-plugin-external example 4',
          description: 'Powered by vite-plugin-external',
          // CDN 必须与 externals 的全局名同源：dev 的 unpkg UMD 挂 React/ReactDOM，
          // build 的 linkdesign UMD 挂 $linkdesign.React/$linkdesign.ReactDOM。
          cdnScripts: isServe
            ? [
              'https://unpkg.com/react@16.12.0/umd/react.development.js',
              'https://unpkg.com/react-dom@16.12.0/umd/react-dom.development.js'
            ]
            : ['//g.alicdn.com/linkdesign/lib/1.0.1/~react.js'],
          entry: '/src/index-legacy.tsx'
        }
      })
    ],
    build: {
      outDir: 'dist/4',
      minify: false,
      rolldownOptions: {
        output: {
          format: 'iife'
        }
      }
    }
  };
});
