# vite8-combine

演示 `vite-plugin-combine`：将多个工具模块合并为单个入口文件。

## 示例

| 配置 | 说明 |
|------|------|
| `vite.config.1.mts` | 基础合并 + 生成 dts + nameExport |
| `vite.config.2.mts` | 排除特定文件 + 关闭 dts |
| `vite.config.3.mts` | 关闭 nameExport，使用 default 导出 |

## 运行

```bash
pnpm build --config vite.config.1.mts
```
