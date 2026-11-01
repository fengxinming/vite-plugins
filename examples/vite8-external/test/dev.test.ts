import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { cleanDir, runScript } from '../../shared/example-testkit';

const root = join(__dirname, '..');
const stashDir = join(root, 'node_modules/.vite_external');

afterEach(() => {
  // dev 模式不产出 dist（产物在 node_modules/.vite），所以这里只清插件自己写的
  // stash 目录。不能调 cleanDist —— build.test.ts 与本文件是并行跑的，
  // 删整个 dist 会把那边正在生成的产物删掉。
  cleanDir(root, 'node_modules/.vite_external');
  cleanDir(root, 'node_modules/.external-cache');
});

/**
 * 依赖预构建是懒触发的：第一次请求可能触发预打包并让 vite 要求刷新页面，
 * 首次取优化依赖会拿到 504，这里重试几次再断言。
 * Dependency pre-bundling is lazy: the first request may trigger it and make Vite ask
 * for a reload, so the first fetch of an optimized dep can answer 504. Retry a few times.
 */
async function fetchWithRetry(url: string, tries = 10): Promise<Response> {
  let last: Response | undefined;

  for (let i = 0; i < tries; i++) {
    last = await fetch(url);
    if (last.ok) {
      return last;
    }
    await new Promise((resolve) => {
      setTimeout(resolve, 300);
    });
  }

  return last as Response;
}

describe('vite-plugin-external dev server', () => {
  it('dev: external 依赖被改写成优化依赖，裸 import 消失', async () => {
    const handle = await runScript(root, 'dev', 1);
    try {
      const res = await fetch(`${handle.baseUrl}/src/index.tsx`);
      expect(res.ok).toBe(true);
      const code = await res.text();

      // dev 下 external 走 stash + DepsOptimizer.registerMissingImport，
      // import 被改写成优化依赖路径（react-dom/client 经 flattenId 变成 react-dom_client）。
      expect(code).toMatch(/["']\/node_modules\/\.vite\/deps\/react\.js/);
      expect(code).toMatch(/["']\/node_modules\/\.vite\/deps\/react-dom_client\.js/);

      // 裸 import 必须消失，否则浏览器会去 node_modules 里找 react。
      expect(code).not.toMatch(/from ["']react["']/);
      expect(code).not.toMatch(/from ["']react-dom\/client["']/);
    }
    finally {
      await handle.close();
    }
  }, 60000);

  it('dev: 优化依赖可被取到，内容来自 stash shim', async () => {
    const handle = await runScript(root, 'dev', 1);
    try {
      const entry = await fetch(`${handle.baseUrl}/src/index.tsx`);
      expect(entry.ok).toBe(true);
      const code = await entry.text();

      const depPath = /["'](\/node_modules\/\.vite\/deps\/react\.js[^"']*)["']/.exec(code)?.[1];
      expect(depPath, 'src/index.ts 里应出现 react 的优化依赖路径').toBeTruthy();

      const dep = await fetchWithRetry(`${handle.baseUrl}${depPath}`);
      expect(dep.ok).toBe(true);
      const depCode = await dep.text();

      // stash 只有一行 module.exports = React，包装后应当只是"对全局 React 的引用"，
      // 而不是 react 包的真实源码 —— 源码里必然带 Symbol.for("react.element")。
      expect(depCode).toContain('React');
      expect(depCode).not.toContain('Symbol.for("react.element")');
    }
    finally {
      await handle.close();
    }
  }, 60000);

  it('dev: stash 文件按 flattenId 落盘，内容指向对应全局变量', async () => {
    const handle = await runScript(root, 'dev', 1);
    try {
      // 请求入口以触发解析与 stash 写入。
      const entry = await fetch(`${handle.baseUrl}/src/index.tsx`);
      expect(entry.ok).toBe(true);

      // react-dom/client 被拍平成 react-dom_client.js（flattenId：'/' → '_'）。
      const reactStash = join(stashDir, 'react.js');
      const domStash = join(stashDir, 'react-dom_client.js');

      expect(existsSync(reactStash)).toBe(true);
      expect(existsSync(domStash)).toBe(true);
      expect(readFileSync(reactStash, 'utf-8')).toBe('module.exports = React;');
      expect(readFileSync(domStash, 'utf-8')).toBe('module.exports = ReactDOM;');
    }
    finally {
      await handle.close();
    }
  }, 60000);
});

describe('vite-plugin-external dev server — CDN externals (config 7)', () => {
  it('dev: 模块解析后 HTML 注入 CDN 的 modulepreload 预取标签', async () => {
    const handle = await runScript(root, 'dev', 7);
    try {
      // transformIndexHtml 遍历的是 stashMap，而 stashMap 只有在模块被解析、external
      // 被判定之后才会非空；浏览器首屏请求 HTML 通常早于模块解析。
      // 这里先解析一次模块，再取 HTML，验证注入机制本身是有效的。
      const warmup = await fetch(`${handle.baseUrl}/src/index.tsx`);
      expect(warmup.ok).toBe(true);

      const res = await fetch(`${handle.baseUrl}/`);
      expect(res.ok).toBe(true);
      const html = await res.text();

      // 关键：必须在**同一个 link 标签**里同时出现 modulepreload 与 CDN 地址。
      // 拆成「有 modulepreload」+「有 URL」两条独立断言时，标签 href 写错也照样通过。
      expect(html).toMatch(/<link[^>]*modulepreload[^>]*esm\.sh\/react@18\.3\.1[^>]*>/);
      expect(html).toMatch(/<link[^>]*modulepreload[^>]*esm\.sh\/react-dom@18\.3\.1[^>]*>/);
    }
    finally {
      await handle.close();
    }
  }, 60000);

  it('dev: CDN external 的优化依赖内容指向 CDN 地址', async () => {
    const handle = await runScript(root, 'dev', 7);
    try {
      const entry = await fetch(`${handle.baseUrl}/src/index.tsx`);
      expect(entry.ok).toBe(true);
      const code = await entry.text();

      const depPath = /["'](\/node_modules\/\.vite\/deps\/react\.js[^"']*)["']/.exec(code)?.[1];
      expect(depPath, '入口里应出现 react 的优化依赖路径').toBeTruthy();

      const dep = await fetchWithRetry(`${handle.baseUrl}${depPath}`);
      expect(dep.ok).toBe(true);
      const depCode = await dep.text();

      // CDN 形态的 stash 内容是从 esm.sh 重导出，产物里必须还留着 CDN 地址。
      expect(depCode).toContain('https://esm.sh/react@18.3.1');
    }
    finally {
      await handle.close();
    }
  }, 60000);
});

/**
 * 起一个 dev server 跑用例，结束后无论成败都关掉。
 * Starts a dev server for the case and always shuts it down afterwards.
 */
async function withDev(n: number, fn: (baseUrl: string) => Promise<void>): Promise<void> {
  const handle = await runScript(root, 'dev', n);
  try {
    await fn(handle.baseUrl);
  }
  finally {
    await handle.close();
  }
}

describe('vite-plugin-external dev server — 其余含 React / Vue 的配置', () => {
  it('dev: config 2 — 函数形态 externals：@scope/* 与 react 分支都走优化依赖', async () => {
    await withDev(2, async (baseUrl) => {
      // lib.entry 在 dev 下不生效，必须显式请求这个入口才会解析到 @scope/* 分支。
      const res = await fetch(`${baseUrl}/src/index-scoped.tsx`);
      expect(res.ok).toBe(true);
      const code = await res.text();

      // @scope/foo 未安装也无所谓：external 之后走 stash，不读 node_modules。
      // flattenId 把 '@scope/foo' 拍成 '@scope_foo'，deps 文件名是精确的。
      expect(code).toMatch(/["']\/node_modules\/\.vite\/deps\/@scope_foo\.js/);
      // 裸 import 必须消失（否则浏览器会去 node_modules 找这个未安装的包）。
      expect(code).not.toMatch(/from ["']@scope\/foo["']/);
      // 函数里的 react 分支同样外部化。
      expect(code).toMatch(/["']\/node_modules\/\.vite\/deps\/react\.js/);
    });
  }, 60000);

  it('dev: config 4 — development 模式覆盖：stash 指向 React 而不是 production 的 $linkdesign.React', async () => {
    await withDev(4, async (baseUrl) => {
      const res = await fetch(`${baseUrl}/src/index.tsx`);
      expect(res.ok).toBe(true);

      // dev 默认 mode=development，用的是 development 覆盖块里的 React；
      // 若误用了 production 的 $linkdesign.React，这里就会对不上。
      const stash = join(root, 'node_modules/.vite_external/react.js');
      expect(existsSync(stash)).toBe(true);
      expect(readFileSync(stash, 'utf-8')).toBe('module.exports = React;');
    });
  }, 60000);

  it('dev: config 5 — interop auto：dev 下 external 仍走优化依赖', async () => {
    await withDev(5, async (baseUrl) => {
      const res = await fetch(`${baseUrl}/src/index.tsx`);
      expect(res.ok).toBe(true);
      const code = await res.text();

      expect(code).toMatch(/["']\/node_modules\/\.vite\/deps\/react\.js/);
      expect(code).not.toMatch(/from ["']react["']/);

      const stash = join(root, 'node_modules/.vite_external/react.js');
      expect(readFileSync(stash, 'utf-8')).toBe('module.exports = React;');
    });
  }, 60000);

  it('dev: config 9 — vue 被外部化为 Vue 全局变量', async () => {
    await withDev(9, async (baseUrl) => {
      // lib.entry 在 dev 下不生效，显式请求 vue 入口才会解析到 vue。
      const res = await fetch(`${baseUrl}/src/vue-app.ts`);
      expect(res.ok).toBe(true);
      const code = await res.text();

      expect(code).toMatch(/["']\/node_modules\/\.vite\/deps\/vue\.js/);
      expect(code).not.toMatch(/from ["']vue["']/);

      const stash = join(root, 'node_modules/.vite_external/vue.js');
      expect(existsSync(stash)).toBe(true);
      expect(readFileSync(stash, 'utf-8')).toBe('module.exports = Vue;');
    });
  }, 60000);

  it('dev: config 11 — 自定义 cacheDir 不改变 external 行为（不同输入 → 相同结果）', async () => {
    await withDev(11, async (baseUrl) => {
      const res = await fetch(`${baseUrl}/src/index.tsx`);
      expect(res.ok).toBe(true);
      const code = await res.text();

      // 与默认 cacheDir（config 1）对照：入口改写结果必须一致。
      // cacheDir 只决定 stash 落点，不参与判定，结果不该有差异。
      expect(code).toMatch(/["']\/node_modules\/\.vite\/deps\/react\.js/);
      expect(code).not.toMatch(/from ["']react["']/);

      // stash 换了落点，内容与默认 cacheDir 下完全相同。
      // cacheDir: '.external-cache' 是相对路径，归一到 node_modules/ 下。
      expect(readFileSync(join(root, 'node_modules/.external-cache/react.js'), 'utf-8'))
        .toBe('module.exports = React;');
    });
  }, 60000);

  it('dev: config 13 — lib.formats umd：dev 行为不受输出格式影响', async () => {
    await withDev(13, async (baseUrl) => {
      const res = await fetch(`${baseUrl}/src/index.tsx`);
      expect(res.ok).toBe(true);
      const code = await res.text();

      expect(code).toMatch(/["']\/node_modules\/\.vite\/deps\/react\.js/);
      expect(code).not.toMatch(/from ["']react["']/);
    });
  }, 60000);

  it('dev: config 14 — 纯 external：不进包、不留优化依赖，同批预构建照常完成', async () => {
    await withDev(14, async (baseUrl) => {
      // src/lib.ts 真实引用了 lodash / dayjs / @babel/core。
      // dev 入口是 index.html，所以先请求这个业务模块，触发依赖解析与预构建。
      const res = await fetch(`${baseUrl}/src/lib.ts`);
      expect(res.ok).toBe(true);
      const code = await res.text();

      // 纯 external：lodash 的 import 被剥离，也不产生优化依赖产物
      // （external 的依赖本就不该有产物；浏览器原生 ESM 也无法解析裸 import，
      //  运行时需要由宿主以别的方式提供）。
      expect(code).not.toMatch(/from ["']lodash["']/);
      expect(code).not.toMatch(/deps\/lodash/);
      // 关键区分：上面两条在「lodash 被正常内联」时同样成立（内联后既没有裸 import
      // 也没有 deps 路径），必须断言源码标记不存在，才能真正证明它没被打包。
      expect(code).not.toContain('.VERSION');

      // 对照：同一个模块图里未被 external 的 dayjs 走正常预构建 → 有优化依赖产物。
      // 两者能同时成立，说明预构建阶段顺利跑过——纯 external 的转换 shim 也在这条
      // 预构建链路上（shim 缺失时预构建会直接解析失败，dev 起不来）。
      const dep = await fetchWithRetry(`${baseUrl}/node_modules/.vite/deps/dayjs.js`);
      expect(dep.ok).toBe(true);
    });
  }, 60000);
});
