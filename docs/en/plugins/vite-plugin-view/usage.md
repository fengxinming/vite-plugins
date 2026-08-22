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

---

## Delegating requests to Vite's native pipeline with `strategy: 'delegate'`

### When to use it
Use `strategy: 'delegate'` when you want the dev server request path to match exactly
what Vite 8 does with a static `.html` file — e.g. to investigate HMR differences
or to debug Vite's built-in middleware:

- The plugin renders the template to a sibling `.html` file next to the source template
- Any pre-existing user `.html` is backed up to `.bak_<timestamp>`
- `next()` is called so Vite's native HTML stack (`htmlFallbackMiddleware` →
  `indexHtmlMiddleware` → `transformIndexHtml`) processes the URL end-to-end
- Generated files are removed and backups are restored when the process exits
  (SIGINT / SIGTERM / uncaught exceptions)

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

Configure EJS + MPA + `strategy: 'delegate'` in `vite.config.mjs`:

```js
import { defineConfig } from 'vite';
import { view } from 'vite-plugin-view';

export default defineConfig({
  plugins: [
    view({
      engine: 'ejs',
      extension: '.ejs',
      // Delegate to Vite's native HTML middleware stack after writing to disk
      strategy: 'delegate',
      // MPA entry object: key = output HTML filename, value = template file
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
    // IIFE builds require enabling code splitting explicitly
    rolldownOptions: {
      output: {
        codeSplitting: true,
      },
    },
  },
});
```

### Template examples

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

### Runtime behavior

1. On the first request to `/`:
   - Render `index.ejs` and write a sibling `index.html`
   - If a user-owned `index.html` already exists, back it up to `index.html.bak_<timestamp>`
   - Call `next()` so Vite's native `htmlFallbackMiddleware` → `indexHtmlMiddleware` processes the URL
2. On the first request to `/home`: render `home.ejs` → write `home.html` → native pipeline takes over
3. Subsequent visits to the same URL are skipped via the `delegateWritten` Map keyed on URL
4. On process exit (Ctrl+C / kill / crash): backups are restored and generated files are cleaned up

> The `strategy` option only affects the dev server. Build output is identical to the default `'intercept'` behavior.


