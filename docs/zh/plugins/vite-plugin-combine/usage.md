# 使用示例

假设你有以下文件结构：

```
src/
  |- components/
  |     |- Button.ts
  |     |- Input.ts
  |     |- Select.ts
```

配置如下：

```typescript
import { defineConfig } from 'vite';
import pluginCombine from 'vite-plugin-combine';

export default defineConfig({
  plugins: [
    pluginCombine({
      src: 'src/components/**/*.ts',
      target: 'src/index.ts',
      exports: 'named',
      nameExport: (name, filePath) => `my${name}`
    })
  ],
  build: {
    minify: false,
    lib: {
      formats: ['es', 'cjs'],
      fileName: '[name]'
    }
  }
});
```

将会生成如下的 `src/index.ts` 文件：

```typescript
export { default as myButton } from './components/Button';
export { default as myInput } from './components/Input';
export { default as mySelect } from './components/Select';
```
