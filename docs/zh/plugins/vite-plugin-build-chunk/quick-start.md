# vite-plugin-build-chunk

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
          entry: 'dist/main.mjs', // 主构建 outDir 内的文件；相对值按项目根目录解析（此处 outDir 为默认 dist），绝对路径原样使用
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
// 未设置时：Vite 回退到 package.json 的 name（而非入口文件名）。
// 二次打包 main.mjs 会得到形如 <pkgName>.umd.cjs 的文件，因此需显式设置 fileName 来控制名称。
fileName: undefined,

// 函数返回完整文件名（原样使用，不再追加扩展名）：
fileName: () => 'main.umd.js',

// 按格式动态生成：
fileName: (format, entryName) => {
  return `${entryName}.${format}.js`;
}
```

---

### **注意事项**
1. **配置结构**：必须通过 `build` 属性传递配置数组或对象，例如：
   ```typescript
   buildChunk({ build: [...] })
   ```
2. **入口路径**：`entry` 指向主构建输出目录（`outDir`）内的文件，其相对值按**项目根目录**解析，绝对路径原样使用。已废弃的 `chunk` 保留旧行为：相对值以**主构建的 `outDir`** 为基准解析，因此与 `entry` 不等价，迁移时需换算路径。
3. **多配置支持**：通过 `build` 数组配置多个构建任务，每个任务生成独立的构建产物。
4. **静默模式**：二次构建内部以 `logLevel: 'silent'` 运行，不会干扰主构建的输出。
5. **格式默认值**：`format` 默认为 `umd`，若未指定将使用此格式。

---

### **示例输出**
若配置如下：
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

生成的文件路径为：
```
dist/main.umd.js
```

若省略 `fileName`，则改用 Vite 的默认命名，文件名取自 `package.json` 的 `name`（如 `dist/<pkgName>.umd.cjs`）。
