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
    rolldownOptions: {
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
      // entry: 'index.ejs', // Default is 'index.ejs', can configure multiple templates
      engineOptions: {
        title: 'Vite + React' // Available as `title` variable in templates
      },
      logLevel: 'TRACE' // Set to 'TRACE' to view all logs
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
      // entry: 'index.njk', // Default is 'index.njk', can configure multiple templates
      engineOptions: {
        title: 'Vite + React' // Available as `title` variable in templates
      },
      logLevel: 'TRACE' // Set to 'TRACE' to view all logs
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
      // entry: 'index.hbs', // Default is 'index.hbs', can configure multiple templates
      engineOptions: {
        title: 'Vite + React' // Available as `title` variable in templates
      },
      logLevel: 'TRACE' // Set to 'TRACE' to view all logs
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

## Delegating requests to Vite's native pipeline with `strategy: { dev: 'delegate' }`

### When to use it
Use `strategy.dev: 'delegate'` when you want the dev server request path to match exactly
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

Configure EJS + MPA + `strategy.dev: 'delegate'` in `vite.config.mjs`:

```js
import { defineConfig } from 'vite';
import { view } from 'vite-plugin-view';

export default defineConfig({
  plugins: [
    view({
      engine: 'ejs',
      extension: '.ejs',
      // Pass strategy as an object; the 'dev' sub-option governs the dev server
      strategy: {
        dev: 'delegate'
      },
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

> The build output is governed independently by `strategy.build` (defaults to `'html'`). See the next section.

---

## Emitting raw templates with asset tags via `strategy: { build: 'template' }`

### When to use it
In a decoupled front-end / back-end architecture, the Node back-end often re-renders
templates at runtime with dynamic data (user profile, i18n, A/B test variables). In that
situation you do **not** want Vite to compile templates into "static HTML". Instead you
want the build to:

- Emit the **original template files** (`.ejs` / `.pug` / …) to `dist` with
  `<%= %>` / `#{ }` syntax left intact
- Correctly inject the Vite-built JS/CSS asset tags into each template so the
  chunk paths match the real built artifacts
- Optionally skip `.html` output (or output both, your call)

Set `strategy.build` to `'template'` (or `'both'`) for this behaviour.

### Installation (same as above, skipped)

### Configuration

Configure EJS + MPA + `strategy.build: 'template'` together with the optional
`injectPlaceholder` to precisely control where asset tags land:

```js
import { defineConfig } from 'vite';
import { view } from 'vite-plugin-view';

export default defineConfig({
  plugins: [
    view({
      engine: 'ejs',
      extension: '.ejs',
      strategy: {
        // dev defaults to 'intercept' (in-memory render), build emits templates
        build: 'template'
      },
      // Replace this exact placeholder with the generated asset tags.
      // When omitted (or the placeholder is not found) tags are injected
      // before </head> (Vite-native injectToHead behavior).
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

### Placing the injection placeholder in templates (optional)

When you don't want the default `</head>`-before injection (e.g. because back-end
tags must come after Vite assets), place a custom placeholder in the template:

`index.ejs`

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title><%= title %></title>
  <!-- VITE_ASSETS -->
  <%# other head tags injected by the backend go here %>
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

After building, `<!-- VITE_ASSETS -->` inside `dist/index.ejs` is replaced with:

```html
<script type="module" crossorigin src="/assets/index-abc123.js"></script>
<link rel="stylesheet" crossorigin href="/assets/index-def456.css">
```

The EJS syntax (`<%= title %>`, `<% items.forEach(...) %>`) is preserved verbatim so
the back-end can re-render them with dynamic values at request time.

### Pug template example

Pug uses indentation-sensitive syntax where raw HTML tags like `<script src="x">` are not valid. The plugin automatically converts Vite-generated `<script>` / `<link>` tags into Pug-native syntax (e.g. `script(type="module", crossorigin, src="...")`) before injecting.

Configuration (Pug + `strategy.build: 'template'` + `injectPlaceholder`):

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
      // Use a //- comment as the placeholder in Pug; it disappears after replacement
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

`index.pug`:

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

After building, `dist/index.pug` (placeholder replaced with Pug-native tags, template syntax `= title` / `#root` preserved, original entry `script(src='./src/main.ts' ...)` removed):

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

> If `injectPlaceholder` is not set, the plugin automatically locates the `head` declaration line and inserts the converted Pug tags at the same indentation level as existing children.

### `strategy.build` modes compared

| `strategy.build` value | Emits `.html` to dist | Emits raw template + asset tags to dist | Use case |
|------------------------|------------------------|------------------------------------------|----------|
| `'html'` (default)     | ✅                     | ❌                                       | Purely static front-end deployment (legacy behaviour) |
| `'template'`           | ❌                     | ✅ `.ejs` / `.pug` / ...                | Backend re-rendering (SSR / template proxying) |
| `'both'`               | ✅                     | ✅                                       | Deploying a static site *and* back-end templates side by side |


