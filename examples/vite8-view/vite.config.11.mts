import { defineConfig } from 'vite';
import { view } from 'vite-plugin-view';

/**
 * Example 11: Pug + `strategy.build: 'template'` + `injectPlaceholder`
 *
 * Validates the indent-based-template injection logic for Pug. Uses a pair
 * of dedicated `index-pl.pug` / `home-pl.pug` templates that contain the
 * placeholder `//- VITE_ASSETS` (Pug's JS-style comment is invisible in the
 * rendered output, making it the natural placeholder shape). Immediately
 * after the placeholder we place a marker `<meta name="placeholder-marker" …>`
 * so the build test can assert tags were injected at the placeholder (not
 * appended, not injected somewhere else).
 *
 * The `injectPlaceholder` string MUST match EXACTLY what's in the template
 * source (including whitespace). When matched the plugin converts the
 * Vite-generated HTML `<script>` and `<link>` tags to Pug-native syntax:
 *   script(type="module", crossorigin, src="/assets/xxx.js")
 *   link(rel="stylesheet", crossorigin, href="/assets/xxx.css")
 * and inserts them into the same indentation level as the placeholder line's
 * siblings, keeping the Pug syntax valid for backend re-renders.
 *
 * Build output:
 *   - dist/11/index-pl.pug  — Pug syntax preserved. The `//- VITE_ASSETS`
 *     placeholder is replaced with the Pug-native tags. Marker meta remains
 *     AFTER them (proves insertion position). No `.html` produced.
 *   - dist/11/home-pl.pug   — same shape, for the multi-page entry.
 *
 * 示例 11：Pug + `strategy.build: 'template'` + `injectPlaceholder`
 *
 * 验证 Pug 这种缩进式模板的注入逻辑。使用一对专用模板
 * `index-pl.pug` / `home-pl.pug`，里面包含占位符 `//- VITE_ASSETS`
 * （Pug 的 JS 风格注释不会渲染到 HTML，是天然的占位符写法）。
 * 占位符后面紧跟一个标记 `<meta name="placeholder-marker" …>`，
 * 这样构建测试能断言标签确实注入在占位符处（不是追加、也不是注入到
 * 别的位置）。
 *
 * `injectPlaceholder` 字符串必须与模板源码里的文本**完全一致**
 * （包括空白）。匹配成功后，插件把 Vite 生成的 HTML `<script>` 和
 * `<link>` 标签转成 Pug 原生语法：
 *   script(type="module", crossorigin, src="/assets/xxx.js")
 *   link(rel="stylesheet", crossorigin, href="/assets/xxx.css")
 * 并把它们插入到与占位符那一行的兄弟节点相同的缩进层级，
 * 保证 Pug 语法对后端二次渲染是合法的。
 *
 * 构建产物：
 *   - dist/11/index-pl.pug — 保留 Pug 语法。`//- VITE_ASSETS` 占位符被
 *     Pug 原生标签替换，marker meta 位于标签之后（证明插入位置）。
 *     不产出 .html。
 *   - dist/11/home-pl.pug — 多页面入口，同样的结构。
 */
export default defineConfig({
  plugins: [
    view({
      engine: 'pug',
      strategy: {
        build: 'template'
      },
      injectPlaceholder: '//- VITE_ASSETS',
      entry: {
        index: 'index-pl.pug',
        home: 'home-pl.pug'
      },
      engineOptions: {
        title: 'Pug Placeholder Build Example',
        description: 'Pug template build via vite-plugin-view with injectPlaceholder',
        pageTitle: 'Home (pug placeholder)'
      }
    })
  ],
  server: {
    host: '127.0.0.1'
  },
  build: {
    outDir: 'dist/11',
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
