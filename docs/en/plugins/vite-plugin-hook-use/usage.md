# Usage Examples

Assuming you have the following file structure:

```
src/
  |- index.js
```

Configuration as follows:

```typescript
import { defineConfig } from 'vite';
import vitePluginHookUse from 'vite-plugin-hook-use';

export default defineConfig({
  plugins: [
    vitePluginHookUse()
  ]
});
```

```bash
vite build
```

The console will output the following content with numbers indicating call counts:

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
