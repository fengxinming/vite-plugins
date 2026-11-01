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

首先，`config` 钩子会打印出 `env` 对象：

```text
env: {
  "mode": "production",
  "command": "build",
  "isSsrBuild": false,
  "isPreview": false
}
```

然后在 `closeBundle` 时，控制台输出以下统计内容，数字表示调用次数：

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
