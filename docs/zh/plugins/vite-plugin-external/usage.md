# 使用示例

## 基础使用

vite.config.mjs
```js
import { defineConfig } from 'vite';
import pluginExternal from 'vite-plugin-external';

export default defineConfig({
  plugins: [
    pluginExternal({
      externals: {
        jquery: '$',
        react: 'React',
        'react-dom/client': 'ReactDOM',
        vue: 'Vue',
      },
    }),
  ],
  build: {
    rolldownOptions: {
      output: {
        format: 'iife',
      },
    },
  },
});
```

## 动态配置全局变量名

```js
import { defineConfig } from 'vite';
import pluginExternal from 'vite-plugin-external';

export default defineConfig({
  plugins: [
    pluginExternal({
      externals(libName) {
        if (libName === 'react') return 'React';
        if (libName === 'react-dom/client') return 'ReactDOM';
      },
    }),
  ],
  build: {
    rolldownOptions: {
      output: {
        format: 'iife',
      },
    },
  },
});
```

## 动态配置 ESM 格式 CDN

> 将指定的依赖替换为 CDN 资源，并在 build 时向 `index.html` 自动添加 `modulepreload` 链接标签，让浏览器在首屏就开始预取 CDN 模块。

```js
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import pluginExternal from 'vite-plugin-external';

export default defineConfig({
  plugins: [
    react({ jsxRuntime: 'classic' }),
    pluginExternal({
      externals(libName) {
        if (libName === 'react') return 'https://esm.sh/react@19.3.1';
        if (libName === 'react-dom/client') return 'https://esm.sh/react-dom@19.3.1/client';
      },
    }),
  ],
});
```

## 多模式场景配置

> 开发环境（unpkg UMD）和生产环境（自有 CDN）可能用不同的全局变量名/地址。用 `development` / `production` 两个字段作为模式 override，分别对应不同模式下的 `BasicOptions`（详见 [配置项：[mode: string] 索引签名](/zh/plugins/vite-plugin-external/options#mode-string-索引签名)）。

development 环境 `index.html`
```html
<script src="//unpkg.com/react@16.12.0/umd/react.development.js"></script>
<script src="//unpkg.com/react-dom@16.12.0/umd/react-dom.development.js"></script>
```

production 环境 `index.html`
```html
<script src="//g.alicdn.com/linkdesign/lib/1.0.1/~react.js"></script>
```

vite.config.mjs
```js
import { defineConfig } from 'vite';
import pluginExternal from 'vite-plugin-external';

export default defineConfig({
  plugins: [
    pluginExternal({
      // 生产模式默认使用自有 CDN 前缀（React 16.12，键写 react-dom）
      externals: {
        react: '$linkdesign.React',
        'react-dom': '$linkdesign.ReactDOM',
        'prop-types': '$linkdesign.PropTypes'
      },
      // 开发模式覆盖 externals，改用 unpkg UMD 的全局变量名
      development: {
        externals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'prop-types': 'PropTypes'
        },
      },
    }),
  ],
});
```

## 调整打包策略

> `interop: 'auto'` 的作用是让构建阶段的 config 钩子**声明式覆盖 `build.rolldownOptions.external` 为恒 false 函数**（不在用户对象上就地清空），强制每个命名 external 通过 stash 文件（`module.exports = <globalName>;`）走 Rolldown 原生打包链路。
>
> 典型场景是：你发现 IIFE 产物里顶层 `require('react')` 没有被正确替换为 `$linkdesign.React`，这时把 `interop` 设为 `'auto'` 就能让 Rolldown 把 stash 当普通 CJS 模块一起包进 IIFE，IIFE 包装器历来能正确处理这种 1 行 CJS 的导出形状。
>
> 说明：Vite 6 及以前的"开发也走 alias"行为在当前版本已无实现；`interop` 现在只影响构建阶段。历史行为请查阅 [旧文档归档](/zh/legacy/plugins/vite-plugin-external/usage#调整打包策略)。

vite.config.mjs

```js
import { defineConfig } from 'vite';
import pluginExternal from 'vite-plugin-external';

export default defineConfig({
  plugins: [
    pluginExternal({
      interop: 'auto',
      externals: {
        react: '$linkdesign.React',
        'react-dom/client': '$linkdesign.ReactDOM',
        'prop-types': '$linkdesign.PropTypes',
      },
    }),
  ],
  build: {
    minify: false,
    rolldownOptions: {
      output: {
        format: 'iife',
      },
    },
  },
});
```

## 构建时仅排除依赖

> 场景是写 Node.js CLI / 后端 lib：只希望产物里不打包进 `node_modules` 依赖 / Node 内置模块，不需要浏览器端的全局变量和 CDN shim。两个快捷开关：
> - `nodeBuiltins: true` —— 把 `fs` / `path` / `node:stream/*` 等 Node 内置模块一律标 external（仅 build 生效）
> - `externalizeDeps: (string | RegExp)[]` —— 这些命中的依赖一律不打包（dev 与 build 都生效，命中即 true，不给全局名）。dev 下 Vite 会把这类裸说明符改写成 `/@id/<说明符>`，浏览器页面要靠导入映射表才取到模块——这张表由你自己提供，插件只在 build 且 `importmap: true` 时才注入映射（形态见[用导入映射替代 CDN 地址](#用导入映射替代-cdn-地址)）。
>
> 本小节对应配置项：`nodeBuiltins`（仅构建时生效）/ `externalizeDeps`（**不注入全局名 / 不写 stash shim**，dev 与 build 都生效）。

vite.config.mjs
```js
import { defineConfig } from 'vite';
import pluginExternal from 'vite-plugin-external';
import { globSync } from 'tinyglobby';
import { dependencies } from './package.json' with { type: 'json' };

export default defineConfig({
  plugins: [
    pluginExternal({
      nodeBuiltins: true,
      externalizeDeps: Object.keys(dependencies),
    }),
  ],
  build: {
    minify: false,
    lib: {
      formats: ['es', 'cjs'],
      entry: globSync('src/*.js'),
      fileName(format, entryName) {
        return entryName + (format === 'es' ? '.mjs' : '.js');
      },
    },
  },
});
```

## 用导入映射替代 CDN 地址

> 场景：项目已经把一批依赖 external 成 ESM CDN 地址，之后想把某个依赖换到另一台 host，却不想重新打包。`importmap: true` 让 build 产物里只留裸说明符，所有地址集中到 build 后 HTML 的导入映射表里。
>
> 插件的行为（**仅 build**）：
> - `resolveId` 对 `externals` 里解析为 ES URL 的条目返回 `{ id: '<说明符>', external: 'absolute' }`，build 产物保留 `import x from '<说明符>'`。
> - `transformIndexHtml` 注入 `<script type="importmap">{"imports": {…}}</script>`（键就是裸说明符），并为每个 URL 注入一条 `<link rel="modulepreload" crossorigin>`。Vite 会自己把这张表提到第一个 `<script type="module">` / `<link rel="modulepreload">` 之前。
> - stash 文件仍然照写，开关只改 build 的解析目标和 HTML 内容。
> - dev 不受影响：CDN external 仍由 DepsOptimizer 预打包，dev 页面既没有表也没有预取标签。
>
> 限制：任意能解析出 ES URL 的 `externals` 形态都适用（URL 字符串或 `{ format: 'es', … }` 对象）；纯 external（返回 `true`）不会进表，值为全局变量名的条目仍走 IIFE stash；它是插件级开关，不支持按模式覆盖。

vite.config.mjs
```js
import { defineConfig } from 'vite';
import pluginExternal from 'vite-plugin-external';

export default defineConfig({
  plugins: [
    pluginExternal({
      externals: {
        lodash: 'https://esm.sh/lodash@4.18.1',
        dayjs: 'https://esm.sh/dayjs@1.11.23',
      },
      importmap: true,
    }),
  ],
});
```

构建后 `index.html` head 的形态：

```html
<link rel="modulepreload" crossorigin href="https://esm.sh/lodash@4.18.1">
<link rel="modulepreload" crossorigin href="https://esm.sh/dayjs@1.11.23">
<script type="importmap">{"imports": {"lodash": "https://esm.sh/lodash@4.18.1", "dayjs": "https://esm.sh/dayjs@1.11.23"}}</script>
```
