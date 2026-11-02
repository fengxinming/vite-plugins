import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { cleanDir, cleanDist, runBuild } from '../../shared/example-testkit';

const root = join(__dirname, '..');

async function build(n: number) {
  const { code, stdout } = await runBuild(root, 'build', n);
  if (code !== 0) {
    throw new Error(`build:${n} failed (code=${code})\n${stdout}`);
  }
}

function read(...segments: string[]) {
  return readFileSync(join(root, ...segments), 'utf-8');
}

/** Find the first .js (or .mjs) file under a directory. */
function findJs(dir: string): string | null {
  if (!existsSync(dir)) {
    return null;
  }
  for (const f of readdirSync(dir)) {
    if (f.endsWith('.js') || f.endsWith('.mjs')) {
      return join(dir, f);
    }
  }
  return null;
}

/**
 * Scan a directory recursively for the first matching JS file.
 * 递归查找目录下第一个匹配的 JS 文件。
 */
function findJsRecursive(startDir: string): string | null {
  if (!existsSync(startDir)) {
    return null;
  }
  const stack = [startDir];
  while (stack.length > 0) {
    const cur = stack.pop()!;
    const entries = readdirSync(cur, { withFileTypes: true });
    for (const e of entries) {
      const full = join(cur, e.name);
      if (e.isFile() && /\.(m?js)$/.test(e.name)) {
        return full;
      }
      if (e.isDirectory()) {
        stack.push(full);
      }
    }
  }
  return null;
}

/**
 * 依赖"源码是否被打包"的判别标记（均从对应 node_modules 生产代码实测取得）：
 * 断言 not.toContain 即"产物中不含该依赖源码"；toContain 即"确实打包在内"。
 */
const MARKERS = {
  react: 'react.transitional.element', // react/cjs/react.production.js
  reactDom: 'formatProdErrorMessage', // react-dom/cjs/react-dom-client.production.js
  lodash: '__lodash_hash_undefined__', // lodash/lodash.js
  dayjs: 'invalidDate', // dayjs
  babel: '@babel/parser', // @babel/core/lib 内部依赖串；external 走 import 语句时不出现
  vue: 'templateContainer' // @vue/runtime-dom esm-bundler
};

afterEach(() => {
  cleanDist(root);
  cleanDir(root, '.external-cache');
});

describe('vite-plugin-external example configs', () => {
  it('config 1: Record externals — IIFE with React/ReactDOM globals', async () => {
    await build(1);
    const jsFile = findJs(join(root, 'dist/1/assets'));
    expect(jsFile).not.toBeNull();
    const code = readFileSync(jsFile!, 'utf-8');
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
  }, 60000);

  it('config 2: function externals — both react branch AND @scope/* branch', async () => {
    await build(2);
    // Config.2 使用 lib IIFE 模式，产物在 dist/2/ 根目录
    const jsFile = findJs(join(root, 'dist/2'));
    expect(jsFile).not.toBeNull();
    const code = readFileSync(jsFile!, 'utf-8');
    // 量级上限：依赖整包混入会让产物膨胀一个数量级（react ~130KB、lodash ~530KB）。
    expect(code.length).toBeLessThan(16384);

    // vite-plugin-external 走原生 external + output.globals（lib.formats 含 iife
    // 时门控判定为 IIFE 构建）：全局名作为 IIFE 实参传入 — })(ScopeFoo, React, ReactDOM);
    // 1) react 分支
    expect(code).toMatch(/\}\)\s*\(\s*ScopeFoo,\s*React,\s*ReactDOM\s*\)/);
    // 2) @scope/* 前缀分支：动态生成 ScopeFoo 全局名
    // 这证明 source.startsWith('@scope/') 分支真的被执行了，不是伪通过
    expect(code).toMatch(/ScopeFoo/);
    // 不包含：react 系列源码不得漏进包
    expect(code).not.toContain(MARKERS.react);
    expect(code).not.toContain(MARKERS.reactDom);
  }, 60000);

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
  }, 60000);

  it('config 4: multi-environment override — production globals', async () => {
    await build(4);
    const jsFile = findJs(join(root, 'dist/4/assets'));
    expect(jsFile).not.toBeNull();
    const code = readFileSync(jsFile!, 'utf-8');
    // 量级上限：依赖整包混入会让产物膨胀一个数量级（react ~130KB、lodash ~530KB）。
    expect(code.length).toBeLessThan(16384);
    // 生产构建：IIFE 参数中注入 $linkdesign.React / ReactDOM。
    // 必须锁参数位置——只断言字符串出现过，被塞到注释或别处也算通过。
    expect(code).toMatch(/\}\)\s*\(\s*\$linkdesign\.React\s*,\s*\$linkdesign\.ReactDOM\s*\)/);
    // 不包含：Record 键含 'react-dom/client'（精确匹配书写态）时，
    // react/react-dom 源码都必须留在包外——这条曾漏网（缺键导致 474kB 整包混入）
    expect(code).not.toContain(MARKERS.react);
    expect(code).not.toContain(MARKERS.reactDom);
  }, 60000);

  it('config 5: interop auto', async () => {
    await build(5);
    const jsFile = findJs(join(root, 'dist/5/assets'));
    expect(jsFile).not.toBeNull();
    const code = readFileSync(jsFile!, 'utf-8');
    // 量级上限：依赖整包混入会让产物膨胀一个数量级（react ~130KB、lodash ~530KB）。
    expect(code.length).toBeLessThan(16384);
    // interop: 'auto' 通过 stash shim 注入 React/ReactDOM
    // 压缩格式：.exports=React / .exports=ReactDOM
    expect(code).toMatch(/exports\s*=\s*React\b/);
    expect(code).toMatch(/exports\s*=\s*ReactDOM\b/);
    // 不包含：走 shim 路径同样不该把源码打进来
    expect(code).not.toContain(MARKERS.react);
    expect(code).not.toContain(MARKERS.reactDom);
  }, 60000);

  it('config 7: CDN URL externals — imports from esm.sh', async () => {
    await build(7);
    const jsFile = findJsRecursive(join(root, 'dist/7'));
    expect(jsFile).not.toBeNull();
    const code = readFileSync(jsFile!, 'utf-8');
    // 量级上限：依赖整包混入会让产物膨胀一个数量级（react ~130KB、lodash ~530KB）。
    expect(code.length).toBeLessThan(16384);
    // 必须是真的 import 语句指向 CDN，而不是任意位置上出现该 URL。
    expect(code).toMatch(/import\s+React\s+from\s*["']https:\/\/esm\.sh\/react@/);
    expect(code).toMatch(/import\s+\{[^}]*createRoot[^}]*\}\s+from\s*["']https:\/\/esm\.sh\/react-dom@/);
    // 不包含：CDN 形态下 react/react-dom 源码零进包
    expect(code).not.toContain(MARKERS.react);
    expect(code).not.toContain(MARKERS.reactDom);
  }, 60000);

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
  }, 60000);

  it('config 9: Vue external — IIFE with Vue global', async () => {
    await build(9);
    const jsFile = findJs(join(root, 'dist/9')) ?? findJs(join(root, 'dist/9/assets'));
    expect(jsFile).not.toBeNull();
    const code = readFileSync(jsFile!, 'utf-8');
    // 量级上限：依赖整包混入会让产物膨胀一个数量级（react ~130KB、lodash ~530KB）。
    expect(code.length).toBeLessThan(16384);
    // lib.formats:['iife'] 被门控识别为 IIFE 构建 → 原生 external + globals：
    // 全局名作为 IIFE 实参传入 — })(Vue);
    expect(code).toMatch(/\}\)\s*\(\s*Vue\s*\)\s*;?\s*$/m);
    // 不包含：vue 源码不得进包
    expect(code).not.toContain(MARKERS.vue);
  }, 60000);

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
  }, 60000);

  it('config 11: custom cacheDir — IIFE with React/ReactDOM globals', async () => {
    await build(11);
    // cacheDir: '.external-cache' 自定义 stash 缓存目录，
    // 不影响构建结果，只影响 vite-plugin-external 生成 shim 的存储位置。
    const jsFile = findJs(join(root, 'dist/11/assets'));
    expect(jsFile).not.toBeNull();
    const code = readFileSync(jsFile!, 'utf-8');
    // 量级上限：依赖整包混入会让产物膨胀一个数量级（react ~130KB、lodash ~530KB）。
    expect(code.length).toBeLessThan(16384);
    // 与 Config.1 类似：IIFE 参数形式注入 React/ReactDOM
    expect(code).toMatch(/\}\)\s*\(\s*React\s*,\s*ReactDOM\s*\)\s*;?\s*$/m);
    // 不包含：自定义 cacheDir 不改变"源码不进包"的结果
    expect(code).not.toContain(MARKERS.react);
    expect(code).not.toContain(MARKERS.reactDom);
  }, 60000);

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
  }, 60000);

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
    // 不包含：react / react-dom 源码不得进包
    expect(code).not.toContain(MARKERS.react);
    expect(code).not.toContain(MARKERS.reactDom);
  }, 60000);

  it('config 14: 纯 external（函数返回 true）— lodash 不进包，产物保留裸 import', async () => {
    await build(14);
    const code = read('dist/14/my-lib.js');

    // 纯 external：产物里保留裸 import，由宿主环境在运行时提供该依赖。
    expect(code).toMatch(/from ["']lodash["']/);
    // lodash 源码不得进包：.VERSION 是 lodash 源码的标志。
    expect(code).not.toContain('.VERSION');
    // 未被 external 的依赖照常打包。
    expect(code).toContain(MARKERS.dayjs);
  }, 60000);
});
