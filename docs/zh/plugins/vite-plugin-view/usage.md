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
    rollupOptions: {
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
import { defineConfig, Plugin } from 'vite';
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
    rollupOptions: {
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
import { defineConfig, Plugin } from 'vite';
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
    rollupOptions: {
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
import { defineConfig, Plugin } from 'vite';
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
    rollupOptions: {
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