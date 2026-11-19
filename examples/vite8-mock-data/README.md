# vite8-mock-data

演示 `vite-plugin-mock-data` 的真实使用场景。`test/build.test.ts` 用真实 `vite` CLI 子进程覆盖配置 1~7 的 dev / build；`test/adapter.test.ts`、`test/adapter-base.test.ts`、`test/no-client-mock.test.ts` 在 vitest 里覆盖浏览器端 axios adapter 的三条参数边界。

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
| `vite.config.8.mts` | `mockIn: 'client'`：dev/serve 与产物端都注入浏览器端 mock，dev 页面里的 axios adapter 可用 |
| `vite.config.9.mts` | 显式 `base: '/app'` + `mockIn: 'client'`：dev fastify prefix 与客户端路由表都带前缀；产物端由 `mock-client.html` 使用 adapter |
| `vite.config.10.mts` | `base` 兜底：插件不配 `base`，只配 Vite `base: '/app'`，dev 前缀结果与 config 9 一致 |
| `vite.config.11.mts` | `mockIn: 'build'`：serve 阶段前端拿不到 mock，守住「不越界到 serve」 |

## 参数与三条链路

| 链路 | 生效时机 | 谁提供数据 | 开关 |
|------|----------|-----------|------|
| 服务端 mock | dev | fastify 中间件（`configureServer`） | 配了 `routes` 就有 |
| 产物端 mock | `vite build` 之后 | 虚拟模块 → `mock-client` → axios adapter | `mockIn: 'build'` |
| dev 期前端 mock | dev / serve | 同上 | `mockIn: 'client'` |

`mockIn` 一个参数管浏览器端注入时机：`false`（默认，不注入）/ `'build'`（仅构建产物）/ `'client'`（dev 与产物都注入，超集）。`buildMock: true` 作为已废弃别名保留，等价于 `mockIn: 'build'`。

`base` 是拼接**已定义路由**的路径前缀，dev 端用作 fastify `register(..., { prefix })`，客户端在注入时把它编进路由表；未配 `base` 时取 Vite 的 `base`（`./` 与 `/` 都归一化成无前缀，末尾斜杠会被去掉）。

## 客户端 axios adapter（config 8，`mockIn: 'client'`）

`config 8` 开启 `mockIn: 'client'`，插件在 `configResolved` 阶段把 `./mock` 下的文件型路由与编译选项注入虚拟模块 `virtual:mock-routes`；`test/adapter.test.ts` 在 vitest（`vite-node`）里注册同一插件解析该虚拟模块，走与浏览器产物完全相同的静态导入链：`vite-plugin-mock-data/axios-adapter` → `mock-client` → `virtual:mock-routes` → `./mock` 文件。

真实用法是把无参 `createMockAdapter()` 装进 axios 实例：

```ts
import axios from 'axios';
import { createMockAdapter } from 'vite-plugin-mock-data/axios-adapter';

const service = axios.create({
  baseURL: '/api',
  timeout: 10000,
  adapter: createMockAdapter(),
});

// axios.getUri(config) 把 baseURL 拼进 url（→ /api/users）后再匹配路由表
const res = await service.get('/users');
```

`timeout` 属于 axios 自身的请求配置，mock adapter 不读它，也不需要真实网络；未命中的请求按 404 并遵循 `validateStatus` 拒绝，不会回退真实网络。现有用例覆盖静态/函数 handler、动态参数、body 反序列化、query 与 `config.params`、大小写敏感、`baseURL` 拼接、404 与 `validateStatus`。

## base 前缀（config 9 显式 / config 10 兜底）

`config 9` 在 Vite 顶层与插件里都写 `base: '/app'`；`config 10` 只写 Vite 顶层 `base`，插件不配 `base`——插件在 `configResolved` 里取 `resolvedConfig.base`，归一化后同样是 `/app`。两套配置的 dev 端表现必须一致：`/app/api/users` 命中 mock，未带前缀的 `/api/users` 不命中（`test/build.test.ts` 的 base 分组分别用真实 `dev:9` / `dev:10` 覆盖）。

客户端侧：

- `config 9` 的 `test/adapter-base.test.ts`（`pnpm test:base`）走与产物一致的静态导入链，双向断言「`/app/api/users` 命中 / `/api/users` 404」；带前缀有两种写法，`baseURL: '/app'` + `/api/users`（`axios.getUri` 拼成 `/app/api/users`）或直接写全 `/app/api/users`，两条都覆盖到了。
- `config 10` 的客户端行为不在 vitest 里验证：vitest 的 server base 固定在根路径，插件兜底拿到的 `resolvedConfig.base` 与真实 dev/build 环境不同，所以在那边跑同一份断言没有意义。

## 产物端 mock（config 9 / 10，`mockIn: 'client'`）

`mockIn: 'build'` / `'client'` 都会在 `vite build` 时把 mock 目录编进产物。为了让这件事真的被用到（而不是只满足断言），example 里有一个真实的产物端页面：

- `mock-client.html` + `src/mock-client-entry.ts`：静态 import `axios-adapter`，`baseURL: '/app'` + 请求 `/api/users`，打开产物页面就能拿到 mock 数据；
- 两个配置的 `build.rolldownOptions.input` 都挂了 `mockClient: resolve(root, 'mock-client.html')`。

`test/build.test.ts` 的 `build:9 / build:10` 用例对产物做四层断言：构建成功 → 产物 JS 含 `alice@example.com` / `bob@example.com`（mock 数据确实被打包）→ 产物里路径带 `app/api/users` 前缀（base 也编进了客户端路由表）→ `dist/9|10/mock-client.html` 里确实引用了 `mockClient-` chunk（防止出现没人加载的孤立入口）。

## 前端注入开关（config 11，`mockIn: 'build'`）

`config 11` 只配 `mockIn: 'build'`：dev/serve 阶段 `command` 是 `serve`，判定 `mockIn === 'client' || (mockIn === 'build' && command === 'build')` 为假，虚拟模块不下发路由表，`createMockAdapter()` 返回 `undefined`，前端拿不到任何 mock 数据——`test/no-client-mock.test.ts` 断言的就是这一点。与此同时，dev 端的 fastify mock 不受影响（`test/build.test.ts` 的 `dev:11` 用例验证 `/api/users` 照常命中）。

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
pnpm dev:9          # 显式 base '/app'
pnpm dev:10         # base 兜底（只配 Vite base）
pnpm dev:11         # mockIn: 'build'，前端无 mock

# 构建模式
pnpm build:1        # ... build:2 ~ build:11 各对应一套配置

# 集成测试
pnpm test                # config 8：mockIn: 'client' 下的 adapter 链路 + 全部 dev/build
pnpm test:base           # config 9：显式 base '/app' 下的客户端 adapter
pnpm test:no-client-mock # config 11：mockIn: 'build' 时前端拿不到 mock
```

## 注意：isAfter 选项

`isAfter: true` 在 Vite 8 下会让 mock 中间件挂载在 Vite 内置中间件之后。
由于 Vite 的 SPA fallback 会拦截 GET 形式请求，此时 GET / POST 形式的 mock 路由都不再可靠命中，
属于 Vite 8 的固有限制（非本插件引入）。因此 `config 7` 仅验证 `isAfter: true` 不破坏页面服务、
插件可正常启动；默认（`isAfter: false`）才是 mock 路由完整可用的推荐配置。
