# vite8-build-chunk

演示 `vite-plugin-build-chunk`：主构建输出 ES 格式，closeBundle 后额外生成其他格式的 chunk。

## 示例

| 配置 | 说明 |
|------|------|
| `vite.config.1.mts` | 基础用法：生成单个 UMD chunk |
| `vite.config.2.mts` | 同时生成多个 chunk（UMD + CJS） |
| `vite.config.3.mts` | 开启 sourcemap + 自定义输出目录 |

## 运行

```bash
# 示例 1
pnpm build --config vite.config.1.mts

# 示例 2
pnpm build --config vite.config.2.mts

# 示例 3
pnpm build --config vite.config.3.mts
```
