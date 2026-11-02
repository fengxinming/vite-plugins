# Usage Examples

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

First, the `config` hook prints the `env` object:

```text
env: {
  "mode": "production",
  "command": "build",
  "isSsrBuild": false,
  "isPreview": false
}
```

Then, at `closeBundle`, the console outputs the hook summary below, where numbers indicate the call count:

```text
┌   === Start === 
│
◇  config(1)
│
◇  configEnvironment(1)
│
◇  configResolved(1)
│
◇  applyToEnvironment(1)
│
◇  options(1)
│
◇  outputOptions(1)
│
◇  buildStart(1)
│
◇  load(1)
│
◇  transform(2)
│
◇  moduleParsed(1)
│
◇  buildEnd(1)
│
◇  renderStart(1)
│
◇  banner(1)
│
◇  intro(1)
│
◇  outro(1)
│
◇  footer(1)
│
◇  renderChunk(1)
│
◇  augmentChunkHash(1)
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