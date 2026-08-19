# vite8-include-css

演示 `vite-plugin-include-css`：将 CSS 内联到 JS 产物中。

## 示例

| 配置 | 说明 |
|------|------|
| `vite.config.1.mts` | 基础内联（单 CSS 文件） |
| `vite.config.2.mts` | 多 CSS 文件合并内联 + ES/CJS 双格式 |

## 运行

```bash
pnpm build --config vite.config.1.mts
```
