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
          entry: 'dist/main.mjs', // File inside the main build's output dir (outDir); a relative path resolves against the project root (outDir defaults to `dist` here), an absolute path is used as-is
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
// Unset: Vite falls back to the package.json `name` (NOT the entry file name).
// Rebundling main.mjs would then yield something like <pkgName>.umd.cjs, so set fileName to control it.
fileName: undefined,

// Exact output name via function (the returned string is used verbatim, no extra extension appended):
fileName: () => 'main.umd.js',

// Per-format naming via function:
fileName: (format, entryName) => {
  return `${entryName}.${format}.js`;
}
```

---

### **Notes**
1. **Configuration Structure**: The `build` property must be provided as an array or object. Example:
   ```typescript
   buildChunk({ build: [...] })
   ```
2. **Entry Path**: `entry` names a file inside the main build's output directory (`outDir`); a relative value resolves against the **project root**, and an absolute path is used as-is. The deprecated `chunk` keeps the legacy behaviour: its relative value resolves against the **main build's `outDir`**, so it is not equivalent to `entry` — convert the path when migrating.
3. **Multi-Task Support**: Use the `build` array to configure multiple tasks, each generating independent artifacts.
4. **Silent Mode**: The secondary builds run with `logLevel: 'silent'` so they don't clutter the main build output.
5. **Format Default**: `format` defaults to `umd` if unspecified.

---

### **Example Output**
For the configuration:
```typescript
{
  build: [{
    entry: 'dist/main.mjs',
    name: 'MyLib',
    format: 'umd',
    fileName: () => 'main.umd.js'
  }]
}
```

The generated file path is:
```
dist/main.umd.js
```

If `fileName` is omitted, Vite's default naming applies instead and the file is named from the `package.json` `name` (e.g. `dist/<pkgName>.umd.cjs`).
