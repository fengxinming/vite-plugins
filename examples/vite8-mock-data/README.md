# vite8-mock-data

演示 `vite-plugin-mock-data`：基于文件路由自动生成 mock 接口。

## 示例

| 配置 | 说明 |
|------|------|
| `vite.config.1.mts` | 文件路由 mock（mock/api/users.ts → GET /api/users） |
| `vite.config.2.mts` | 动态路由参数（[id].ts → :id）+ 多 HTTP 方法 |
| `vite.config.3.mts` | RouteConfig 对象直接声明路由 |

## 运行

```bash
# 开发模式（mock 中间件生效）
pnpm dev --config vite.config.1.mts

# 构建模式
pnpm build --config vite.config.1.mts
```
