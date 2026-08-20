# vite8-external

演示 `vite-plugin-external`：将依赖标记为外部，不打包进产物。

## 示例

| 配置 | 说明 |
|------|------|
| `vite.config.1.mts` | 基础 externals 映射（Record 形态） |
| `vite.config.2.mts` | 函数形态 externals，动态判断 |
| `vite.config.3.mts` | externalizeDeps 纯 external 不生成 shim |
| `vite.config.4.mts` | 多环境覆盖 development/production |

## 运行

```bash
pnpm build --config vite.config.1.mts
```
