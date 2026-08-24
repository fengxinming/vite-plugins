import { defineConfig } from 'vite';
import { view } from 'vite-plugin-view';

/**
 * Example 10: `strategy.build: 'template'` + `injectPlaceholder`
 *
 * Uses the `'template'` build strategy AND provides a custom
 * `injectPlaceholder: '<!-- VITE_ASSETS -->'` so that generated asset
 * tags are NOT injected before `</head>` but instead replace that exact
 * placeholder string inside the source template.
 *
 * This is important when the consuming back-end wants a strict tag order
 * inside <head> — e.g. the Vite-generated JS/CSS must come BEFORE certain
 * server-injected analytics tags — and `</head>`-before injection would
 * place them in the wrong position.
 *
 * Uses a pair of dedicated `index-pl.ejs` / `home-pl.ejs` templates that
 * contain the `<!-- VITE_ASSETS -->` placeholder followed by a marker
 * `<meta name="placeholder-marker" ...>` so the build integration test
 * can assert the tags were injected AT the placeholder position, not
 * before `</head>`.
 *
 * Build output:
 *   - dist/10/index-pl.ejs  — template syntax preserved, asset tags
 *     inserted between the <title> and <meta name="placeholder-marker">
 *     elements, i.e. where the placeholder used to be.
 *   - dist/10/home-pl.ejs   — same injection semantics for the home page.
 *   - dist/10/index.html    — NOT emitted (strategy.build is 'template').
 *
 * 示例 10：`strategy.build: 'template'` + `injectPlaceholder`
 *
 * 使用 `'template'` 构建策略并传入自定义
 * `injectPlaceholder: '<!-- VITE_ASSETS -->'`，生成的资源标签不会注入到
 * `</head>` 前，而是替换源模板中的这个精确占位符字符串。
 *
 * 当使用方后端对 <head> 里标签顺序有严格要求时（例如 Vite 产出的 JS/CSS
 * 必须位于服务端注入的统计分析标签之前），这个功能至关重要——默认的
 * </head> 前注入会把资源标签放错位置。
 *
 * 使用一对专用模板 `index-pl.ejs` / `home-pl.ejs`，它们在占位符之后
 * 跟随一个 `<meta name="placeholder-marker" ...>` 标记，这样构建集成
 * 测试就能断言资源标签确实注入在占位符位置，而非 </head> 前。
 *
 * 构建产物：
 *   - dist/10/index-pl.ejs — 保留模板语法，资源标签插入在 <title> 和
 *     <meta name="placeholder-marker"> 之间（即原占位符所在位置）。
 *   - dist/10/home-pl.ejs  — home 页面同样的注入语义。
 *   - dist/10/index.html   — 不产出（strategy.build 是 'template'）。
 */
export default defineConfig({
  plugins: [
    view({
      engine: 'ejs',
      extension: '.ejs',
      strategy: {
        // dev defaults to 'intercept'; build emits raw templates, no .html
        // dev 默认为 'intercept'；build 输出原始模板，不生成 .html
        build: 'template'
      },
      // The exact string that will be replaced with <script>/<link> tags.
      // When the placeholder is present in the source template, tags land
      // on that exact position instead of the default </head>-before spot.
      //
      // 被替换为 <script>/<link> 标签的精确字符串。
      // 源模板中存在该占位符时，标签会落在占位符位置，而不是默认的
      // </head> 前位置。
      injectPlaceholder: '<!-- VITE_ASSETS -->',
      entry: {
        index: 'index-pl.ejs',
        home: 'home-pl.ejs'
      },
      engineOptions: {
        title: 'EJS Inject Placeholder Example',
        items: ['Plum', 'Mango', 'Peach'],
        pageTitle: 'Home (placeholder mode)'
      }
    })
  ],
  server: {
    host: '127.0.0.1'
  },
  build: {
    outDir: 'dist/10',
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
