# vite8-mock-data

演示 `vite-plugin-mock-data` 的真实使用场景。所有 dev / build 用例均通过 `vite` CLI 子进程执行（与用户实际用法一致），并由 `test/build.test.ts` 用真实 `vite` CLI 覆盖。

## 示例

| 配置 | 说明 |
|------|------|
| `vite.config.1.mts` | 文件路由 mock（`mock/api/users.ts` → `GET /api/users`） |
| `vite.config.2.mts` | 动态路由参数（`[id].ts` → `:id`）+ 多 HTTP 方法（GET/PUT/DELETE） |
| `vite.config.3.mts` | RouteConfig 对象直接声明路由（静态数据形态 + 顶层函数 handler） |
| `vite.config.4.mts` | `sendFile` handler + 未匹配路径回退 Vite（SPA fallback） |
| `vite.config.5.mts` | Options 覆盖：`fastifyOptions` / 混合 routes 数组 / `cacheDir` / `cwd` |
| `vite.config.6.mts` | **双框架真实应用**：React `.tsx` + Vue `.vue` 共存 + mock 接口（MPA 多页） |
| `vite.config.7.mts` | `isAfter: true` 选项：mock 中间件挂在 Vite 内置中间件之后 |

## 双框架覆盖（config 6）

`config 6` 是一个真实的多页应用，同时挂载 `@vitejs/plugin-react` 与 `@vitejs/plugin-vue`：

- `index.html` → 原生 TS 页面（`src/index.ts`）
- `react.html` → React 页面（`src/react/main.tsx` → `src/react/App.tsx`）
- `vue.html` → Vue 页面（`src/vue/main.js` → `src/vue/App.vue`）

`src/react/App.tsx` 与 `src/vue/App.vue` 都在 `useEffect`/`onMounted` 里请求 `GET /api/users`，
验证两类框架页面都经 **Vite 转译管线**处理（证明 `@fastify/static` 的 `serve: false` 没有劫持
`.tsx` / `.vue` 文件），且 mock 接口与页面在同一 dev server 下并存。

## 运行

```bash
# 开发模式（mock 中间件生效）；默认 config 6 为双框架应用
pnpm dev
pnpm dev:6          # 等同于上面
pnpm dev:7          # isAfter: true 示例

# 构建模式
pnpm build:1        # ... build:2 ~ build:7 各对应一套配置

# 集成测试（真实 vite CLI 子进程）
pnpm test
```

## 注意：isAfter 选项

`isAfter: true` 在 Vite 8 下会让 mock 中间件挂载在 Vite 内置中间件之后。
由于 Vite 的 SPA fallback 会拦截 GET 形式请求，此时 GET / POST 形式的 mock 路由都不再可靠命中，
属于 Vite 8 的固有限制（非本插件引入）。因此 `config 7` 仅验证 `isAfter: true` 不破坏页面服务、
插件可正常启动；默认（`isAfter: false`）才是 mock 路由完整可用的推荐配置。
