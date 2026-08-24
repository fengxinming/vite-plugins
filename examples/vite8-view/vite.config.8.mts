import { defineConfig } from 'vite';
import { view } from 'vite-plugin-view';

/**
 * Example 8: Multi-page MPA with `strategy: { dev: 'delegate', build: 'template' }`
 *
 * Same multi-page entry shape as config 7 (index + home EJS templates).
 * Uses the `delegate` dev strategy AND the `template` build strategy:
 *
 * Dev (strategy.dev: 'delegate'):
 *   - On dev-server request `/` or `/home` the middleware RENDERS the
 *     template to a SIBLING `.html` file on disk
 *       (index.ejs → index.html, home.ejs → home.html)
 *   - A pre-existing user-owned index.html is backed up to
 *     `index.html.bak_<timestamp>` first
 *   - Then middleware calls next() so Vite's NATIVE htmlFallbackMiddleware
 *     → indexHtmlMiddleware pipeline takes over (full 1:1 parity with
 *     plain Vite 8).
 *   - On process termination generated .html files are cleaned up and
 *     .bak_* backups restored to their original names.
 *
 * Build (strategy.build: 'template'):
 *   - The build does NOT compile templates to `.html`. Instead, the original
 *     template source (with `<%= title %>` etc. preserved) is output to dist
 *     with generated `<script>` / `<link>` asset tags injected before
 *     `</head>`. This lets a Node backend render the template at runtime with
 *     dynamic data.
 *
 * 示例 8：MPA 多页面 + `strategy: { dev: 'delegate', build: 'template' }`
 *
 * 入口形态与示例 7 相同（index + home 两个 EJS 模板 MPA）。
 * 使用 `delegate` dev 策略和 `template` build 策略：
 *
 * Dev（strategy.dev: 'delegate'）：
 *   - 开发态访问 `/` 或 `/home` 时，中间件把模板渲染为同目录下的
 *     兄弟 `.html` 文件
 *       （index.ejs → index.html，home.ejs → home.html）
 *   - 用户原有的 index.html 会先备份成 `index.html.bak_<时间戳>`
 *   - 随后中间件调用 next()，交由 Vite 原生 htmlFallbackMiddleware →
 *     indexHtmlMiddleware 流水线端到端处理（与原生 Vite 8 1:1 对齐）。
 *   - 进程退出时清理生成的 .html，`.bak_*` 备份恢复原名。
 *
 * Build（strategy.build: 'template'）：
 *   - 构建时不把模板编译为 `.html`。而是输出原始模板源码
 *     （保留 `<%= title %>` 等语法）到 dist，并在 `</head>` 前注入
 *     生成的 `<script>` / `<link>` 资源标签。这样 Node 后端可以在
 *     运行时用动态数据渲染模板。
 */
export default defineConfig({
  plugins: [
    view({
      engine: 'ejs',
      extension: '.ejs',
      strategy: {
        dev: 'delegate',
        build: 'template'
      },
      entry: {
        index: 'index.ejs',
        home: 'home.ejs'
      },
      engineOptions: {
        title: 'EJS Delegate Example',
        items: ['Alpha', 'Beta', 'Gamma'],
        pageTitle: 'Home (delegate)'
      }
    })
  ],
  server: {
    host: '127.0.0.1'
  },
  build: {
    outDir: 'dist/8',
    rollupOptions: {
      output: {
        format: 'iife'
      }
    },
    rolldownOptions: {
      output: {
        codeSplitting: true
      }
    }
  }
});
