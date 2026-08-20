
::: danger 这是 Vite 1.x – 6.x 旧版文档归档 / This is Vite 1.x – 6.x legacy archive
- 本文档对应插件版本：**vite-plugin-view ≤ 4.x、vite-plugin-external ≤ 7.x、vite-plugin-build-chunk ≤ 4.x 等旧发行版**。
- 适用打包器：Rollup / esbuild（Vite 6 及之前的默认组合）。**不支持 Vite 8+ 的 Rolldown 打包器**，Vite 7/8+ 用户请立即返回新文档。
- 本目录内容已冻结，不再维护。遇到新功能/新字段请查看最新文档：
  - 中文新文档：<a href="/zh/plugins/">/zh/plugins/</a>
  - English new docs：<a href="/plugins/">/plugins/</a>
:::
# vite-plugin-build-chunk（旧版）

> 在 Vite 构建完成后，根据配置生成额外的构建产物（如不同格式的 chunk 文件），适用于需要多格式输出或二次构建的场景。

## 安装

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

## 用法

在 `vite.config.ts` 中配置插件：

```typescript
import buildChunk from 'vite-plugin-build-chunk';

export default {
  plugins: [
    buildChunk({
      build: [ // 必须配置顶层的 `build` 属性
        {
          chunk: 'main.mjs', // 入口文件路径（相对项目根目录）
          format: 'umd', // 构建格式（默认 'umd'）
          name: 'MyLib', // 全局变量名（仅 UMD/IIFE 生效）
        },
        // 可添加多个配置对象
      ]
    }),
  ],
};
```

### **fileName 示例**
```typescript
// 默认模板（如 es → main.mjs，cjs → main.js，umd → main.umd.js）
fileName: undefined,

// 自定义模板字符串（需包含 `[name]` 和 `[format]`）
fileName: '[name]',

// 使用函数动态生成
fileName: (format, entryName) => {
  return `${entryName}-${format}.js`;
}
```

---

### **注意事项**
1. **配置结构**：必须通过 `build` 属性传递配置数组或对象，例如：
   ```typescript
   buildChunk({ build: [...] })
   ```
2. **入口路径**：`chunk` 需为绝对路径或相对于项目根目录的路径。
3. **多配置支持**：通过 `build` 数组配置多个构建任务，每个任务生成独立的构建产物。
4. **静默模式**：插件默认关闭日志输出（`logLevel: 'OFF'`），避免干扰主构建输出。
5. **格式默认值**：`format` 默认为 `umd`，若未指定将使用此格式。

---

### **示例输出**
若配置如下：
```typescript
{
  build: [{
    chunk: 'main.mjs',
    name: 'MyLib',
    format: 'umd'
  }]
}
```

生成的文件路径可能为：
```
dist/main.umd.js
```
