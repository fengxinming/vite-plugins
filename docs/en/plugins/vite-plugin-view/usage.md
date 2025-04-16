# Usage Examples

## Pug Template Usage Example

### Installation

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

### Configuration

Configure in `vite.config.mjs`:

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
      // entry: 'index.pug', // Default is 'index.pug', can configure multiple templates
      engineOptions: {
        title: 'Vite + Vue' // Available as `title` variable in templates
      },
      logLevel: 'TRACE' // Set to 'TRACE' to view all logs
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

### Using Passed Parameters in Templates

`index.pug`:

```pug
doctype html
html(lang='en')
  head
    meta(charset='UTF-8')
    meta(content='width=device-width, initial-scale=1.0' name='viewport')
    title= title
    link(href='./index.css' rel='stylesheet')
  body
    //- ResolvedConfig comes from the configResolved hook
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

## EJS Template Usage Example

### Installation

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

### Configuration

Configure in `vite.config.mjs`:

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
      // entry: 'index.ejs', // Default is 'index.ejs', can configure multiple templates
      engineOptions: {
        title: 'Vite + React' // Available as `title` variable in templates
      },
      logLevel: 'TRACE' // Set to 'TRACE' to view all logs
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

### Using Passed Parameters in Templates

`index.ejs`:

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
    <%# ResolvedConfig comes from the configResolved hook %>
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

## Nunjucks Template Usage Example

### Installation

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

### Configuration

Configure in `vite.config.mjs`:

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
      // entry: 'index.njk', // Default is 'index.njk', can configure multiple templates
      engineOptions: {
        title: 'Vite + React' // Available as `title` variable in templates
      },
      logLevel: 'TRACE' // Set to 'TRACE' to view all logs
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

### Using Passed Parameters in Templates

`index.njk`:

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
    {# ResolvedConfig comes from the configResolved hook #}
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

## Handlebars Template Usage Example

### Installation

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

### Configuration

Configure in `vite.config.mjs`:

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
      // entry: 'index.hbs', // Default is 'index.hbs', can configure multiple templates
      engineOptions: {
        title: 'Vite + React' // Available as `title` variable in templates
      },
      logLevel: 'TRACE' // Set to 'TRACE' to view all logs
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

### Using Passed Parameters in Templates

`index.hbs`:

```handlebars
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{{ title }}</title>
    <link rel="stylesheet" href="./index.css" />
  </head>
  <body>
    {{! ResolvedConfig comes from the configResolved hook }}
    <p>alias: {{ stringify ResolvedConfig.resolve.alias }}</p>
    <p>env: {{ stringify ResolvedConfig.env }}</p>
    <div id="root"></div>
    <script src="//unpkg.com/react@18.3.1/umd/react.production.min.js"></script>
    <script src="//unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js"></script>
    <script type="module" src="./src/index.jsx"></script>
  </body>
</html>
```
