# vite-plugin-module-script

> A vite plugin for dynamic creating a module script tag.

```js
export default defineConfig({
  plugins: [
    moduleScript({
      mapping: {
        '/app.js': '/src/index.jsx'
      }
    })
  ]
});
```
