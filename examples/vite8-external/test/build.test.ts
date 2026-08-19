import { execSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

const root = join(__dirname, '..');

function build(n: number) {
  execSync(`pnpm run build:${n}`, { cwd: root, stdio: 'pipe' });
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

afterEach(() => {
  for (const dir of ['dist', '.external-cache']) {
    const p = join(root, dir);
    if (existsSync(p)) {
      rmSync(p, { recursive: true, force: true });
    }
  }
});

describe('vite-plugin-external example configs', () => {
  it('config 1: Record externals — IIFE with React/ReactDOM globals', () => {
    build(1);
    const jsFile = findJs(join(root, 'dist/1/assets'));
    expect(jsFile).not.toBeNull();
    const code = readFileSync(jsFile!, 'utf-8');
    // Rolldown IIFE 原生方式：globals 作为参数传入 — })(React, ReactDOM);
    expect(code).toMatch(/\}\)\s*\(\s*React\s*,\s*ReactDOM\s*\)\s*;?\s*$/m);
    // 代码中实际使用了 React 的 API
    expect(code).toMatch(/createElement/);
    expect(code).toMatch(/createRoot/);
  }, 60000);

  it('config 2: function externals — both react branch AND @scope/* branch', () => {
    build(2);
    // Config.2 使用 lib IIFE 模式，产物在 dist/2/ 根目录
    const jsFile = findJs(join(root, 'dist/2'));
    expect(jsFile).not.toBeNull();
    const code = readFileSync(jsFile!, 'utf-8');

    // vite-plugin-external 通过 stash shim 注入全局引用（非压缩格式，有空格）
    // 1) react 分支
    expect(code).toMatch(/exports\s*=\s*React/);
    expect(code).toMatch(/exports\s*=\s*ReactDOM/);
    // 2) @scope/* 前缀分支：动态生成 ScopeFoo 全局名
    // 这证明 source.startsWith('@scope/') 分支真的被执行了，不是伪通过
    expect(code).toMatch(/exports\s*=\s*ScopeFoo/);
  }, 60000);

  it('config 3: externalizeDeps — lodash + dayjs + @babel/core all external', () => {
    build(3);
    expect(existsSync(join(root, 'dist/3/my-lib.js'))).toBe(true);
    const code = read('dist/3/my-lib.js');

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
  }, 60000);

  it('config 4: multi-environment override — production globals', () => {
    build(4);
    const jsFile = findJs(join(root, 'dist/4/assets'));
    expect(jsFile).not.toBeNull();
    const code = readFileSync(jsFile!, 'utf-8');
    // 生产构建：IIFE 参数中注入 $linkdesign.React（压缩格式）
    expect(code).toContain('$linkdesign.React');
  }, 60000);

  it('config 5: interop auto', () => {
    build(5);
    const jsFile = findJs(join(root, 'dist/5/assets'));
    expect(jsFile).not.toBeNull();
    const code = readFileSync(jsFile!, 'utf-8');
    // interop: 'auto' 通过 stash shim 注入 React/ReactDOM
    // 压缩格式：.exports=React / .exports=ReactDOM
    expect(code).toMatch(/exports\s*=\s*React\b/);
    expect(code).toMatch(/exports\s*=\s*ReactDOM\b/);
  }, 60000);

  it('config 6: externalGlobals — rollup-plugin-external-globals escape-hatch', () => {
    build(6);
    const jsFile = findJs(join(root, 'dist/6/assets'));
    expect(jsFile).not.toBeNull();
    const code = readFileSync(jsFile!, 'utf-8');

    // === Escape-hatch 模式的核心正反向标记 ===
    //
    // A. 【反向 - 绝不能出现】
    //    Config 1 走 Rolldown 原生 output.globals 的 IIFE 特征：结尾带参数
    //    `})(React, ReactDOM);`；escape-hatch 走 transform 改写，不会再给
    //    IIFE 挂 output.globals，因此一定没有这种参数注入。
    expect(code).not.toMatch(/\}\)\s*\(\s*React\s*,\s*ReactDOM\s*\)\s*;?\s*$/m);
    //    Config 2/5/9 走 stash shim：`exports = React`；escape-hatch 不走 shim。
    expect(code).not.toMatch(/exports\s*=\s*React\b/);
    //    Config 1/原生 globals interop 形式：react.default.createElement /
    //    react_dom_client.createRoot（Rolldown interop 后会用参数命名空间）。
    expect(code).not.toMatch(/react\.default\.createElement/);
    expect(code).not.toMatch(/react_dom_client\.createRoot/);

    // B. 【正向 - 必须出现】
    //    rollup-plugin-external-globals 把 ES import 直接改写为全局裸引用：
    //      import React from 'react'              → const React = window.React / 直接 React
    //      import { createRoot } from 'react-dom/client'
    //                                             → 直接使用 ReactDOM.createRoot
    //    所以产物里：
    //      1) 完全没有顶层 import（都被替换了）
    expect(code).not.toMatch(/^\s*import\s+.*\s+from\s+"[^"]+"/m);
    //      2) 直接写 React.createElement / ReactDOM.createRoot 这种**裸全局名**
    //         （没有 react.default 前缀，这是 escape-hatch 独有的特征）
    expect(code).toMatch(/React\.createElement\s*\(/);
    expect(code).toMatch(/ReactDOM\.createRoot\s*\(/);
    //      3) IIFE 结尾不带参数 — 裸代码直接 `})();`，证明 Rolldown 原生
    //         output.globals 没被启用（否则会把 React/ReactDOM 做参数注入）
    expect(code).toMatch(/\}\)\s*\(\s*\)\s*;?\s*$/m);
  }, 60000);

  it('config 7: CDN URL externals — imports from esm.sh', () => {
    build(7);
    const jsFile = findJsRecursive(join(root, 'dist/7'));
    expect(jsFile).not.toBeNull();
    const code = readFileSync(jsFile!, 'utf-8');
    // 从 CDN URL 导入，而不是从 node_modules 打包
    expect(code).toContain('https://esm.sh/react@');
    expect(code).toContain('https://esm.sh/react-dom@');
  }, 60000);

  it('config 8: nodeBuiltins + externalizeDeps — node:path + lodash + dayjs all external', () => {
    build(8);
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
  }, 60000);

  it('config 9: Vue external — IIFE with Vue global', () => {
    build(9);
    const jsFile = findJs(join(root, 'dist/9')) ?? findJs(join(root, 'dist/9/assets'));
    expect(jsFile).not.toBeNull();
    const code = readFileSync(jsFile!, 'utf-8');
    // stash shim 格式，可能是压缩的 .exports=Vue
    expect(code).toMatch(/exports\s*=\s*Vue\b/);
  }, 60000);

  it('config 10: externals array [string | RegExp] — lodash and @babel/* external', () => {
    build(10);
    expect(existsSync(join(root, 'dist/10/my-lib.js'))).toBe(true);
    const code = read('dist/10/my-lib.js');

    // externals: ['lodash', /^@babel\//] → 两者都必须顶层 import 保留
    expect(code).toMatch(/^import\s+.*\s+from\s+"lodash"/m);
    expect(code).toMatch(/^import\s+.*\s+from\s+"@babel\/core"/m);

    // dayjs 不在 externals 数组中，所以没有顶层 import
    expect(code).not.toMatch(/^import\s+.*\s+from\s+"dayjs"/m);
  }, 60000);

  it('config 11: custom cacheDir — IIFE with React/ReactDOM globals', () => {
    build(11);
    // cacheDir: '.external-cache' 自定义 stash 缓存目录，
    // 不影响构建结果，只影响 vite-plugin-external 生成 shim 的存储位置。
    const jsFile = findJs(join(root, 'dist/11/assets'));
    expect(jsFile).not.toBeNull();
    const code = readFileSync(jsFile!, 'utf-8');
    // 与 Config.1 类似：IIFE 参数形式注入 React/ReactDOM
    expect(code).toMatch(/\}\)\s*\(\s*React\s*,\s*ReactDOM\s*\)\s*;?\s*$/m);
  }, 60000);
});
