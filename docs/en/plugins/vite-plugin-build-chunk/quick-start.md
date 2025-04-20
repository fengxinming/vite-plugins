# vite-plugin-build-chunk

> Generate additional build artifacts (e.g., chunk files in different formats) after Vite's main build process. Ideal for scenarios requiring multi-format outputs or secondary builds.

## Installation

::: code-group

```bash [npm]
npm add vite-plugin-build-chunk
```
```bash [pnpm]
pnpm add vite-plugin-build-chunk
```
```bash [yarn]
yarn add vite-plugin-build-chunk
```

:::

## Usage

Configure the plugin in `vite.config.ts`:

```typescript
import buildChunk from 'vite-plugin-build-chunk';

export default {
  plugins: [
    buildChunk({
      build: [ // The `build` property must be configured
        {
          chunk: 'main.mjs', // Entry file path (relative to project root)
          format: 'umd', // Build format (default: 'umd')
          name: 'MyLib', // Global variable name (only applies to UMD/IIFE formats)
        },
        // Add more configurations here
      ],
    }),
  ],
};
```

### **fileName Examples**
```typescript
// Default template (e.g., 'es' → 'main.mjs', 'cjs' → 'main.js', 'umd' → 'main.umd.js')
fileName: undefined,

// Custom template string (must include `[name]` and `[format]`)
fileName: '[name]',

// Dynamic generation via function
fileName: (format, entryName) => {
  return `${entryName}-${format}.js`;
}
```

---

### **Notes**
1. **Configuration Structure**: The `build` property must be provided as an array or object. Example:
   ```typescript
   buildChunk({ build: [...] })
   ```
2. **Entry Path**: `chunk` must be an absolute path or relative to the project root.
3. **Multi-Task Support**: Use the `build` array to configure multiple tasks, each generating independent artifacts.
4. **Silent Mode**: The plugin defaults to `logLevel: 'OFF'` to avoid cluttering the main build output.
5. **Format Default**: `format` defaults to `umd` if unspecified.

---

### **Example Output**
For the configuration:
```typescript
{
  build: [{
    chunk: 'main.mjs',
    name: 'MyLib',
    format: 'umd'
  }]
}
```

The generated file path might be:
```
dist/main.umd.js
```
