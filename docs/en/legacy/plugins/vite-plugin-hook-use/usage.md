
::: danger This is Vite 1.x – 6.x LEGACY documentation archive / 这是 Vite 1.x – 6.x 旧版文档归档
- These pages correspond to old plugin releases: **vite-plugin-view ≤ 4.x, vite-plugin-external ≤ 7.x, vite-plugin-build-chunk ≤ 4.x, etc.**
- Bundler covered: Rollup + esbuild (the default Vite 6 and below stack). **This does NOT apply to Vite 8+ with the new Rolldown bundler**; Vite 7/8+ users, go to the current docs immediately.
- Content under this folder is frozen and unmaintained. For any new option / field, check the current docs:
  - Latest English docs: [/guide/introduction](/guide/introduction)
  - 最新中文文档：[/zh/guide/introduction](/zh/guide/introduction)
:::
Here is the translated English version of the document:

---

# Usage Examples (legacy)

Assume you have the following file structure:

```
src/
  |- index.js
```

Configure as follows:

```typescript
import { defineConfig } from 'vite';
import vitePluginHookUse from 'vite-plugin-hook-use';

export default defineConfig({
  plugins: [
    vitePluginHookUse()
  ]
});
```

Run the following command:

```bash
vite build
```

The console will output the following content, where numbers indicate the call count:

```bash
┌   === Start ===
│
◇  config(1)
│
◇  configResolved(1)
│
◇  options(1)
│
◇  buildStart(1)
│
◇  load(1)
│
◇  transform(1)
│
◇  moduleParsed(1)
│
◇  buildEnd(1)
│
◇  outputOptions(1)
│
◇  renderStart(1)
│
◇  banner(1)
│
◇  footer(1)
│
◇  intro(1)
│
◇  outro(1)
│
◇  renderChunk(1)
│
◇  generateBundle(1)
│
◇  writeBundle(1)
│
◇  closeBundle(1)
│
└   === End ===
```

---

### Explanation:
- The plugin tracks and displays all Vite hook functions invoked during the build process.
- Each line shows the **hook name** followed by its **call count** in parentheses.
- The output helps visualize the execution sequence and frequency of Vite's internal hooks.
