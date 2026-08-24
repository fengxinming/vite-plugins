import { defineConfig } from 'vite';
import { view } from 'vite-plugin-view';

/**
 * Example 9: Multi-page MPA with `strategy: { build: 'both' }`
 *
 * Same multi-page entry shape as config 7 (index + home EJS templates).
 * Uses the default `'intercept'` dev strategy combined with
 * `strategy.build: 'both'` so the build emits BOTH compiled `.html` files
 * AND the original template files (.ejs) with injected asset tags.
 *
 * Build output:
 *   - dist/9/index.html   — compiled HTML (template rendered, variables
 *     substituted as usual)
 *   - dist/9/home.html    — compiled HTML for the home page
 *   - dist/9/index.ejs    — ORIGINAL template source (EJS syntax preserved)
 *     with <script>/<link> asset tags injected before </head>
 *   - dist/9/home.ejs     — original home.ejs template with asset tags
 *
 * 示例 9：MPA 多页面 + `strategy: { build: 'both' }`
 *
 * 入口形态与示例 7 相同（index + home 两个 EJS 模板 MPA）。
 * dev 用默认 `'intercept'` 策略，build 用 `'both'`，因此构建同时产出：
 * 编译后的 `.html` 文件和注入了资源标签的原始 `.ejs` 模板文件。
 *
 * 构建产物：
 *   - dist/9/index.html   — 编译后的 HTML（模板被渲染、变量照常被替换）
 *   - dist/9/home.html    — home 页面的编译后 HTML
 *   - dist/9/index.ejs    — 原始模板源码（保留 EJS 语法），
 *     在 </head> 前注入 <script>/<link> 资源标签
 *   - dist/9/home.ejs     — home.ejs 原始模板，也注入了资源标签
 */
export default defineConfig({
  plugins: [
    view({
      engine: 'ejs',
      extension: '.ejs',
      strategy: {
        // dev defaults to 'intercept' (in-memory render, no disk writes)
        // build emits compiled .html AND original .ejs with asset tags
        // dev 默认为 'intercept'（内存渲染，不写磁盘）
        // build 同时输出编译后的 .html 和注入资源标签的原始 .ejs
        build: 'both'
      },
      entry: {
        index: 'index.ejs',
        home: 'home.ejs'
      },
      engineOptions: {
        title: 'EJS Build Both Example',
        items: ['One', 'Two', 'Three'],
        pageTitle: 'Home (both mode)'
      }
    })
  ],
  server: {
    host: '127.0.0.1'
  },
  build: {
    outDir: 'dist/9',
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
