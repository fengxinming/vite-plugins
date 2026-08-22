import { defineConfig } from 'vite';
import { view } from 'vite-plugin-view';

/**
 * Example 8: Multi-page MPA with `strategy: 'delegate'`
 *
 * Same multi-page entry shape as config 7 (index + home EJS templates),
 * but uses the `delegate` request-handling strategy instead of the default
 * `intercept`:
 *
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
 * Use this strategy when you want absolute behavioural parity with Vite 8's
 * native request pipeline — for example, to debug a difference in HMR
 * behaviour between `intercept` in-memory rendering and Vite's native
 * pipeline reading static .html files from disk.
 *
 * Build output is identical to config 7 because `strategy` only affects the
 * dev-server middleware path.
 *
 * 示例 8：MPA 多页面 + `strategy: 'delegate'`
 *
 * 入口形态与示例 7 相同（index + home 两个 EJS 模板 MPA），但请求处理策略
 * 从默认的 `intercept` 切换为 `delegate`：
 *
 *   - 开发态访问 `/` 或 `/home` 时，中间件把模板渲染为同目录下的
 *     兄弟 `.html` 文件
 *       （index.ejs → index.html，home.ejs → home.html）
 *   - 用户原有的 index.html 会先备份成 `index.html.bak_<时间戳>`
 *   - 随后中间件调用 next()，交由 Vite 原生 htmlFallbackMiddleware →
 *     indexHtmlMiddleware 流水线端到端处理（与原生 Vite 8 1:1 对齐）。
 *   - 进程退出时清理生成的 .html，`.bak_*` 备份恢复原名。
 *
 * 当你要求与 Vite 8 原生请求流水线**行为完全一致**时（例如需要排查
 * `intercept` 内存渲染与 Vite 原生读磁盘静态 .html 在 HMR 行为上的差异）
 * 使用本策略。
 *
 * 构建产物与示例 7 完全相同，因为 `strategy` 只影响开发态中间件路径。
 */
export default defineConfig({
  plugins: [
    view({
      engine: 'ejs',
      extension: '.ejs',
      strategy: 'delegate',
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
