/* eslint-disable max-len */
import { execSync } from 'node:child_process';
import { existsSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

const root = join(__dirname, '..');

function build(n: number) {
  execSync(`pnpm run build:${n}`, { cwd: root, stdio: 'pipe' });
}

function read(...segments: string[]) {
  return readFileSync(join(root, ...segments), 'utf-8');
}

afterEach(() => {
  const p = join(root, 'dist');
  if (existsSync(p)) {
    rmSync(p, { recursive: true, force: true });
  }
});

describe('vite-plugin-view example configs', () => {
  it('config 1: pug template → HTML', () => {
    build(1);
    const html = join(root, 'dist/1/index.html');
    expect(existsSync(html)).toBe(true);
    const code = read('dist/1/index.html');
    expect(code).toContain('My App');
  }, 60000);

  it('config 2: ejs template → HTML', () => {
    build(2);
    const html = join(root, 'dist/2/index.html');
    expect(existsSync(html)).toBe(true);
    const code = read('dist/2/index.html');
    expect(code).toContain('EJS Example');
    expect(code).toContain('Apple');
  }, 60000);

  it('config 3: nunjucks template → HTML', () => {
    build(3);
    const html = join(root, 'dist/3/index.html');
    expect(existsSync(html)).toBe(true);
    const code = read('dist/3/index.html');
    expect(code).toContain('Nunjucks Example');
  }, 60000);

  it('config 4: handlebars with .hbs extension', () => {
    build(4);
    const html = join(root, 'dist/4/index.html');
    expect(existsSync(html)).toBe(true);
    const code = read('dist/4/index.html');
    expect(code).toContain('Handlebars Example');
  }, 60000);

  it('config 5: pretty false — compact HTML output', () => {
    build(5);
    const html = join(root, 'dist/5/index.html');
    expect(existsSync(html)).toBe(true);
    const code = read('dist/5/index.html');
    expect(code).toContain('Compact Build');
  }, 60000);

  it('config 6: custom extension .template with ejs', () => {
    build(6);
    const html = join(root, 'dist/6/index.html');
    expect(existsSync(html)).toBe(true);
    const code = read('dist/6/index.html');
    expect(code).toContain('Custom Extension');
    expect(code).toContain('Alpha');
  }, 60000);

  it('config 7: MPA multi-page — BOTH dist/7/index.html + dist/7/home.html are built independently', () => {
    build(7);
    const indexOut = join(root, 'dist/7/index.html');
    const homeOut  = join(root, 'dist/7/home.html');

    // 1) Both HTML output files exist on disk — proves the `entry: { index, home }`
    //    object got correctly handed off to rolldownOptions.input.
    expect(existsSync(indexOut), 'dist/7/index.html must exist').toBe(true);
    expect(existsSync(homeOut), 'dist/7/home.html must exist').toBe(true);

    const indexHtml = read('dist/7/index.html');
    const homeHtml  = read('dist/7/home.html');

    // 2) Index page renders the items list (engineOptions merged for the MPA).
    expect(indexHtml).toContain('EJS Example');
    expect(indexHtml).toContain('Apple');
    expect(indexHtml).toContain('Banana');
    expect(indexHtml).toContain('Cherry');

    // 3) Home page renders its OWN template content (Multi-Page Example + the
    //    data-page attribute) — proves the two outputs are NOT both just
    //    copies of the same index page.
    expect(homeHtml).toContain('Multi-Page Example');
    expect(homeHtml).toContain('data-page="home"');
    expect(homeHtml).not.toContain('<li>Apple</li>'); // index-only content
  }, 60000);

  it('config 8: strategy.build template — outputs .ejs (NOT .html) with asset tags injected before </head>', () => {
    build(8);

    // Template files are output to dist instead of compiled .html
    // 模板文件输出到 dist，而不是编译后的 .html
    const indexEjs = join(root, 'dist/8/index.ejs');
    const homeEjs  = join(root, 'dist/8/home.ejs');
    expect(existsSync(indexEjs), 'dist/8/index.ejs must exist').toBe(true);
    expect(existsSync(homeEjs), 'dist/8/home.ejs must exist').toBe(true);

    // No .html files should be produced in template mode
    // template 模式下不应产出 .html 文件
    expect(existsSync(
      join(root, 'dist/8/index.html')), 'dist/8/index.html must NOT exist in template mode').toBe(false);
    expect(existsSync(join(root, 'dist/8/home.html')), 'dist/8/home.html must NOT exist in template mode').toBe(false);

    const indexTemplate = read('dist/8/index.ejs');
    const homeTemplate  = read('dist/8/home.ejs');

    // Template syntax is preserved for server-side rendering
    // 保留模板语法供服务端渲染使用
    expect(indexTemplate).toContain('<%= title %>');
    expect(homeTemplate).toContain('<%= title %>');
    expect(homeTemplate).toContain('<%= pageTitle %>');

    // Generated asset tags are injected (Vite always adds crossorigin)
    // 注入生成的资源标签（Vite 始终添加 crossorigin 属性）
    expect(indexTemplate).toContain('type="module"');
    expect(indexTemplate).toContain('crossorigin');
    expect(homeTemplate).toContain('type="module"');
    expect(homeTemplate).toContain('crossorigin');

    // No injectPlaceholder was set, so tags must have been injected right
    // before </head> (the default Vite-native inject-to-head position).
    // 未设置 injectPlaceholder，标签必须注入在 </head> 前（Vite 原生默认位置）。
    expect(indexTemplate).toMatch(/type="module"[\s\S]*crossorigin[\s\S]*<\/head>/i);
    expect(homeTemplate).toMatch(/type="module"[\s\S]*crossorigin[\s\S]*<\/head>/i);
  }, 60000);

  it('config 9: strategy.build both — emits compiled .html AND original .ejs template with asset tags', () => {
    build(9);

    // strategy.build: 'both' must emit BOTH file types at the same time
    // strategy.build: 'both' 必须同时产出两种文件类型
    const indexHtml = join(root, 'dist/9/index.html');
    const homeHtml  = join(root, 'dist/9/home.html');
    const indexEjs  = join(root, 'dist/9/index.ejs');
    const homeEjs   = join(root, 'dist/9/home.ejs');

    expect(existsSync(indexHtml), 'dist/9/index.html must exist (both mode)').toBe(true);
    expect(existsSync(homeHtml), 'dist/9/home.html must exist (both mode)').toBe(true);
    expect(existsSync(indexEjs), 'dist/9/index.ejs must exist (both mode)').toBe(true);
    expect(existsSync(homeEjs), 'dist/9/home.ejs must exist (both mode)').toBe(true);

    // 1) Compiled .html files: engineOptions rendered (no leftover EJS syntax)
    //    编译后的 .html：engineOptions 已被渲染，不应残留 EJS 语法
    const indexHtmlSrc = read('dist/9/index.html');
    const homeHtmlSrc  = read('dist/9/home.html');
    expect(indexHtmlSrc).toContain('EJS Build Both Example');
    expect(indexHtmlSrc).toContain('<li>One</li>');
    expect(indexHtmlSrc).toContain('<li>Two</li>');
    expect(indexHtmlSrc).toContain('<li>Three</li>');
    expect(indexHtmlSrc).not.toContain('<%=');
    expect(indexHtmlSrc).not.toContain('<% items');
    expect(homeHtmlSrc).toContain('Multi-Page Example');
    expect(homeHtmlSrc).toContain('data-page="home"');

    // 2) Original .ejs template files: syntax preserved + asset tags injected
    //    原始 .ejs 模板文件：保留语法 + 注入了资源标签
    const indexTpl = read('dist/9/index.ejs');
    const homeTpl  = read('dist/9/home.ejs');
    expect(indexTpl).toContain('<%= title %>');
    expect(indexTpl).toContain('<% items.forEach(function(item)');
    expect(homeTpl).toContain('<%= pageTitle %>');
    expect(indexTpl).toContain('type="module"');
    expect(indexTpl).toContain('crossorigin');
    expect(homeTpl).toContain('type="module"');
    expect(homeTpl).toContain('crossorigin');

    // 3) .html and .ejs must NOT be byte-for-byte identical (one is rendered,
    //    the other keeps template syntax); different files = different contents
    //    .html 和 .ejs 不能字节相同（一个被渲染了，一个保留模板语法）；
    //    不同文件必然内容不同
    expect(indexHtmlSrc).not.toEqual(indexTpl);
    expect(homeHtmlSrc).not.toEqual(homeTpl);
  }, 60000);

  // eslint-disable-next-line max-len
  it('config 10: strategy.build template + injectPlaceholder — asset tags replace placeholder, not </head>-before default', () => {
    build(10);

    // Dedicated -pl.ejs templates are emitted; no .html is produced
    // 产出专用的 -pl.ejs 模板文件；不产出 .html
    const indexEjs = join(root, 'dist/10/index-pl.ejs');
    const homeEjs  = join(root, 'dist/10/home-pl.ejs');
    expect(existsSync(indexEjs), 'dist/10/index-pl.ejs must exist').toBe(true);
    expect(existsSync(homeEjs), 'dist/10/home-pl.ejs must exist').toBe(true);
    expect(existsSync(
      join(root, 'dist/10/index-pl.html')), 'dist/10/index-pl.html must NOT exist (template build mode)').toBe(false);
    expect(existsSync(
      join(root, 'dist/10/home-pl.html')), 'dist/10/home-pl.html must NOT exist (template build mode)').toBe(false);
    expect(
      existsSync(
        join(root,
          'dist/10/index.html')), 'dist/10/index.html must NOT exist (entry keys map to -pl.ejs names)').toBe(false);

    const indexTpl = read('dist/10/index-pl.ejs');
    const homeTpl  = read('dist/10/home-pl.ejs');

    // Placeholder string itself must be gone (replaced by the actual tags)
    // 占位符字符串本身必须消失（被真实标签替换了）
    expect(indexTpl).not.toContain('<!-- VITE_ASSETS -->');
    expect(homeTpl).not.toContain('<!-- VITE_ASSETS -->');

    // Asset tags are present with Vite's crossorigin attribute
    // 资源标签必须存在且带 Vite 的 crossorigin 属性
    expect(indexTpl).toContain('type="module"');
    expect(indexTpl).toContain('crossorigin');
    expect(homeTpl).toContain('type="module"');
    expect(homeTpl).toContain('crossorigin');

    // Template syntax preserved for backend re-render
    // 保留模板语法供后端二次渲染
    expect(indexTpl).toContain('<%= title %>');
    expect(indexTpl).toContain('<% items.forEach(function(item)');
    expect(homeTpl).toContain('<%= pageTitle %>');

    // CRITICAL assertion for injectPlaceholder placement:
    //   The marker meta tag we placed AFTER the placeholder must appear
    //   AFTER the injected crossorigin asset tags in the final output.
    //   If tags were erroneously injected before </head> instead of at
    //   the placeholder, the meta would appear BEFORE the crossorigin
    //   attribute, and this regex would fail.
    //
    // injectPlaceholder 位置的关键断言：
    //   放在占位符"之后"的标记 meta 标签，在最终输出中必须出现在
    //   注入的 crossorigin 资源标签之后。
    //   如果标签被错误地注入在 </head> 前而非占位符位置，
    //   meta 会出现在 crossorigin 属性之前，此正则就会失败。
    expect(indexTpl).toMatch(/crossorigin[\s\S]*placeholder-marker" content="after-vite-assets"/);
    expect(homeTpl).toMatch(/crossorigin[\s\S]*placeholder-marker" content="home-after-vite-assets"/);
  }, 60000);

  it('config 11: Pug + build template + injectPlaceholder — HTML tags converted to Pug syntax, inserted at placeholder', () => {
    build(11);

    // Template files emitted; no .html (template mode)
    // 产出模板文件；不产出 .html（template 模式）
    const indexPug = join(root, 'dist/11/index-pl.pug');
    const homePug  = join(root, 'dist/11/home-pl.pug');
    expect(existsSync(indexPug), 'dist/11/index-pl.pug must exist').toBe(true);
    expect(existsSync(homePug), 'dist/11/home-pl.pug must exist').toBe(true);
    expect(existsSync(join(root, 'dist/11/index-pl.html')), 'dist/11/index-pl.html must NOT exist (Pug template mode)').toBe(false);
    expect(existsSync(join(root, 'dist/11/home-pl.html')), 'dist/11/home-pl.html must NOT exist (Pug template mode)').toBe(false);

    const idx = read('dist/11/index-pl.pug');
    const hm  = read('dist/11/home-pl.pug');

    // Placeholder itself must have been replaced (not present in output)
    // 占位符本身必须已被替换（输出中不再出现）
    expect(idx).not.toContain('//- VITE_ASSETS');
    expect(hm).not.toContain('//- VITE_ASSETS');

    // Pug template syntax preserved for backend re-render
    // 保留 Pug 模板语法供后端二次渲染
    expect(idx).toContain('title= title');
    expect(idx).toContain('meta(name="description" content=description)');
    expect(idx).toContain('h1= title');
    expect(hm).toContain('title Multi-Page: #{title}');
    expect(hm).toContain('h1 Multi-Page Example · #{pageTitle}');

    // Vite asset tags must be emitted as PUG-NATIVE syntax, NOT raw HTML
    // (<script crossorigin ...> would NOT be valid Pug and would either fail
    // compilation or render as literal text).
    // Vite 资源标签必须以 Pug 原生语法出现，而不是原始 HTML
    // （<script crossorigin ...> 对 Pug 不合法，要么编译失败要么当文本渲染）。
    expect(idx).toContain('script(type="module", crossorigin, src=');
    expect(idx).not.toMatch(/<script\s/); // raw HTML <script> must never appear in .pug output
    expect(idx).not.toMatch(/<link\s/); // raw HTML <link> must never appear in .pug output
    expect(hm).toContain('script(type="module", crossorigin, src=');

    // Also check the link(rel="stylesheet", crossorigin, href=…) tag is
    // emitted (build pipeline always produces it when CSS chunks exist;
    // here we may only get a script tag depending on the example source,
    // so the presence of the script tag is enough to validate the conversion).
    // 同时检查 link(rel="stylesheet", crossorigin, href=…) 标签是否产出
    // （当 CSS chunk 存在时构建流水线总会生成；根据示例源码可能只有
    // script 标签，所以能确认 script 标签已转换就足够验证转换逻辑了）。

    // Placeholder positioning: the marker meta placed AFTER the placeholder
    // in the source must appear AFTER the injected crossorigin attribute in
    // the output. For Pug the marker is
    //   meta(name="placeholder-marker" content="after-vite-assets-pug")
    // 占位符位置断言：源码里占位符后紧跟的 marker meta，在输出中必须
    // 位于注入的 crossorigin 属性之后。Pug 的 marker 形式是
    //   meta(name="placeholder-marker" content="after-vite-assets-pug")
    expect(idx).toMatch(/crossorigin, src=[\s\S]*placeholder-marker" content="after-vite-assets-pug"/);
    expect(hm).toMatch(/crossorigin, src=[\s\S]*placeholder-marker" content="home-after-vite-assets-pug"/);
  }, 60000);

  it('config 12: Pug + build template WITHOUT injectPlaceholder — indent fallback inserts Pug syntax under head block', () => {
    build(12);

    const indexPug = join(root, 'dist/12/index.pug');
    const homePug  = join(root, 'dist/12/home.pug');
    expect(existsSync(indexPug), 'dist/12/index.pug must exist').toBe(true);
    expect(existsSync(homePug), 'dist/12/home.pug must exist').toBe(true);
    expect(existsSync(join(root, 'dist/12/index.html')), 'dist/12/index.html must NOT exist (Pug template mode)').toBe(false);
    expect(existsSync(join(root, 'dist/12/home.html')), 'dist/12/home.html must NOT exist (Pug template mode)').toBe(false);

    const idxSrc = read('dist/12/index.pug');
    const hmSrc  = read('dist/12/home.pug');

    // 1) Syntax preserved for backend re-render
    // 1) 保留语法供后端二次渲染
    expect(idxSrc).toContain('title= title');
    expect(idxSrc).toContain('meta(name="description" content=description)');
    expect(idxSrc).toContain('#app');
    expect(hmSrc).toContain('title Multi-Page: #{title}');
    expect(hmSrc).toContain('p(data-page="home")');

    // 2) Pug-native generated tags present, raw HTML forbidden
    // 2) 必须有 Pug 原生形式的生成标签，禁止出现原始 HTML
    expect(idxSrc).toContain('script(type="module", crossorigin, src=');
    expect(idxSrc).not.toMatch(/<script\s/);
    expect(idxSrc).not.toMatch(/<link\s/);
    expect(hmSrc).toContain('script(type="module", crossorigin, src=');
    expect(hmSrc).not.toMatch(/<script\s/);
    expect(hmSrc).not.toMatch(/<link\s/);

    // 3) FALLBACK PLACEMENT — the critical assertion.
    //    Original source index.pug has this order inside head:
    //        head
    //          meta(charset="UTF-8")          ← first existing child
    //          title= title                    ← second existing child
    //          meta(name="description" …)    ← third existing child
    //    The plugin MUST detect the 4-space indent of the existing children
    //    and insert the generated tags BETWEEN the `head` declaration line
    //    AND the first existing child `meta(charset="UTF-8")`. So the output
    //    order must be:
    //        head
    //          script(type="module", crossorigin, src=…)   ← generated first
    //          [link(rel="stylesheet"…)]                   ← maybe generated
    //          meta(charset="UTF-8")                        ← original first child
    //    In other words, `meta(charset="UTF-8")` (the original first child)
    //    must appear on a LATER line than the `script(type="module", …)`
    //    line that we injected. We check that with a regex that requires
    //    "crossorigin, src=" before "meta(charset=\"UTF-8\")" at the
    //    4-space indent level.
    //
    // 3) FALLBACK 位置——关键断言。
    //    源码 index.pug 中 head 块内的顺序是：
    //        head
    //          meta(charset="UTF-8")          ← 第一个原有子节点
    //          title= title                    ← 第二个原有子节点
    //          meta(name="description" …)    ← 第三个原有子节点
    //    插件必须检测到原有子节点使用的 4 空格缩进，把生成的标签插入在
    //    `head` 声明行与第一个原有子节点 `meta(charset="UTF-8")` 之间。
    //    因此输出顺序必须是：
    //        head
    //          script(type="module", crossorigin, src=…)   ← 生成的放在最前面
    //          [link(rel="stylesheet"…)]                   ← 可能生成
    //          meta(charset="UTF-8")                        ← 原来的第一个子节点
    //    换句话说，`meta(charset="UTF-8")`（原第一个子节点）必须出现在
    //    我们注入的 `script(type="module", …)` 行的**后面**。
    //    用正则要求在 4 空格缩进层级上 "crossorigin, src=" 出现在
    //    "meta(charset=\"UTF-8\")" 之前。
    expect(idxSrc).toMatch(/script\(type="module", crossorigin, src=[\s\S]*meta\(charset="UTF-8"\)/);

    // 4) Same fallback check on home.pug: its head's first existing child is
    //    `meta(charset="UTF-8")` too.
    // 4) home.pug 上执行相同的 fallback 检查：它的 head 第一个原有子节点
    //    也是 `meta(charset="UTF-8")`。
    expect(hmSrc).toMatch(/script\(type="module", crossorigin, src=[\s\S]*meta\(charset="UTF-8"\)/);
  }, 60000);
});
