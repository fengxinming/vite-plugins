# 使用示例

## Pug 模板使用示例

### 安装

::: code-group

```bash [npm]
npm add vite-plugin-view pug
```
```bash [pnpm]
pnpm add vite-plugin-view pug
```
```bash [yarn]
yarn add vite-plugin-view pug
```

:::

### 配置

在 `vite.config.mjs` 中配置：

```js
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';
import vitePluginExternal from 'vite-plugin-external';
import { view } from 'vite-plugin-view';

export default defineConfig({
  plugins: [
    vitePluginExternal({
      logLevel: 'TRACE',
      externals: {
        vue: 'Vue'
      }
    }),
    vue(),
    view({
      engine: 'pug',
      // entry: 'index.pug', // 默认为 'index.pug'，可以配置多个模版文件
      engineOptions: {
        title: 'Vite + Vue' // 在模版中可以使用 `title` 变量
      },
      logLevel: 'TRACE' // 设置 'TRACE' 可以查看所有的打印日志
    })
  ],
  build: {
    rolldownOptions: {
      output: {
        format: 'iife'
      }
    }
  }
});
```

### 在模板中使用透传参数

`index.pug`

```pug
doctype html
html(lang='en')
  head
    meta(charset='UTF-8')
    meta(content='width=device-width, initial-scale=1.0' name='viewport')
    title= title
    link(href='./index.css' rel='stylesheet')
  body
    //- ResolvedConfig 来自 configResolved 钩子
    p
      | define: 
      = JSON.stringify(ResolvedConfig.define, null, 2)
    p
      | env: 
      = JSON.stringify(ResolvedConfig.env, null, 2)
    #root
    script(src='//unpkg.com/vue@3.5.13/dist/vue.runtime.global.js')
    script(src='./src/main.ts' type='module')
```

---

## EJS 模板使用示例

### 安装

::: code-group

```bash [npm]
npm add vite-plugin-view ejs
```
```bash [pnpm]
pnpm add vite-plugin-view ejs
```
```bash [yarn]
yarn add vite-plugin-view ejs
```

:::

### 配置

在 `vite.config.mjs` 中配置：
```js
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import vitePluginExternal from 'vite-plugin-external';
import { view } from 'vite-plugin-view';

export default defineConfig({
  plugins: [
    vitePluginExternal({
      logLevel: 'TRACE',
      externals: {
        react: 'React',
        'react-dom/client': 'ReactDOM'
      }
    }),
    react({
      jsxRuntime: 'classic'
    }),
    view({
      engine: 'ejs',
      // entry: 'index.ejs', // 默认为 'index.ejs'，可以配置多个模版文件
      engineOptions: {
        title: 'Vite + React' // 在模版中可以使用 `title` 变量
      },
      logLevel: 'TRACE' // 设置 'TRACE' 可以查看所有的打印日志
    })
  ],
  build: {
    rolldownOptions: {
      output: {
        format: 'iife'
      }
    }
  }
});
```

### 在模板中使用透传参数

`index.ejs`

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title><%= title %></title>
    <link rel="stylesheet" href="./index.css" />
  </head>
  <body>
    <%# ResolvedConfig 来自 configResolved 钩子 %>
    <p>alias: <%= JSON.stringify(ResolvedConfig.resolve.alias, null, 2) %></p>
    <p>env: <%= JSON.stringify(ResolvedConfig.env, null, 2) %></p>
    <div id="root"></div>
    <script src="//unpkg.com/react@18.3.1/umd/react.production.min.js"></script>
    <script src="//unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js"></script>
    <script type="module" src="./src/index.jsx"></script>
  </body>
</html>
```

---

## Nunjucks 模板使用示例

### 安装

::: code-group

```bash [npm]
npm add vite-plugin-view nunjucks
```
```bash [pnpm]
pnpm add vite-plugin-view nunjucks
```
```bash [yarn]
yarn add vite-plugin-view nunjucks
```

:::

### 配置

在 `vite.config.mjs` 中配置：
```js
import react from '@vitejs/plugin-react';
import nunjucks from 'nunjucks';
import { defineConfig } from 'vite';
import vitePluginExternal from 'vite-plugin-external';
import { engineSource, view } from 'vite-plugin-view';

const env = new nunjucks.Environment();

env.addFilter('stringify', (obj) => {
  return JSON.stringify(obj, null, 2);
});

engineSource.requires.nunjucks = env;

export default defineConfig({
  plugins: [
    vitePluginExternal({
      logLevel: 'TRACE',
      externals: {
        react: 'React',
        'react-dom/client': 'ReactDOM'
      }
    }),
    react({
      jsxRuntime: 'classic'
    }),
    view({
      engine: 'nunjucks',
      extension: '.njk',
      // entry: 'index.njk', // 默认为 'index.njk'，可以配置多个模版文件
      engineOptions: {
        title: 'Vite + React' // 在模版中可以使用 `title` 变量
      },
      logLevel: 'TRACE' // 设置 'TRACE' 可以查看所有的打印日志
    })
  ],
  build: {
    rolldownOptions: {
      output: {
        format: 'iife'
      }
    }
  }
});
```

### 在模板中使用透传参数

`index.njk`

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{{ title }}</title>
    <link rel="stylesheet" href="./index.css" />
  </head>
  <body>
    {# ResolvedConfig 来自 configResolved 钩子 #}
    <p>alias: {{ ResolvedConfig.resolve.alias|stringify }}</p>
    <p>env: {{ ResolvedConfig.env|stringify }}</p>
    <div id="root"></div>
    <script src="//unpkg.com/react@18.3.1/umd/react.production.min.js"></script>
    <script src="//unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js"></script>
    <script type="module" src="./src/index.jsx"></script>
  </body>
</html>
```

---

## Handlebars 模板使用示例

### 安装

::: code-group

```bash [npm]
npm add vite-plugin-view handlebars
```
```bash [pnpm]
pnpm add vite-plugin-view handlebars
```
```bash [yarn]
yarn add vite-plugin-view handlebars
```

:::

### 配置

在 `vite.config.mjs` 中配置：
```js
import react from '@vitejs/plugin-react';
import Handlebars from 'handlebars';
import { defineConfig } from 'vite';
import vitePluginExternal from 'vite-plugin-external';
import { view } from 'vite-plugin-view';

Handlebars.registerHelper('stringify', (obj) => {
  return JSON.stringify(obj, null, 2);
});

export default defineConfig({
  plugins: [
    vitePluginExternal({
      logLevel: 'TRACE',
      externals: {
        react: 'React',
        'react-dom/client': 'ReactDOM'
      }
    }),
    react({
      jsxRuntime: 'classic'
    }),
    view({
      engine: 'handlebars',
      extension: '.hbs',
      // entry: 'index.hbs', // 默认为 'index.hbs'，可以配置多个模版文件
      engineOptions: {
        title: 'Vite + React' // 在模版中可以使用 `title` 变量
      },
      logLevel: 'TRACE' // 设置 'TRACE' 可以查看所有的打印日志
    })
  ],
  build: {
    rolldownOptions: {
      output: {
        format: 'iife'
      }
    }
  }
});
```

### 在模板中使用透传参数

`index.hbs`

```hbs
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{{ title }}</title>
    <link rel="stylesheet" href="./index.css" />
  </head>
  <body>
    {{! ResolvedConfig 来自 configResolved 钩子 }}
    <p>alias: {{ stringify ResolvedConfig.resolve.alias }}</p>
    <p>env: {{ stringify ResolvedConfig.env }}</p>
    <div id="root"></div>
    <script src="//unpkg.com/react@18.3.1/umd/react.production.min.js"></script>
    <script src="//unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js"></script>
    <script type="module" src="./src/index.jsx"></script>
  </body>
</html>
```

---

## 使用 `strategy: { dev: 'delegate' }` 将请求交给 Vite 原生流水线处理

### 适用场景
当你需要保证 dev server 的请求处理路径与 Vite 8 原生处理静态 `.html` 文件完全一致时（例如排查 HMR 行为差异、调试 Vite 内置中间件），可以将 `strategy.dev` 设置为 `'delegate'`：

- 插件将模板渲染为模板文件同目录下的 `.html` 磁盘文件
- 用户原有的 `.html` 会被自动备份为 `.bak_<时间戳>`
- 调用 `next()` 交由 Vite 原生 HTML 流水线（`htmlFallbackMiddleware` → `indexHtmlMiddleware` → `transformIndexHtml`）端到端处理
- 进程退出（SIGINT / SIGTERM / 未捕获异常）时自动删除生成文件并还原备份

### 安装

::: code-group

```bash [npm]
npm add vite-plugin-view ejs
```
```bash [pnpm]
pnpm add vite-plugin-view ejs
```
```bash [yarn]
yarn add vite-plugin-view ejs
```

:::

### 配置

在 `vite.config.mjs` 中配置 EJS 模板 + MPA 多页面 + `strategy.dev: 'delegate'`：

```js
import { defineConfig } from 'vite';
import { view } from 'vite-plugin-view';

export default defineConfig({
  plugins: [
    view({
      engine: 'ejs',
      extension: '.ejs',
      // 以对象形式传入 strategy，dev 子项单独控制开发服务器策略
      strategy: {
        dev: 'delegate'
      },
      // 多页面入口对象：key = 输出 HTML 文件名, value = 模板文件路径
      entry: {
        index: 'index.ejs',
        home:  'home.ejs',
      },
      engineOptions: {
        title: 'EJS Delegate Example',
        items: ['Alpha', 'Beta', 'Gamma'],
        pageTitle: 'Home (delegate)',
      },
    }),
  ],
  build: {
    // IIFE 打包下需要显式开启代码分割
    rolldownOptions: {
      output: {
        codeSplitting: true,
      },
    },
  },
});
```

### 模板文件示例

`index.ejs`

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title><%= title %></title>
</head>
<body>
  <h1><%= title %></h1>
  <ul>
    <% items.forEach(function(item) { %>
      <li><%= item %></li>
    <% }); %>
  </ul>
  <script type="module" src="/src/index.ts"></script>
</body>
</html>
```

`home.ejs`

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Multi-Page: <%= title %></title>
</head>
<body>
  <h1>Multi-Page Example · <%= pageTitle %></h1>
  <p data-page="home">Home page rendered via vite-plugin-view middleware.</p>
  <script type="module" src="/src/index.ts"></script>
</body>
</html>
```

### 运行行为

1. 开发服务器启动后，首次访问 `/`：
   - 插件渲染 `index.ejs`，写入同目录下的 `index.html`
   - 如果用户原有的 `index.html` 存在，先备份为 `index.html.bak_<时间戳>`
   - 调用 `next()`，交给 Vite 原生 `htmlFallbackMiddleware` → `indexHtmlMiddleware` 处理
2. 首次访问 `/home`：渲染 `home.ejs` → `home.html` → Vite 原生流水线处理
3. 同 URL 的二次访问：由于插件内已记录该 URL 于 `delegateWritten` Map，直接跳过磁盘写
4. 进程结束（Ctrl+C / kill / 崩溃）：自动恢复备份并删除生成文件

> 构建阶段的输出形态由 `strategy.build` 独立控制（默认值为 `'html'`），见下一节。

---

## 使用 `strategy: { build: 'template' }` 输出原始模板 + 注入资源标签

### 适用场景
当前后端分离架构中，Node 后端需要在运行时用动态数据（如用户信息、i18n、A/B 实验变量）渲染模板时，不希望 Vite 构建把模板编译成"死 HTML"，而是希望：
- dist 中产出 `.ejs` / `.pug` 等**原始模板**文件（保留 `<%= %>` / `#{ }` 语法）
- Vite 构建出来的 JS/CSS 资源标签被正确注入模板，路径与构建产物中的 chunk 文件对齐
- 构建阶段不产出 `.html`（或同时产出，按需选择）

此时可以将 `strategy.build` 设为 `'template'` 或 `'both'`。

### 安装（同上，不再重复）

### 配置

在 `vite.config.mjs` 中配置 EJS + MPA + `strategy.build: 'template'`，配合可选的 `injectPlaceholder` 精确控制资源标签注入位置：

```js
import { defineConfig } from 'vite';
import { view } from 'vite-plugin-view';

export default defineConfig({
  plugins: [
    view({
      engine: 'ejs',
      extension: '.ejs',
      strategy: {
        // dev 用默认 'intercept'，内存渲染直接返回响应
        // build 输出原始模板文件，不生成 .html
        build: 'template'
      },
      // 资源标签注入到模板中的自定义占位符位置；不填则默认注入到 </head> 前
      injectPlaceholder: '<!-- VITE_ASSETS -->',
      entry: {
        index: 'index.ejs',
        home:  'home.ejs',
      },
      engineOptions: {
        title: 'EJS Build Template Example',
        items: ['Alpha', 'Beta', 'Gamma'],
        pageTitle: 'Home (template)',
      },
    }),
  ],
  build: {
    outDir: 'dist',
    rolldownOptions: {
      output: {
        codeSplitting: true,
      },
    },
  },
});
```

### 模板中放置占位符（可选）

如果希望 Vite 注入的资源标签不进入默认的 `</head>` 前位置，而是进入自定义位置，可以在模板中放置占位符：

`index.ejs`

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title><%= title %></title>
  <!-- VITE_ASSETS -->
  <%# 服务端注入的其他 head 标签放在这里 %>
</head>
<body>
  <h1><%= title %></h1>
  <ul>
    <% items.forEach(function(item) { %>
      <li><%= item %></li>
    <% }); %>
  </ul>
  <script type="module" src="/src/index.ts"></script>
</body>
</html>
```

构建后 `dist/index.ejs` 中的 `<!-- VITE_ASSETS -->` 会被替换为：

```html
<script type="module" crossorigin src="/assets/index-abc123.js"></script>
<link rel="stylesheet" crossorigin href="/assets/index-def456.css">
```

而 `<%= title %>`、`<% items.forEach(...) %>` 等 EJS 语法会原封不动保留，供后端运行时二次渲染。

### Pug 模板示例

Pug 是缩进式语法，不能直接塞 HTML 标签。插件会自动把 Vite 生成的 `<script>` / `<link>` 标签转换为 Pug 原生语法（如 `script(type="module", crossorigin, src="...")`），再注入模板。

配置（Pug + `strategy.build: 'template'` + `injectPlaceholder`）：

```js
import { defineConfig } from 'vite';
import { view } from 'vite-plugin-view';

export default defineConfig({
  plugins: [
    view({
      engine: 'pug',
      strategy: {
        build: 'template'
      },
      // Pug 模板中用 //- 注释作为占位符，替换后占位符消失
      injectPlaceholder: '//- VITE_ASSETS',
      entry: {
        index: 'index.pug'
      },
      engineOptions: {
        title: 'Pug Build Template Example'
      }
    })
  ],
  build: {
    outDir: 'dist',
    rolldownOptions: {
      output: {
        codeSplitting: true
      }
    }
  }
});
```

`index.pug`：

```pug
doctype html
html(lang='en')
  head
    meta(charset='UTF-8')
    title= title
    //- VITE_ASSETS
  body
    h1= title
    #root
    script(src='./src/main.ts' type='module')
```

构建后 `dist/index.pug`（占位符被替换为 Pug 原生标签，模板语法 `= title` / `#root` 保留，原入口 `script(src='./src/main.ts' ...)` 被移除）：

```pug
doctype html
html(lang='en')
  head
    meta(charset='UTF-8')
    title= title
    script(type="module", crossorigin, src="/assets/index-abc123.js")
    link(rel="stylesheet", crossorigin, href="/assets/index-def456.css")
  body
    h1= title
    #root
```

> 如果未设置 `injectPlaceholder`，插件会自动定位 `head` 声明行，以子节点同级缩进插入转换后的 Pug 标签。

### `strategy.build` 三档行为对比

| `strategy.build` 值 | dist 中产出 `.html` | dist 中产出原始模板（带资源标签） | 适用场景 |
|---------------------|----------------------|------------------------------------|---------|
| `'html'`（默认）    | ✅                   | ❌                                | 纯前端静态部署（与旧版行为一致） |
| `'template'`        | ❌                   | ✅ `.ejs` / `.pug` / ...          | 后端二次渲染（SSR / 模板代理） |
| `'both'`            | ✅                   | ✅                                | 同时部署静态站点和后端模板的场景 |

