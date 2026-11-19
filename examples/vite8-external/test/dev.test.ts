import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { runScript } from '../../shared/example-testkit';

const root = join(__dirname, '..');
/**
 * 每个 config 有自己的 stash 目录（见 vite.config.N.mts 的 cacheDir），互不覆盖。
 * 用例之间**不清理任何缓存**：串行跑时缓存原地保留，等价于真实项目里"改了配置重启
 * dev"，让插件自己的 cleanupCache 剪枝链决定第二次启动拿到什么。
 */
const stashDir = (n: number) => join(root, 'node_modules/.vite_external', String(n));

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

/**
 * 起一个 dev server 跑用例。服务起来后的第一件事就是取首页：
 * 200 + 本 config 传给 view() 的 title（每个 config 的 title 都带自己的编号，
 * 所以它同时证明页面确实是这个 config 渲染出来的，而不是默认的 index.html）。
 * 页面都打不开时，后面的模块改写断言再绿也只说明"编译期没打包"，不说明示例跑得起来。
 */
async function withDev(
  n: number,
  fn: (baseUrl: string, page: string, startedAt: number) => Promise<void>
): Promise<void> {
  // 起进程之前的时刻：用例要拿它证明"这个文件是本次启动写的"，而不是上一轮留下的。
  const startedAt = Date.now();
  const handle = await runScript(root, 'dev', n);
  try {
    const res = await fetch(`${handle.baseUrl}/`);
    expect(res.status, `config ${n} 的首页应返回 200`).toBe(200);
    const page = await res.text();
    // 锁整个 title 标签而不是子串：'vite-plugin-external example 1' 是 11/13/14/15
    // 那个 title 的前缀，只断言子串时拿错 config 的页面也照样绿。
    expect(page, `config ${n} 的首页应带 engineOptions 里那个 title`)
      .toContain(`<title>vite-plugin-external example ${n}</title>`);

    await fn(handle.baseUrl, page, startedAt);
  }
  finally {
    await handle.close();
  }
}

/** 名单是否已含全部模块名；提到循环外，免得闭包捕获轮询中的可变快照。 */
function hasAllNames(record: Record<string, unknown>, names: string[]): boolean {
  return names.every((name) => name in record);
}

/**
 * `_metadata.json` 是下一次 dev 启动时 cleanupCache 剪枝 Vite deps 缓存的唯一线索：
 * 名单没落盘，上次被 external 掉的依赖就会以旧优化产物继续被复用。
 *
 * 写入绑在 stash() 产出条目之后的防抖 flush（预构建 buildEnd 再兜一次），两者都晚于
 * HTTP 响应，所以只能轮询等名单写全。本示例的用例之间不清缓存，磁盘上永远躺着上一轮的
 * 同名文件，因此除了名单内容还要比 mtime：必须晚于本次 dev 进程启动的时刻，
 * 否则"没人写盘"也能拿旧文件糊过去。
 *
 * 读盘的两条瞬态都归入"还没写好"、继续等，不许把它们变成崩测试的异常：
 *   - 文件还不存在（ENOENT）；
 *   - 整份快照正在被覆盖，读到半截 JSON。
 * 预算耗尽时用 expect.fail 报出最后一次看到的真实状态（mtime 新/旧、已有哪些键、
 * 读盘错误），红一次就能直接判读是"没写盘"还是"名单缺项"。
 */
async function expectMetadataWritten(
  cacheDir: string,
  startedAt: number,
  names: string[],
  timeoutMs = 2000,
): Promise<void> {
  const file = join(cacheDir, '_metadata.json');
  const deadline = Date.now() + timeoutMs;
  let readError = '';
  let mtimeMs = 0;
  let externalized: Record<string, unknown> = {};

  for (;;) {
    readError = '';
    try {
      mtimeMs = statSync(file).mtimeMs;
      const parsed = JSON.parse(
        readFileSync(file, 'utf-8'),
      ) as { externalized?: Record<string, unknown> };
      externalized = parsed.externalized ?? {};
    }
    catch (err) {
      readError = (err as Error).message;
    }

    if (!readError && mtimeMs > startedAt && hasAllNames(externalized, names)) {
      return;
    }

    if (Date.now() >= deadline) {
      const byOthers = mtimeMs > startedAt ? '本轮写的' : '早于本轮启动，属上一轮残留';
      const keys = Object.keys(externalized).join(',') || '无';
      expect.fail(
        readError
          ? `${file} 在 ${timeoutMs}ms 内读不出内容，最后错误：${readError}`
          : `${file} 应由本次 dev 启动写全 ${names.join(',')}；`
            + `${timeoutMs}ms 内未达成，最后状态：mtime=${mtimeMs}（${byOthers}），已有键=${keys}`,
      );
    }

    await new Promise((resolve) => {
      setTimeout(resolve, 100);
    });
  }
}

// dev 用例每次都要拉起一个 vite 子进程并等依赖预构建，默认 5000ms 远不够；
// 统一在 suite 级兜底，个别更重的用例仍用自带的 it 级超时覆盖。
describe('vite-plugin-external dev server', { timeout: 120000 }, () => {
  it('dev: external 依赖被改写成优化依赖，裸 import 消失', async () => {
    await withDev(1, async (baseUrl, page) => {
      // 页面挂的 UMD 就是 externals 里那两个全局名的来源，地址和入口都要对得上。
      expect(page).toContain('src="https://unpkg.com/umd-react/dist/react.development.js"');
      expect(page).toContain('src="https://unpkg.com/umd-react/dist/react-dom.development.js"');
      expect(page).toContain('src="/src/index.tsx"');

      const res = await fetch(`${baseUrl}/src/index.tsx`);
      expect(res.ok).toBe(true);
      const code = await res.text();

      // dev 下 external 走 stash + DepsOptimizer.registerMissingImport，
      // import 被改写成优化依赖路径（react-dom/client 经 flattenId 变成 react-dom_client）。
      expect(code).toMatch(/["']\/node_modules\/\.vite\/deps\/react\.js/);
      expect(code).toMatch(/["']\/node_modules\/\.vite\/deps\/react-dom_client\.js/);

      // 裸 import 必须消失，否则浏览器会去 node_modules 里找 react。
      expect(code).not.toMatch(/from ["']react["']/);
      expect(code).not.toMatch(/from ["']react-dom\/client["']/);
    });
  }, 120000);

  it('dev: 优化依赖可被取到，内容来自 stash shim', async () => {
    await withDev(1, async (baseUrl) => {
      const entry = await fetch(`${baseUrl}/src/index.tsx`);
      expect(entry.ok).toBe(true);
      const code = await entry.text();

      const depPath = /["'](\/node_modules\/\.vite\/deps\/react\.js[^"']*)["']/.exec(code)?.[1];
      expect(depPath, 'src/index.ts 里应出现 react 的优化依赖路径').toBeTruthy();

      const dep = await fetchWithRetry(`${baseUrl}${depPath}`);
      expect(dep.ok).toBe(true);
      const depCode = await dep.text();

      // stash 只有一行 module.exports = React，包装后应当只是"对全局 React 的引用"，
      // 而不是 react 包的真实源码 —— 源码里必然带 Symbol.for("react.element")。
      // 正向断言取 HTTP 实测到的优化依赖原文：注释头指明来源是本 config 的 stash 文件，
      // 函数体逐字等于 shim，最外层是 CJS→ESM 的 default 包装。
      expect(depCode).toMatch(/\/\/\s*\S*\.vite_external\/1\/react\.js/);
      expect(depCode).toContain('module.exports = React;');
      // 只断言"shim 被 CJS→ESM interop 包成 default 导出"这一契约，
      // 不写死 vite 内部生成的 require_xxx 变量名（那属于 vite 的实现细节）。
      expect(depCode).toMatch(/export default\s+\w+\(\);/);
      expect(depCode).not.toContain('Symbol.for("react.element")');
    });
  }, 120000);

  it('dev: stash 文件按 flattenId 落盘，内容指向对应全局变量', async () => {
    await withDev(1, async (baseUrl, page, startedAt) => {
      // 请求入口以触发解析与 stash 写入。
      const entry = await fetch(`${baseUrl}/src/index.tsx`);
      expect(entry.ok).toBe(true);

      // react-dom/client 被拍平成 react-dom_client.js（flattenId：'/' → '_'）。
      const reactStash = join(stashDir(1), 'react.js');
      const domStash = join(stashDir(1), 'react-dom_client.js');

      expect(existsSync(reactStash)).toBe(true);
      expect(existsSync(domStash)).toBe(true);
      expect(readFileSync(reactStash, 'utf-8')).toBe('module.exports = React;');
      expect(readFileSync(domStash, 'utf-8')).toBe('module.exports = ReactDOM;');

      // shim 落盘的同时，模块名也要进 metadata 名单，否则下次启动无从剪掉这些优化依赖。
      await expectMetadataWritten(stashDir(1), startedAt, ['react', 'react-dom/client']);
    });
  });
});

describe('vite-plugin-external dev server — CDN externals (config 7)', { timeout: 120000 }, () => {
  /*
   * transformIndexHtml 整个钩子只在 build 执行（dev 拿不到完整的 stashMap），
   * 所以 dev 页面既没有 import map 也没有本插件注入的 modulepreload：
   * 地址写在优化依赖产物的重导出语句里，浏览器顺着模块链自己取，不需要页面预取。
   * 两个时刻各取一次首页 —— 依赖解析前 stashMap 本来就是空的，只测第一页会让
   * 「dev 不注入」这条断言假绿。
   */
  it('dev: 页面不被注入表与预取标签，模块仍走优化依赖', async () => {
    await withDev(7, async (baseUrl, page, startedAt) => {
      expect(page).toContain('src="/src/index.tsx"');
      // cdnScripts 留空：react 由优化依赖的重导出提供，页面再挂一份就是取两次。
      expect(page).not.toContain('<script src="https://esm.sh');

      const warmup = await fetch(`${baseUrl}/src/index.tsx`);
      expect(warmup.ok).toBe(true);
      const code = await warmup.text();

      // CDN 形态不改解析路线：仍是 stash shim → 优化依赖产物
      // （react-dom/client 经 flattenId 变成 react-dom_client）。
      expect(code).toMatch(/["']\/node_modules\/\.vite\/deps\/react\.js/);
      expect(code).toMatch(/["']\/node_modules\/\.vite\/deps\/react-dom_client\.js/);
      expect(code).not.toMatch(/from ["']react["']/);
      expect(code).not.toMatch(/from ["']react-dom\/client["']/);

      const res = await fetch(`${baseUrl}/`);
      expect(res.ok).toBe(true);
      const html = await res.text();

      expect(html, 'dev 不该有 import map（开关只作用于 build）').not.toContain('type="importmap"');
      expect(html, 'dev 不该有本插件注入的 modulepreload').not.toMatch(/<link[^>]*rel="modulepreload"/);
      expect(html).not.toContain('<script src="https://esm.sh');

      // CDN 形态的 external 同样要进 metadata 名单（下次启动靠它剪 deps）。
      await expectMetadataWritten(stashDir(7), startedAt, ['react', 'react-dom/client']);
    });
  });

  it('dev: CDN external 的优化依赖内容指向 CDN 地址', async () => {
    await withDev(7, async (baseUrl) => {
      const entry = await fetch(`${baseUrl}/src/index.tsx`);
      expect(entry.ok).toBe(true);
      const code = await entry.text();

      const depPath = /["'](\/node_modules\/\.vite\/deps\/react\.js[^"']*)["']/.exec(code)?.[1];
      expect(depPath, '入口里应出现 react 的优化依赖路径').toBeTruthy();

      const dep = await fetchWithRetry(`${baseUrl}${depPath}`);
      expect(dep.ok).toBe(true);
      const depCode = await dep.text();

      // CDN 形态的 stash 内容是从 esm.sh 重导出，产物里必须还留着 CDN 地址。
      expect(depCode).toContain('https://esm.sh/react@19.3.1');
    });
  });
});

describe('vite-plugin-external dev server — 其余配置', { timeout: 120000 }, () => {
  it('dev: config 2 — 函数形态 externals：@scope/* 与 react 分支都走优化依赖', async () => {
    await withDev(2, async (baseUrl, page, startedAt) => {
      // 页面挂的 umd-react 提供 React / ReactDOM；@scope/foo → ScopeFoo 是虚构全局，
      // 没有任何 CDN 能提供（见 config 2 注释），所以本 config 只挂这两个。
      expect(page).toContain('src="https://unpkg.com/umd-react/dist/react.development.js"');
      expect(page).toContain('src="https://unpkg.com/umd-react/dist/react-dom.development.js"');
      expect(page).toContain('src="/src/index-scoped.tsx"');

      // 首页入口就是 src/index-scoped.tsx，取首页时两个分支都已被解析；
      // 这里再直接请求一次拿改写原文。
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

      // 函数形态判出的名字（含未安装的 @scope/foo）也要写进名单。
      await expectMetadataWritten(stashDir(2), startedAt, ['react', '@scope/foo', 'react-dom/client']);
    });
  });

  it('dev: config 3 — externalizeDeps 在 dev 也生效：改写成 /@id/，靠 import map 取 CDN', async () => {
    await withDev(3, async (baseUrl, page) => {
      const deps = ['lodash', 'dayjs', '@babel/core'];

      // 纯 external 不给全局名也不给 CDN，页面只有靠 import map 才知道去哪取模块。
      // 断言整段脚本而不是某个子串：少 {"imports":…} 这层外壳时浏览器把表当空的，
      // 页面照样 200，只有结构能证明这张表真的生效。
      expect(page).toContain('<script type="importmap">{"imports":{');
      for (const dep of deps) {
        expect(page, `import map 应把 /@id/${dep} 指向 CDN 地址`)
          .toContain(`"/@id/${dep}":"https://esm.sh/${dep}@`);
      }

      // 表里的 CDN 地址同时挂 modulepreload，且必须带 crossorigin：
      // 缺了它预取走 no-cors，模块请求要 CORS，两边对不上就是白取一遍（浏览器实测告警）。
      for (const dep of deps) {
        expect(page, `${dep} 的 CDN 地址应有 modulepreload`).toMatch(
          new RegExp(`<link rel="modulepreload" crossorigin href="https://esm\\.sh/${dep}@[^"]*">`),
        );
      }
      expect(page).toContain('src="/src/lib2.ts"');

      // 实测（HTTP 原文，非推断）：externalizeDeps 摘掉 command 门控后，dev 下三个依赖
      // 都被 vite 的 import-analysis 包成 /@id/<说明符>，既不再指向优化依赖产物，
      // 也没有被内联进业务模块。
      const res = await fetch(`${baseUrl}/src/lib2.ts`);
      expect(res.ok).toBe(true);
      const code = await res.text();

      for (const dep of deps) {
        expect(code, `import 应改写成 "/@id/${dep}"`).toContain(`"/@id/${dep}"`);
        // 反向：vite 正常预打包的产物路径不得出现，出现即说明这个依赖仍被打包了。
        expect(code).not.toMatch(new RegExp(`["']\\/node_modules\\/\\.vite\\/deps\\/${dep.replace('/', '_')}\\.js`));
      }
      expect(code).not.toMatch(/from ["']lodash["']/);
      expect(code).not.toMatch(/from ["']dayjs["']/);
      expect(code).not.toMatch(/from ["']@babel\/core["']/);
      // 整包 lodash 的私有符号不得出现在业务模块里（内联即等于没 external）。
      expect(code).not.toContain('__lodash_hash_undefined__');

      // 反向证据：/@id/<说明符> 本身在 dev server 上取不到（unwrapId 之后没人能处理它），
      // 这正是"必须靠 import map"这条链的成立前提，也证明插件没偷偷写 shim 顶替。
      for (const dep of deps) {
        const external = await fetch(`${baseUrl}/@id/${dep}`);
        expect(external.status, `/@id/${dep} 不应由 dev server 提供`).toBe(404);
      }

      // 纯 external 不生成 shim：本 config 的 stash 目录里不该有这三个文件。
      for (const dep of deps) {
        expect(existsSync(join(stashDir(3), `${dep.replace('/', '_')}.js`)), `${dep} 不该被 stash 成 shim`).toBe(false);
      }
    });
  });

  it('dev: config 4 — unpkg React 16.12 dev CDN，stash 指向 React / ReactDOM', async () => {
    await withDev(4, async (baseUrl, page, startedAt) => {
      // config 4 的入口是 index-legacy.tsx（React 16.12 写法，ReactDOM.render）
      const res = await fetch(`${baseUrl}/src/index-legacy.tsx`);
      expect(res.ok).toBe(true);

      // dev 走配置函数的 serve 分支：unpkg 上钉住 16.12.0 的 UMD development，
      // 与 build 的 linkdesign 同为 React 16.12，只是全局名换成 React / ReactDOM。
      expect(page).toContain('src="https://unpkg.com/react@16.12.0/umd/react.development.js"');
      expect(page).toContain('src="https://unpkg.com/react-dom@16.12.0/umd/react-dom.development.js"');
      expect(page).toContain('src="/src/index-legacy.tsx"');

      // dev 的全局名是 React / ReactDOM，两个 stash 都要指向对应全局（不是 $linkdesign.*）。
      const reactStash = join(stashDir(4), 'react.js');
      const domStash = join(stashDir(4), 'react-dom.js');
      expect(existsSync(reactStash)).toBe(true);
      expect(existsSync(domStash)).toBe(true);
      expect(readFileSync(reactStash, 'utf-8')).toBe('module.exports = React;');
      expect(readFileSync(domStash, 'utf-8')).toBe('module.exports = ReactDOM;');

      await expectMetadataWritten(stashDir(4), startedAt, ['react', 'react-dom']);
    });
  });

  it('dev: config 5 — interop auto：dev 下 external 仍走优化依赖', async () => {
    await withDev(5, async (baseUrl, page, startedAt) => {
      expect(page).toContain('src="https://unpkg.com/umd-react/dist/react.development.js"');
      expect(page).toContain('src="https://unpkg.com/umd-react/dist/react-dom.development.js"');
      expect(page).toContain('src="/src/index.tsx"');

      const res = await fetch(`${baseUrl}/src/index.tsx`);
      expect(res.ok).toBe(true);
      const code = await res.text();

      expect(code).toMatch(/["']\/node_modules\/\.vite\/deps\/react\.js/);
      expect(code).not.toMatch(/from ["']react["']/);

      const stash = join(stashDir(5), 'react.js');
      expect(readFileSync(stash, 'utf-8')).toBe('module.exports = React;');

      await expectMetadataWritten(stashDir(5), startedAt, ['react', 'react-dom/client']);
    });
  });

  it('dev: config 9 — vue 被外部化为 Vue 全局变量', async () => {
    await withDev(9, async (baseUrl, page, startedAt) => {
      // vue 被外部化成全局 Vue，唯一的来源就是页面里这个 CDN；
      // 只请求模块 URL 发现不了"整个示例在浏览器里跑不起来"。
      expect(page).toContain('src="https://unpkg.com/vue@3/dist/vue.global.js"');
      expect(page).toContain('src="/src/vue-app.ts"');

      const res = await fetch(`${baseUrl}/src/vue-app.ts`);
      expect(res.ok).toBe(true);
      const code = await res.text();

      expect(code).toMatch(/["']\/node_modules\/\.vite\/deps\/vue\.js/);
      expect(code).not.toMatch(/from ["']vue["']/);
      // 入口必须真的挂 SFC（而不是在 ts 里用 h() 手搓组件），否则下面的 .vue 请求是孤立请求。
      expect(code).toMatch(/import\s+\w+\s+from\s+["']\/src\/VueApp\.vue["']/);

      // SFC 里的 vue import（<script setup>）同样被改写成优化依赖：
      // 这是 @vitejs/plugin-vue 编译结果再过 external 转换的路径。
      const sfc = await fetchWithRetry(`${baseUrl}/src/VueApp.vue`);
      expect(sfc.ok).toBe(true);
      const sfcCode = await sfc.text();
      expect(sfcCode).toMatch(/["']\/node_modules\/\.vite\/deps\/vue\.js/);
      expect(sfcCode).not.toMatch(/from ["']vue["']/);

      const stash = join(stashDir(9), 'vue.js');
      expect(existsSync(stash)).toBe(true);
      expect(readFileSync(stash, 'utf-8')).toBe('module.exports = Vue;');
      await expectMetadataWritten(stashDir(9), startedAt, ['vue']);
    });
  });

  it('dev: config 6 — Vue JSX 编译链下 vue 仍外部化', async () => {
    await withDev(6, async (baseUrl, page, startedAt) => {
      // 全局 Vue 只能来自页面里的 CDN 构建；入口必须是 jsx 应用，
      // 否则 createVNode 那组断言校验的是没在页面上跑的那份代码。
      expect(page).toContain('src="https://unpkg.com/vue@3/dist/vue.global.js"');
      expect(page).toContain('src="/src/vue-jsx-app.tsx"');

      const res = await fetchWithRetry(`${baseUrl}/src/vue-jsx-app.tsx`);
      expect(res.ok).toBe(true);
      const code = await res.text();

      expect(code).toMatch(/["']\/node_modules\/\.vite\/deps\/vue\.js/);
      expect(code).not.toMatch(/from ["']vue["']/);
      // JSX 由 vue-jsx 插件编译：产物里是 Vue 的 createVNode，不是 React 自动运行时的 jsx()
      expect(code).toMatch(/createVNode/);
      expect(code).not.toContain('react/jsx-runtime');

      expect(readFileSync(join(stashDir(6), 'vue.js'), 'utf-8')).toBe('module.exports = Vue;');
      await expectMetadataWritten(stashDir(6), startedAt, ['vue']);
    });
  }, 60000);

  it('dev: config 11 — 自定义 cacheDir 不改变 external 行为（不同输入 → 相同结果）', async () => {
    await withDev(11, async (baseUrl, page, startedAt) => {
      // 与 config 1 同样的 CDN + 入口：cacheDir 只挪 stash 落点，不影响页面。
      expect(page).toContain('src="https://unpkg.com/umd-react/dist/react.development.js"');
      expect(page).toContain('src="https://unpkg.com/umd-react/dist/react-dom.development.js"');
      expect(page).toContain('src="/src/index.tsx"');

      const res = await fetch(`${baseUrl}/src/index.tsx`);
      expect(res.ok).toBe(true);
      const code = await res.text();

      // 与 config 1（另一个 cacheDir）对照：入口改写结果必须一致。
      // cacheDir 只决定 stash 落点，不参与判定，结果不该有差异。
      expect(code).toMatch(/["']\/node_modules\/\.vite\/deps\/react\.js/);
      expect(code).not.toMatch(/from ["']react["']/);

      // stash 换了落点，内容与其它 cacheDir 下完全相同。
      // cacheDir: './node_modules/.external-cache' 是相对路径，归一到 cwd（本示例根）下。
      expect(readFileSync(join(root, 'node_modules/.external-cache/react.js'), 'utf-8'))
        .toBe('module.exports = React;');

      // 换了 cacheDir，metadata 名单也落在这个自定义目录里。
      await expectMetadataWritten(join(root, 'node_modules/.external-cache'), startedAt, ['react', 'react-dom/client']);
    });
  }, 60000);

  it('dev: config 13 — lib.formats umd：dev 行为不受输出格式影响', async () => {
    await withDev(13, async (baseUrl, page, startedAt) => {
      // umd 只影响 build 的输出格式；dev 页面照样靠 umd-react 提供全局。
      expect(page).toContain('src="https://unpkg.com/umd-react/dist/react.development.js"');
      expect(page).toContain('src="https://unpkg.com/umd-react/dist/react-dom.development.js"');
      expect(page).toContain('src="/src/index.tsx"');

      const res = await fetch(`${baseUrl}/src/index.tsx`);
      expect(res.ok).toBe(true);
      const code = await res.text();

      expect(code).toMatch(/["']\/node_modules\/\.vite\/deps\/react\.js/);
      expect(code).not.toMatch(/from ["']react["']/);

      await expectMetadataWritten(stashDir(13), startedAt, ['react', 'react-dom/client']);
    });
  });

  it('dev: config 14 — 纯 external：不进包、不留优化依赖，同批预构建照常完成', async () => {
    await withDev(14, async (baseUrl, page) => {
      // cdnScripts 留空：纯 external 的依赖交给宿主（Node）运行时提供，浏览器侧
      // 挂任何 CDN 都只会掩盖"这个示例其实跑不起来"，所以模板一个 CDN 都不该输出。
      expect(page).not.toContain('crossorigin');
      expect(page).toContain('src="/src/lib.ts"');

      // src/lib.ts 真实引用了 lodash / dayjs / @babel/core。
      // 直接请求这个业务模块：vite 发现裸说明符不在已优化列表里，会走
      // registerMissingImport 再跑一轮预构建，判定就发生在这一轮。
      const res = await fetch(`${baseUrl}/src/lib.ts`);
      expect(res.ok).toBe(true);
      const code = await res.text();

      // 纯 external：lodash 的 import 被改写成 /@id/lodash（交给宿主解析），
      // 既不产生裸 import，也不产生优化依赖产物。
      expect(code).toMatch(/from\s+["']\/@id\/lodash["']/);
      expect(code).not.toMatch(/from ["']lodash["']/);
      expect(code).not.toMatch(/deps\/lodash/);
      // 关键区分：上面两条在「lodash 被正常内联」时同样成立（内联后既没有裸 import
      // 也没有 deps 路径），必须断言源码标记不存在，才能真正证明它没被打包。
      expect(code).not.toContain('.VERSION');

      // 对照：同一个模块图里未被 external 的 dayjs 走正常预构建 → 有优化依赖产物。
      // 两者能同时成立，说明这一轮预构建整体跑通了——纯 external 的转换 shim 就在这
      // 条链路上（shim 缺失时预构建会直接解析失败，dayjs 也拿不到）。
      const dep = await fetchWithRetry(`${baseUrl}/node_modules/.vite/deps/dayjs.js`);
      expect(dep.ok).toBe(true);
    });
  });

  it('dev: config 15 — 别的插件注入 optimizeDeps.include 时 externals 仍优先', async () => {
    await withDev(15, async (baseUrl, page, startedAt) => {
      // 入口必须是 /src/lib2.ts：它是唯一不 import react 的模块，"react 只可能来自
      // 注入的 include"这个前提靠页面不挂 index.tsx 来保住。CDN 同样一个都不挂。
      expect(page).not.toContain('crossorigin');
      expect(page).toContain('src="/src/lib2.ts"');
      expect(page).not.toContain('src="/src/index.tsx"');

      // 本示例没有任何源码 import react / react-dom，这两个优化依赖只可能来自
      // 内联插件注入的 include —— 也就是预打包的**入口模块**。
      // 说明符维度的判定看不到裸 'react'，能改写入口的只有入口维度拦截，
      // 所以断言 deps 内容就等价于验证「externals 压过 include」。
      const reactRes = await fetchWithRetry(`${baseUrl}/node_modules/.vite/deps/react.js`);
      expect(reactRes.ok).toBe(true);
      const reactCode = await reactRes.text();

      // 来源注释指向本 config 的 stash 文件，函数体逐字等于 shim。
      expect(reactCode).toMatch(/\/\/\s*\S*\.vite_external\/15\/react\.js/);
      expect(reactCode).toContain('module.exports = React;');
      // 反向：真实 react 源码没被打进来（量级上限 + 源码标记各一道）。
      expect(reactCode.length).toBeLessThan(4096);
      expect(reactCode).not.toContain('Symbol.for("react.element")');

      const domRes = await fetchWithRetry(`${baseUrl}/node_modules/.vite/deps/react-dom.js`);
      expect(domRes.ok).toBe(true);
      const domCode = await domRes.text();

      expect(domCode).toMatch(/\/\/\s*\S*\.vite_external\/15\/react-dom\.js/);
      expect(domCode).toContain('module.exports = ReactDOM;');
      // 真打进来必然带 createRoot 的实现；shim 只会引用全局变量。
      expect(domCode).not.toContain('createRoot');
      expect(domCode.length).toBeLessThan(4096);

      // stash 文件确实落盘在 config 15 自己的 cacheDir 下。
      expect(readFileSync(join(stashDir(15), 'react.js'), 'utf-8')).toBe('module.exports = React;');
      expect(readFileSync(join(stashDir(15), 'react-dom.js'), 'utf-8')).toBe('module.exports = ReactDOM;');

      // 来自 optimizeDeps.include 的注入入口同样要记进名单，否则下次启动剪不掉它们。
      await expectMetadataWritten(stashDir(15), startedAt, ['react', 'react-dom']);
    });
  });
});

describe('vite-plugin-external dev server — importmap 开关 (config 16)', { timeout: 120000 }, () => {
  /*
   * 需求边界：importmap 开关只作用于 build，dev 一行不动；transformIndexHtml 整个
   * 钩子也只在 build 执行。dev 里可验收的"不动"有三层，逐层钉住：
   *   1. 模块地址仍指向优化依赖产物（stash shim 被预打包的那条老链路）；
   *   2. 顺着模块里那个地址用 HTTP 取回来的产物，内容就是从 CDN 重导出的两行，
   *      不是依赖源码 —— 走真实消费链路，而不是读磁盘上另一份同名文件；
   *   3. HTML 里既没有 <script type="importmap"> 也没有 modulepreload。
   * 首页只在服务起来后被请求一次是不够的：dev 的 stashMap 要等依赖解析完才有内容，
   * 所以第 3 层必须"解析前 + 解析后"各取一次首页，否则空 stashMap 会让用例假绿。
   */
  it('dev: 开关不改解析路线，HTML 也不被注入表与预取标签', async () => {
    await withDev(16, async (baseUrl, page, startedAt) => {
      const cdn: Record<string, string> = {
        lodash: 'https://esm.sh/lodash@4.18.1',
        dayjs: 'https://esm.sh/dayjs@1.11.23'
      };
      const deps = Object.keys(cdn);
      // 依赖源码的判别标记（从各自 node_modules 生产代码实测取得）：出现在产物里
      // 就说明这个依赖被真打包了，"外置"只停在了地址改写那一层。
      const markers: Record<string, string> = {
        lodash: '__lodash_hash_undefined__',
        dayjs: 'invalidDate'
      };

      expect(page).toContain('src="/src/importmap-app.ts"');
      // cdnScripts 留空：地址只该来自模块链，页面手写一份就是同一依赖取两次。
      expect(page).not.toContain('<script src="https://esm.sh');

      // —— 第 1 层：模块仍走优化依赖 ——
      const res = await fetchWithRetry(`${baseUrl}/src/importmap-app.ts`);
      expect(res.ok).toBe(true);
      const code = await res.text();

      const depPaths: Record<string, string> = {};
      for (const dep of deps) {
        const depPath = new RegExp(`["'](/node_modules/\\.vite/deps/${dep}\\.js[^"']*)["']`)
          .exec(code)?.[1];
        expect(depPath, `dev 下 '${dep}' 应指向优化依赖产物`).toBeTruthy();
        depPaths[dep] = depPath!;
        // 反向：既没被改写成 /@id/ 裸说明符，也没被留成裸名交给表去解析。
        expect(code).not.toContain(`"/@id/${dep}"`);
        expect(code).not.toMatch(new RegExp(`from "${dep}"`));
        // 依赖源码没被内联进业务模块。
        expect(code).not.toContain(markers[dep]);
      }

      // —— 第 2 层：HTTP 取回来的优化依赖就是 CDN 重导出 shim ——
      for (const dep of deps) {
        const depRes = await fetchWithRetry(`${baseUrl}${depPaths[dep]}`);
        expect(depRes.ok, `deps/${dep}.js 应能被真实请求到`).toBe(true);
        const optimized = await depRes.text();
        expect(optimized, `deps/${dep}.js 应从 ${cdn[dep]} 重导出`)
          .toContain(`export * from "${cdn[dep]}";`);
        // auto 模式的 default 走命名空间取值：目标没有 default 时是 undefined，
        // 不会因为 `export { default } from` 在加载期报错。
        expect(optimized, `${dep} 的 default 应由命名空间取值`).toContain('ns.default');
        expect(optimized, `${dep} 的源码不该被打进优化依赖`).not.toContain(markers[dep]);
      }

      // shim 本体落在本 config 自己的 cacheDir 下，内容是单引号形态的三行 auto shim。
      for (const dep of deps) {
        expect(readFileSync(join(stashDir(16), `${dep}.js`), 'utf-8')).toBe(
          `import * as ns from '${cdn[dep]}';\nexport default ns.default;\nexport * from '${cdn[dep]}';`
        );
      }

      // —— 第 3 层：首页两次都要没有表、没有预取标签 ——
      expect(page, '首次首页（依赖还没解析）不该带 importmap').not.toContain('type="importmap"');

      const afterResolve = await (await fetch(`${baseUrl}/`)).text();
      expect(afterResolve, '依赖解析完之后的首页仍不该带 importmap')
        .not.toContain('type="importmap"');
      expect(afterResolve, 'dev 不该有本插件注入的 modulepreload')
        .not.toMatch(/<link[^>]*rel="modulepreload"/);

      // CDN 形态的 external 同样要进 metadata 名单（下次启动靠它剪 deps）。
      await expectMetadataWritten(stashDir(16), startedAt, deps);
    });
  }, 120000);
});
