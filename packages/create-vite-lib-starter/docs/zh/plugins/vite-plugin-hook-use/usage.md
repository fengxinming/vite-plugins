# 使用示例

假设你有以下文件结构：

```
src/
  |- index.js
```

配置如下：

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

将会在控制台打印出以下内容，数字表示调用次数

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
