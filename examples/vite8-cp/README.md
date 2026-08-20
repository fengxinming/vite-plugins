# vite8-cp

演示 `vite-plugin-cp`：构建完成后将产物复制到指定目录。

## 示例

| 配置 | 说明 |
|------|------|
| `vite.config.1.mts` | 基础复制：目录、文件、重命名、transform |
| `vite.config.2.mts` | glob 匹配 + flatten 平铺 + 函数重命名 |
| `vite.config.3.mts` | transform 转换文件内容（修改 JSON、去除 sourcemap） |

## 运行

```bash
pnpm build --config vite.config.1.mts
```
