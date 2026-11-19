import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { runBuild } from '../../shared/example-testkit';

const root = join(__dirname, '..');

/**
 * 用例之间不清理任何缓存/产物：
 *   - dist/<n> 由 vite 自己的 emptyOutDir 在每次构建前清空，无需手动 rm；
 *   - 插件的 stash 目录（各 config 独立 cacheDir）与 vite 的 deps 缓存原地保留，
 *     等价于真实项目里连续构建，让插件的清理链自己决定第二次拿到什么。
 */
async function build(n: number) {
  const { code, stdout } = await runBuild(root, 'build', n);
  if (code !== 0) {
    throw new Error(`build:${n} failed (code=${code})\n${stdout}`);
  }
}

function read(...segments: string[]) {
  return readFileSync(join(root, ...segments), 'utf-8');
}

/**
 * 产物页面的 module script 指向的入口文件。
 * 入口由页面自己声明，不靠扫目录猜名字：dist 里还有别的产物
 * （如 config 2 二次构建的 foo.iife.js）也不会被当成主入口。
 */
function entryFileOf(distDir: string): string {
  const html = readFileSync(join(distDir, 'index.html'), 'utf-8');
  const src = /<script\b(?=[^>]*\btype="module")(?=[^>]*\bsrc="\/([^"]+\.js)")[^>]*>/.exec(html)?.[1];
  if (!src) {
    throw new Error(`${distDir}/index.html 里没有指向构建产物的 module script`);
  }
  return join(distDir, src);
}

/**
 * 依赖"源码是否被打包"的判别标记（均从对应 node_modules 生产代码实测取得）：
 * 断言 not.toContain 即"产物中不含该依赖源码"；toContain 即"确实打包在内"。
 */
const MARKERS = {
  // 主包 Symbol.for 注册的类型名，16/17/18/19 都有；jsx-runtime 只有 element/fragment
  react: 'react.forward_ref',
  // React 19 主包独有的 owner-stack 实现；jsx-runtime 里不含。
  // （react.transitional.element 不能用作判据——jsx-runtime 自己也定义该 Symbol）
  reactDom: 'formatProdErrorMessage', // react-dom/cjs/react-dom-client.production.js
  lodash: '__lodash_hash_undefined__', // lodash/lodash.js
  dayjs: 'invalidDate', // dayjs
  babel: '@babel/parser', // @babel/core/lib 内部依赖串；external 走 import 语句时不出现
  vue: 'templateContainer' // @vue/runtime-dom esm-bundler
};

/**
 * 页面断言：external 依赖靠宿主提供，页面没挂 CDN 就等于产物跑不起来。
 * 这里一次校验两件事，缺一个都会红：
 *   1. CDN `<script>` 的地址（dev/build 各自不同，能证明 command 分支生效）；
 *   2. 页面声明的入口就是本次断言内容的那份产物（防止产物改名后 html 指向空文件）。
 */
function expectCdnPage(distDir: string, cdnUrl: string, jsFile: string) {
  const html = readFileSync(join(distDir, 'index.html'), 'utf-8');
  expect(html).toContain(cdnUrl);
  expect(entryFileOf(distDir)).toBe(jsFile);
}

/**
 * 页面预取标签的精确集合校验：多一条、少一条都红。
 * 不锁顺序 —— 标签顺序由依赖解析顺序决定，本来就不稳定。
 * crossorigin 必须落在同一个标签里：缺了它预取走 no-cors、模块请求要 CORS，
 * 两边对不上就是同一份依赖白取一遍（浏览器实测告警）。
 */
function expectCdnPreloads(html: string, urls: string[]) {
  const hrefs = [...html.matchAll(/<link[^>]*rel="modulepreload"[^>]*href="(https:\/\/[^"]+)"/g)]
    .map((m) => m[1]);
  expect(hrefs.sort(), 'modulepreload 的 CDN 地址集合应与产物真正 import 的地址一致')
    .toEqual([...urls].sort());
  for (const url of urls) {
    expect(html, `${url} 的预取标签应带 crossorigin`).toMatch(
      new RegExp(`<link[^>]*modulepreload[^>]*crossorigin[^>]*href="${url.replace(/\./g, '\\.')}">`),
    );
  }
}

describe('vite-plugin-external example configs', () => {
  it('config 1: Record externals — IIFE with React/ReactDOM globals', async () => {
    await build(1);
    const jsFile = entryFileOf(join(root, 'dist/1'));
    const code = readFileSync(jsFile, 'utf-8');
    // 量级上限：依赖整包混入会让产物膨胀一个数量级（react ~130KB、lodash ~530KB）。
    expect(code.length).toBeLessThan(16384);
    // Rolldown IIFE 原生方式：globals 作为参数传入 — })(React, ReactDOM);
    expect(code).toMatch(/\}\)\s*\(\s*React\s*,\s*ReactDOM\s*\)\s*;?\s*$/m);
    // 代码中实际使用了 React 的 API
    expect(code).toMatch(/createElement/);
    expect(code).toMatch(/createRoot/);
    // 不包含：react/react-dom 源码不得进包（只留全局引用）
    expect(code).not.toContain(MARKERS.react);
    expect(code).not.toContain(MARKERS.reactDom);
    // 页面：build 用压缩版 React UMD，且引用的 js 就是上面校验的产物
    expectCdnPage(join(root, 'dist/1'), 'https://unpkg.com/umd-react/dist/react.production.min.js', jsFile);
  }, 120000);

  it('config 2: function externals — both react branch AND @scope/* branch', async () => {
    await build(2);

    // dist/2 有两个 JS，角色不同，必须分别锁定：
    //   - 主入口   : 页面里的 module script 指向它
    //   - foo.iife.js : buildChunk 二次构建产物，页面里以经典脚本提供 ScopeFoo 全局
    const html = read('dist/2/index.html');
    const entryFile = entryFileOf(join(root, 'dist/2'));
    const code = readFileSync(entryFile, 'utf-8');
    // 量级上限：依赖整包混入会让产物膨胀一个数量级（react ~130KB、lodash ~530KB）。
    expect(code.length).toBeLessThan(16384);

    // 函数形态 production 分支的两条路都执行过：@scope/* → ScopeFoo、
    // react / react-dom/client → React / ReactDOM，各留一条 CJS shim。
    // ScopeFoo 能出现就证明 source.startsWith('@scope/') 分支真的执行过
    // （@scope/foo 并未安装，不可能从 node_modules 里被打包进来）。
    expect(code).toContain('module.exports = ScopeFoo;');
    expect(code).toContain('module.exports = React;');
    expect(code).toContain('module.exports = ReactDOM;');
    // 包含：react() 自动运行时用到的 jsx-runtime 没被 external，确实打进包。
    expect(code).toContain('react.transitional.element');
    // 不包含：react / react-dom 主包源码不得进包
    expect(code).not.toContain(MARKERS.react);
    expect(code).not.toContain(MARKERS.reactDom);

    // 第二个产物单独断言：它是页面里 ScopeFoo 全局的提供者，不是主入口。
    const scopeProvider = read('dist/2/foo.iife.js');
    expect(scopeProvider).toMatch(/^var ScopeFoo=/m);
    expect(scopeProvider).toContain('e.foo=');
    expect(html).toContain('src="/foo.iife.js"');

    // 页面：React/ReactDOM 用生产版 UMD，module 入口必须指向刚校验的主产物。
    expectCdnPage(join(root, 'dist/2'), 'https://unpkg.com/umd-react/dist/react.production.min.js', entryFile);
  }, 120000);

  it('config 3: externalizeDeps — lodash + dayjs + @babel/core all external', async () => {
    await build(3);
    expect(existsSync(join(root, 'dist/3/my-lib.js'))).toBe(true);
    const code = read('dist/3/my-lib.js');
    // 量级上限：依赖整包混入会让产物膨胀一个数量级（react ~130KB、lodash ~530KB）。
    expect(code.length).toBeLessThan(8192);

    // externalizeDeps 让 Vite/Rolldown 保持顶层 import，不打包依赖源码
    // 必须真正出现这三个 import（原来只有 node:path，这三个完全没引用——伪通过）
    expect(code).toMatch(/^import\s+.*\s+from\s+"lodash"/m);
    expect(code).toMatch(/^import\s+.*\s+from\s+"dayjs"/m);
    expect(code).toMatch(/^import\s+.*\s+from\s+"@babel\/core"/m);

    // lodash/dayjs/@babel 的方法调用必须在产物里出现，
    // 证明 src/lib.ts 真的用了这些依赖，而不是只在配置里写了名字
    expect(code).toMatch(/\.merge\s*\(/); // lodash merge
    expect(code).toMatch(/\.pick\s*\(/); // lodash pick
    expect(code).toMatch(/\.format\s*\(/); // dayjs format
    expect(code).toMatch(/\.version/); // @babel/core version

    // 不包含：三者均为纯 external，源码不得进包
    expect(code).not.toContain(MARKERS.lodash);
    expect(code).not.toContain(MARKERS.dayjs);
    expect(code).not.toContain(MARKERS.babel);
  }, 120000);

  it('config 4: 配置函数按 command 分支 — production 用 $linkdesign 全局', async () => {
    await build(4);
    const jsFile = entryFileOf(join(root, 'dist/4'));
    const code = readFileSync(jsFile, 'utf-8');
    // 量级上限：依赖整包混入会让产物膨胀一个数量级（react ~130KB、lodash ~530KB）。
    expect(code.length).toBeLessThan(16384);
    // 生产构建：IIFE 参数中注入 $linkdesign.React / ReactDOM。
    // 必须锁参数位置——只断言字符串出现过，被塞到注释或别处也算通过。
    expect(code).toMatch(/\}\)\s*\(\s*\$linkdesign\.React\s*,\s*\$linkdesign\.ReactDOM\s*\)/);
    // 不包含：Record 键含 'react-dom/client'（精确匹配书写态）时，
    // react/react-dom 源码都必须留在包外——这条曾漏网（缺键导致 474kB 整包混入）
    expect(code).not.toContain(MARKERS.react);
    expect(code).not.toContain(MARKERS.reactDom);
  }, 120000);

  it('config 5: interop auto', async () => {
    await build(5);
    const jsFile = entryFileOf(join(root, 'dist/5'));
    const code = readFileSync(jsFile, 'utf-8');
    // 量级上限：依赖整包混入会让产物膨胀一个数量级（react ~130KB、lodash ~530KB）。
    expect(code.length).toBeLessThan(16384);
    // interop: 'auto' 通过 stash shim 注入 React/ReactDOM
    // 压缩格式：.exports=React / .exports=ReactDOM
    expect(code).toMatch(/exports\s*=\s*React\b/);
    expect(code).toMatch(/exports\s*=\s*ReactDOM\b/);
    // 不包含：走 shim 路径同样不该把源码打进来
    expect(code).not.toContain(MARKERS.react);
    expect(code).not.toContain(MARKERS.reactDom);
  }, 120000);

  it('config 6: Vue JSX — vue 外置 + @vitejs/plugin-vue-jsx 编译', async () => {
    await build(6);
    const jsFile = entryFileOf(join(root, 'dist/6'));
    const code = readFileSync(jsFile, 'utf-8');
    // 量级上限：vue 运行时整包 ~130KB，混入即膨胀一个数量级。
    expect(code.length).toBeLessThan(16384);
    // IIFE 全局实参：})(Vue);
    expect(code).toMatch(/\}\)\s*\(\s*Vue\s*\)\s*;?\s*$/m);
    // 包含：JSX 由 vue-jsx 插件编译成 createVNode；
    // 若插件没生效，.tsx 会走 esbuild 的 React 自动运行时，产物里出现的是 jsx() 而非 createVNode。
    expect(code).toMatch(/createVNode/);
    // 不包含：vue 源码不得进包；React 也不该因为 JSX 运行时被拖进来
    // （react/jsx-runtime 被打进来即说明 .tsx 走了 esbuild 的自动运行时，而不是 vue-jsx 编译链）
    expect(code).not.toContain(MARKERS.vue);
    expect(code).not.toContain('react/jsx-runtime');
    // 页面：build 用生产版 Vue 全局构建，且引用的 js 就是上面校验的产物
    expectCdnPage(join(root, 'dist/6'), 'https://unpkg.com/vue@3/dist/vue.global.prod.js', jsFile);
  }, 120000);

  it('config 7: CDN URL externals — imports from esm.sh', async () => {
    await build(7);
    const jsFile = entryFileOf(join(root, 'dist/7'));
    const code = readFileSync(jsFile, 'utf-8');
    // 量级上限：依赖整包混入会让产物膨胀一个数量级（react ~130KB、lodash ~530KB）。
    expect(code.length).toBeLessThan(16384);
    // 必须是真的 import 语句指向 CDN，而不是任意位置上出现该 URL。
    expect(code).toMatch(/import\s+React\s+from\s*["']https:\/\/esm\.sh\/react@/);
    expect(code).toMatch(/import\s+\{[^}]*createRoot[^}]*\}\s+from\s*["']https:\/\/esm\.sh\/react-dom@/);
    // 不包含：CDN 形态下 react/react-dom 源码零进包
    expect(code).not.toContain(MARKERS.react);
    expect(code).not.toContain(MARKERS.reactDom);

    // 开关关着（本 config 没配 importmap）：地址写在产物的 import 里，HTML 只负责预取，
    // 不该再出现一张表 —— 「裸说明符 + 表」是开关打开后的形态（对照 config 16）。
    const html = read('dist/7/index.html');
    expect(html).not.toContain('type="importmap"');
    // 页面不手写 CDN 脚本：地址已经在产物 import 里，再挂一份就是同一依赖取两次。
    expect(html).not.toContain('<script src="https://esm.sh');

    // 预取集合 == 产物真正 import 的 CDN 地址集合。配置里另外两条（react-dom、
    // jsx-dev-runtime）没被入口引用，就不该凭空出现在页面上；反之漏一条也红。
    const importedUrls = [...code.matchAll(/from\s*"(https:\/\/esm\.sh\/[^"]+)"/g)].map((m) => m[1]);
    expect(importedUrls, '入口用到 react / react-dom/client / jsx-runtime 三条 CDN 地址').toHaveLength(3);
    expectCdnPreloads(html, importedUrls);
  }, 120000);

  it('config 8: nodeBuiltins + externalizeDeps — node:path + lodash + dayjs all external', async () => {
    await build(8);
    expect(existsSync(join(root, 'dist/8/my-lib.js'))).toBe(true);
    const code = read('dist/8/my-lib.js');

    // 1) nodeBuiltins: true → Node 内置模块用顶层 import 保留
    expect(code).toMatch(/^import\s+.*\s+from\s+"node:path"/m);

    // 2) externalizeDeps: ['lodash', 'dayjs'] → 这两个依赖也保持顶层 import
    expect(code).toMatch(/^import\s+.*\s+from\s+"lodash"/m);
    expect(code).toMatch(/^import\s+.*\s+from\s+"dayjs"/m);

    // 3) @babel/core 不在 externalizeDeps 列表中，所以不应顶层 import（会被打包进产物）
    //    注意：匹配不到 import ... from "@babel/core" 就行，这里不做强断言
    expect(code).not.toMatch(/^import\s+.*\s+from\s+"@babel\/core"/m);
    // 包含：@babel/core 源码确实被打进包（其内部依赖串为证）
    expect(code).toContain(MARKERS.babel);
    // 不包含：lodash/dayjs 是 external，源码不得进包
    expect(code).not.toContain(MARKERS.lodash);
    expect(code).not.toContain(MARKERS.dayjs);
  }, 120000);

  it('config 9: Vue external — IIFE with Vue global', async () => {
    await build(9);
    const jsFile = entryFileOf(join(root, 'dist/9'));
    const code = readFileSync(jsFile, 'utf-8');
    // 量级上限：依赖整包混入会让产物膨胀一个数量级（react ~130KB、lodash ~530KB）。
    expect(code.length).toBeLessThan(16384);
    // lib.formats:['iife'] 被门控识别为 IIFE 构建 → 原生 external + globals：
    // 全局名作为 IIFE 实参传入 — })(Vue);
    expect(code).toMatch(/\}\)\s*\(\s*Vue\s*\)\s*;?\s*$/m);
    // 不包含：vue 源码不得进包
    expect(code).not.toContain(MARKERS.vue);
    // 包含：SFC 确实被 @vitejs/plugin-vue 编译进产物
    // （__name 是 script setup 的组件名，createElementBlock 是模板编译出的运行时调用）
    expect(code).toMatch(/__name:\s*"VueApp"/);
    expect(code).toMatch(/createElementBlock/);
    // 页面：build 用生产版 Vue 全局构建，且引用的 js 就是上面校验的产物
    expectCdnPage(join(root, 'dist/9'), 'https://unpkg.com/vue@3/dist/vue.global.prod.js', jsFile);
  }, 120000);

  it('config 10: externals array [string | RegExp] — lodash and @babel/* external', async () => {
    await build(10);
    expect(existsSync(join(root, 'dist/10/my-lib.js'))).toBe(true);
    const code = read('dist/10/my-lib.js');
    // 量级上限：依赖整包混入会让产物膨胀一个数量级（react ~130KB、lodash ~530KB）。
    expect(code.length).toBeLessThan(65536);

    // externals: ['lodash', /^@babel\//] → 两者都必须顶层 import 保留
    expect(code).toMatch(/^import\s+.*\s+from\s+"lodash"/m);
    expect(code).toMatch(/^import\s+.*\s+from\s+"@babel\/core"/m);

    // dayjs 不在 externals 数组中，所以没有顶层 import
    expect(code).not.toMatch(/^import\s+.*\s+from\s+"dayjs"/m);
    // 包含：dayjs 源码确实被打进包
    expect(code).toContain(MARKERS.dayjs);
    // 不包含：lodash/@babel 是 external，源码不得进包
    expect(code).not.toContain(MARKERS.lodash);
    expect(code).not.toContain(MARKERS.babel);
  }, 120000);

  it('config 11: custom cacheDir — IIFE with React/ReactDOM globals', async () => {
    await build(11);
    // cacheDir: './node_modules/.external-cache' 自定义 stash 缓存目录，
    // 不影响构建结果，只影响 vite-plugin-external 生成 shim 的存储位置。
    const jsFile = entryFileOf(join(root, 'dist/11'));
    const code = readFileSync(jsFile, 'utf-8');
    // 量级上限：依赖整包混入会让产物膨胀一个数量级（react ~130KB、lodash ~530KB）。
    expect(code.length).toBeLessThan(16384);
    // 与 Config.1 类似：IIFE 参数形式注入 React/ReactDOM
    expect(code).toMatch(/\}\)\s*\(\s*React\s*,\s*ReactDOM\s*\)\s*;?\s*$/m);
    // 不包含：自定义 cacheDir 不改变"源码不进包"的结果
    expect(code).not.toContain(MARKERS.react);
    expect(code).not.toContain(MARKERS.reactDom);
  }, 120000);

  it('config 12: per-mode override — externalizeDeps concat + nodeBuiltins on', async () => {
    await build(12);
    expect(existsSync(join(root, 'dist/12/my-lib.js'))).toBe(true);
    const code = read('dist/12/my-lib.js');

    // 根配置 externalizeDeps: ['lodash'] → 顶层 import 保留
    expect(code).toMatch(/^import\s+.*\s+from\s+"lodash"/m);
    // production 模式追加 externalizeDeps: ['dayjs']（数组 concat + 去重）→ 同样顶层 import
    expect(code).toMatch(/^import\s+.*\s+from\s+"dayjs"/m);
    // production 模式开启 nodeBuiltins → node:path 顶层 import 保留
    expect(code).toMatch(/^import\s+.*\s+from\s+"node:path"/m);
    // @babel/core 不在任何列表中 → 被打包进产物，不留顶层 import
    expect(code).not.toMatch(/^import\s+.*\s+from\s+"@babel\/core"/m);
    // 包含：@babel/core 源码确实在包里
    expect(code).toContain(MARKERS.babel);
    // 不包含：lodash/dayjs 均被 externalizeDeps 外置，源码不得进包
    expect(code).not.toContain(MARKERS.lodash);
    expect(code).not.toContain(MARKERS.dayjs);
  }, 120000);

  it('config 13: lib.formats ["umd"] — UMD 同样走原生 external + output.globals', async () => {
    await build(13);
    const umdFile = readdirSync(join(root, 'dist/13')).find((f) => f.endsWith('.cjs'));
    // 断言具体文件名：toBeDefined 只要有个 .cjs 就过，命名规则退化了也发现不了。
    expect(umdFile).toBe('vite8-external.umd.cjs');
    const code = read('dist/13', umdFile!);
    // 量级上限：依赖整包混入会让产物膨胀一个数量级（react ~130KB、lodash ~530KB）。
    expect(code.length).toBeLessThan(16384);

    // 包含：globals 分支用全局变量喂参数（react→React、react-dom/client→ReactDOM）
    expect(code).toMatch(/factory\(global\.React,\s*global\.ReactDOM\)/);
    // 包含：UMD 的 CJS / AMD 分支保留 require/define 的外部依赖声明
    expect(code).toMatch(/require\("react"\)/);
    expect(code).toMatch(/define\(\["react",\s*"react-dom\/client"\]/);
    // 包含：代码确实调用了外部 API
    expect(code).toMatch(/createElement/);
    expect(code).toMatch(/createRoot/);
    // 不包含：react-dom 源码不得进包。react 主包标记（react.forward_ref）不适用于 UMD：
    // react/jsx-runtime 是 CJS 转发文件，dev 分支无法被 tree-shake，其内联 Symbol 表
    // 含 forward_ref——但主包确实没进包（require("react") 保留 + 体积断言兜底）。
    expect(code).not.toContain(MARKERS.reactDom);
  }, 120000);

  it('config 14: 纯 external（函数返回 true）— lodash 不进包，产物保留裸 import', async () => {
    await build(14);
    const code = read('dist/14/my-lib.js');

    // 纯 external：产物里保留裸 import，由宿主环境在运行时提供该依赖。
    expect(code).toMatch(/from ["']lodash["']/);
    // lodash 源码不得进包：.VERSION 是 lodash 源码的标志。
    expect(code).not.toContain('.VERSION');
    // 未被 external 的依赖照常打包。
    expect(code).toContain(MARKERS.dayjs);
  }, 120000);

  it('config 16: importmap 开关 — 产物留裸 import，地址只出现在 HTML 的表里', async () => {
    await build(16);
    const jsFile = entryFileOf(join(root, 'dist/16'));
    const code = readFileSync(jsFile, 'utf-8');

    // 开关改的是「地址写在哪」：产物里是裸说明符，CDN 地址只进 HTML 的 import map。
    expect(code).toMatch(/import\s+dayjs\s+from\s+"dayjs"/);
    expect(code).toMatch(/import\s+\w+\s+from\s+"lodash"/);
    // 反向（对照 config 7 那条 CDN 路线）：产物里出现 CDN 地址就说明开关没生效。
    expect(code).not.toMatch(/from\s+["']https:\/\/esm\.sh\//);
    // 量级上限 + 源码标记：依赖整包混入会让产物膨胀一个数量级。
    expect(code.length).toBeLessThan(16384);
    expect(code).not.toContain(MARKERS.lodash);
    expect(code).not.toContain(MARKERS.dayjs);

    const html = read('dist/16/index.html');

    // 表必须存在，且键是产物里那条裸说明符本身（不是 dev 的 /@id/ 形态）。
    // 不逐字节比字符串：标签内空格数量、以及条目顺序（由依赖解析顺序决定）都不稳定，
    // 所以按结构校验。
    const mapBody = /<script type="importmap">([\s\S]*?)<\/script>/.exec(html)?.[1];
    expect(mapBody, 'dist/16/index.html 里应有 <script type="importmap">').toBeTruthy();
    // {"imports":…} 外壳不能少：少外壳浏览器按空表处理（实测）。
    const map = JSON.parse(mapBody!) as { imports: Record<string, string> };
    expect(map).toEqual({
      imports: {
        lodash: 'https://esm.sh/lodash@4.18.1',
        dayjs: 'https://esm.sh/dayjs@1.11.23'
      }
    });

    // 跨产物一致性：表的键集合 == 产物里裸说明符集合。表里多列一个没被 import 的依赖、
    // 或漏掉一个真被 import 的依赖，浏览器都会在运行时解析失败，而单看 HTML 发现不了。
    const bareSpecifiers = [...code.matchAll(/from\s+"([^"]+)"/g)].map((m) => m[1]);
    expect(Object.keys(map.imports).sort(), 'import map 的键应与产物留下的裸说明符一一对应')
      .toEqual(bareSpecifiers.sort());

    // 预取集合 == 表里的地址集合（同 config 7 的口径，只是这边地址来自表而不是产物）。
    expectCdnPreloads(html, Object.values(map.imports));
    // 页面不手写 CDN 脚本：地址只该出现在表里，再挂一份就是同一依赖取两次。
    expect(html).not.toContain('<script src="https://esm.sh');

    // 表必须排在第一个 module script / modulepreload 之前：顺序错了浏览器整张表作废。
    // vite 的 postImportMapHook 会搬，这条断言钉的是「搬完之后仍然成立」。
    const mapIndex = html.indexOf('<script type="importmap">');
    const firstModule = html.search(/<script[^>]*type="module"|<link[^>]*modulepreload/);
    expect(mapIndex).toBeGreaterThanOrEqual(0);
    expect(firstModule).toBeGreaterThan(mapIndex);

    // 页面挂的 module script 就是上面校验的那个产物，不能指向空文件。
    expect(entryFileOf(join(root, 'dist/16'))).toBe(jsFile);
  }, 120000);
});
