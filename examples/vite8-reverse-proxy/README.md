# vite8-reverse-proxy

演示 `vite-plugin-reverse-proxy`：将线上脚本请求反代到本地 dev server。

## 示例

| 配置 | 说明 |
|------|------|
| `vite.config.1.mts` | 基础反代规则 |
| `vite.config.2.mts` | 注入 preambleCode + 多 targets |

## 运行

```bash
pnpm dev --config vite.config.1.mts
```

配合浏览器代理插件（如 XSwitch）将线上脚本 URL 指向 `http://localhost:3000/app.js`。
