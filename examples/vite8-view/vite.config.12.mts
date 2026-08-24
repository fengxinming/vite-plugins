import { defineConfig } from 'vite';
import { view } from 'vite-plugin-view';

/**
 * Example 12: Pug + `strategy.build: 'template'` WITHOUT `injectPlaceholder`
 *
 * Tests the **indent-based fallback** injection path (Priority 3 of
 * `injectAssetTagsIntoTemplate`): when no placeholder is set AND the template
 * has no literal `</head>` (true for every Pug/Jade/Haml/Slim template on
 * Earth), the plugin must scan for the `head` declaration line, detect the
 * child indent used by its first real child (`meta` / `title` in a normal
 * layout), convert the Vite-generated tags to Pug-native syntax, and insert
 * them at the correct indentation BETWEEN the `head` line and the first
 * existing child.
 *
 * Uses the default `index.pug` (shared with config 1) plus `home.pug` as an
 * MPA pair so the fallback logic is exercised on two independent templates.
 *
 * Build output:
 *   - dist/12/index.pug — Pug syntax preserved. Under the `head` declaration
 *     the original children (`meta charset`, `title= title`, `meta name=…`)
 *     are now preceded by `script(type="module", crossorigin, src=…)` and
 *     `link(rel="stylesheet", crossorigin, href=…)` lines that were NOT
 *     present in the source. No `.html` produced.
 *   - dist/12/home.pug  — same fallback insertion under its own `head` block.
 *
 * 示例 12：Pug + `strategy.build: 'template'`，**不**设置 injectPlaceholder
 *
 * 测试「缩进式 fallback」注入路径（injectAssetTagsIntoTemplate 的
 * 优先级 3）：没设置占位符并且模板里没有字面量 `</head>`
 * （这对地球上任意 Pug / Jade / Haml / Slim 模板都成立），插件必须
 * 扫描到 `head` 声明行，检测第一个真实子节点（meta / title）使用的
 * 子缩进，把 Vite 生成的标签转成 Pug 原生语法，以正确缩进插入到
 * `head` 行与第一个现有子节点**之间**。
 *
 * 复用 config 1 共享的 `index.pug`，再加上 `home.pug` 组成 MPA，
 * 让 fallback 逻辑在两份独立模板上都被执行到。
 *
 * 构建产物：
 *   - dist/12/index.pug — 保留 Pug 语法。`head` 声明下，原有的子节点
 *     （meta charset、title= title、meta name=…）之前多了
 *     `script(type="module", crossorigin, src=…)` 和
 *     `link(rel="stylesheet", crossorigin, href=…)` 这些源码里没有的行。
 *     不产出 .html。
 *   - dist/12/home.pug — 在它自己的 head 块下执行同样的 fallback 插入。
 */
export default defineConfig({
  plugins: [
    view({
      engine: 'pug',
      strategy: {
        build: 'template'
      },
      entry: {
        index: 'index.pug',
        home: 'home.pug'
      },
      engineOptions: {
        title: 'Pug Fallback Head Example',
        description: 'Pug template build via vite-plugin-view using indent fallback',
        pageTitle: 'Home (pug indent fallback)'
      }
    })
  ],
  server: {
    host: '127.0.0.1'
  },
  build: {
    outDir: 'dist/12',
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
