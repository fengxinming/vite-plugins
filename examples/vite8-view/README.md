# vite8-view

演示 `vite-plugin-view`：使用模板引擎替代静态 HTML 入口。

## 示例

| 配置 | 说明 |
|------|------|
| `vite.config.1.mts` | pug 引擎（index.pug） |
| `vite.config.2.mts` | ejs 引擎（index.ejs） |
| `vite.config.3.mts` | nunjucks 引擎（index.njk） |
| `vite.config.4.mts` | handlebars 引擎 + 自定义 extension（.hbs） |

## 运行

```bash
# pug
pnpm dev --config vite.config.1.mts

# ejs
pnpm dev --config vite.config.2.mts

# nunjucks
pnpm dev --config vite.config.3.mts

# handlebars
pnpm dev --config vite.config.4.mts
```
