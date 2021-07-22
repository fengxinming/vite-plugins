# vite-plugin-module-script

> A vite plugin for dynamic creating a module script tag.

## Usage

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

dynamic creating a module script tag about `/src/index.jsx`, when visiting `/app.js`