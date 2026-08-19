import { defineConfig } from 'vite';
import { view } from 'vite-plugin-view';

/**
 * 示例 7：多页面应用 MPA（index + home）
 *
 * 这是验证 indexHtml.ts 中 "middleware prepend 先于 spaFallbackMiddleware 执行"
 * 这一核心设计的配套配置——当 `entry` 传对象 { index, home } 时，插件会把两个模板都
 * 注册到 build.rolldownOptions.input，Vite 的 build-html 流水线会分别输出：
 *   - dist/7/index.html（渲染 index.ejs）
 *   - dist/7/home.html  （渲染 home.ejs）
 *
 * Dev server 下，访问 /home 或 /home.html 如果中间件被插在 spaFallback 之后，
 * Vite 会把不存在的 .html 路径 rewrite 成 /index.html，直接造成多页面 404。
 * Prepend 保证我们先看到原始 URL，根据 home.ejs 存在就渲染，不存在才 fallback。
 */
export default defineConfig({
  plugins: [
    view({
      engine: 'ejs',
      extension: '.ejs',
      // Multi-page: keys become the output HTML names, values are the source
      // template paths relative to project root (same shape as rollup's
      // `input` option for MPA builds).
      // 多页：key 是输出 HTML 名字，value 是源模板相对项目根的路径（与
      // rollup `input` 选项的 MPA 写法形状一致）。
      entry: {
        index: 'index.ejs',
        home:  'home.ejs',
      },
      // Per-template options: index page keeps the "items" demo, home page has
      // its own title + a marker the build test can assert on.
      // 按模板分开的 engineOptions 由 `entry` 对象的每个模板自行提供是不
      // 现实的（Engine.render 读的是同一个 engineOptions），所以这里传一个
      // 合并的对象——index.ejs / home.ejs 里用到的变量都放进同一个 pool。
      engineOptions: {
        title: 'EJS Example',
        items: ['Apple', 'Banana', 'Cherry'],
        pageTitle: 'Home',
      },
    }),
  ],
  server: {
    host: '127.0.0.1',
  },
  build: {
    outDir: 'dist/7',
    rollupOptions: {
      output: {
        format: 'iife',
      },
    },
    // Vite 8 / Rolldown defaults codeSplitting to false for IIFE output, but
    // Rolldown's multi-entry MPA mode requires codeSplitting=true (otherwise
    // it emits INVALID_OPTION: multiple inputs are not supported when
    // output.codeSplitting is false). Force the flag back to true here.
    //
    // Vite 8 / Rolldown 在 IIFE output 下默认 codeSplitting=false，但
    // Rolldown 多入口 MPA 模式必须 codeSplitting=true，否则会抛
    // INVALID_OPTION。这里显式补回来。
    rolldownOptions: {
      output: {
        codeSplitting: true,
      },
    },
  },
});
