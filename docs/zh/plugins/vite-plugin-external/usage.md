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

> 将指定的依赖替换为 CDN 资源，并在 `index.html` 中自动添加 `modulepreload` 链接标签，让浏览器在首屏就开始预取 CDN 模块。

```js
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import pluginExternal from 'vite-plugin-external';

export default defineConfig({
  plugins: [
    react({ jsxRuntime: 'classic' }),
    pluginExternal({
      externals(libName) {
        if (libName === 'react') return 'https://esm.sh/react@18.3.1';
        if (libName === 'react-dom/client') return 'https://esm.sh/react-dom@18.3.1';
      },
    }),
  ],
});
```

## 多模式场景配置

> 开发环境（unpkg UMD）和生产环境（自有 CDN）可能用不同的全局变量名/地址。用 `development` / `production` 两个字段作为模式 override，分别对应不同模式下的 `BasicOptions`（详见 [配置项：[mode: string] 索引签名](/zh/plugins/vite-plugin-external/options#mode-string-索引签名)）。

development 环境 `index.html`
```html
<script src="//unpkg.com/react@18.3.1/umd/react.development.js"></script>
<script src="//unpkg.com/react-dom@18.3.1/umd/react-dom.development.js"></script>
```

production 环境 `index.html`
```html
<script src="//g.alicdn.com/linkdesign/lib/1.0.1/~react.js"></script>
<script src="//g.alicdn.com/linkdesign/lib/1.0.1/~react-dom.js"></script>
```

vite.config.mjs
```js
import { defineConfig } from 'vite';
import pluginExternal from 'vite-plugin-external';

export default defineConfig({
  plugins: [
    pluginExternal({
      // 生产模式默认使用自有 CDN 前缀
      externals: {
        react: '$linkdesign.React',
        'react-dom/client': '$linkdesign.ReactDOM',
      },
      // 开发模式覆盖 externals，改用 unpkg 全局变量名
      development: {
        externals: {
          react: 'React',
          'react-dom/client': 'ReactDOM',
        },
      },
    }),
  ],
});
```

## 调整打包策略

> `interop: 'auto'` 的作用是在**构建阶段**清空 `build.rolldownOptions.external`，强制每个命名 external 通过 stash 文件（`module.exports = <globalName>;`）走 Rolldown 原生打包链路。
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

## 解决 IIFE 格式的打包问题

> 即使 Rolldown 拿到了 `output.globals`，少数情况下 IIFE 顶层的 `require('react')` 仍不会被替换成全局变量访问（参阅 [rollup/rollup#3188](https://github.com/rollup/rollup/issues/3188)）。
>
> 这时用 `externalGlobals` 回调，把我们已经编译好的 globals resolver 喂给 `@rolldown/plugin-external-globals`（或 Rollup 同名插件），返回的插件会被**插入到 `rolldownOptions.plugins` 数组最前面**，保证它的 transform 先于 Rolldown 内置 globals 执行。
>
> **注意**：当前 API 是函数形态 `(globals) => Rolldown.Plugin`，不是直接传插件对象。历史上直接传插件对象的写法（旧版 rollup-plugin-external-globals 实例）必须包一层才能在当前类型签名下使用。

```js
import { defineConfig } from 'vite';
import pluginExternal from 'vite-plugin-external';
import externalGlobals from '@rolldown/plugin-external-globals';

export default defineConfig({
  plugins: [
    pluginExternal({
      // 关键：回调形态。参数 globals(id) 等价于 output.globals 反查函数。
      externalGlobals: (globals) => externalGlobals(globals),
      externals: {
        react: 'React',
        'react-dom/client': 'ReactDOM',
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

## 构建时仅排除依赖

> 场景是写 Node.js CLI / 后端 lib：只希望产物里不打包进 `node_modules` 依赖 / Node 内置模块，不需要浏览器端的全局变量和 CDN shim。两个快捷开关：
> - `nodeBuiltins: true` —— 把 `fs` / `path` / `node:stream/*` 等 Node 内置模块一律标 external（仅 build 生效）
> - `externalizeDeps: (string | RegExp)[]` —— 这些命中的依赖一律不打包（仅 build 生效，命中即 true，不给全局名）。
>
> 本小节对应配置项：`nodeBuiltins` / `externalizeDeps`（**不注入全局名 / 不写 stash shim**，仅在构建时生效）。

vite.config.mjs
```js
import { defineConfig } from 'vite';
import pluginExternal from 'vite-plugin-external';
import { globSync } from 'tinyglobby';
import { dependencies } from './package.json';

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
