# 使用示例

`vite-plugin-mock-data` 用极简的配置为 Vite 开发服务器添加 mock API。每条 mock 路由把请求路径映射到「静态数据」或「函数 handler」之一；底层是一个以 connect 中间件形式嵌入的 fastify 实例，因此未匹配的请求会继续流经 Vite 自身的中间件链。

## 安装

安装方式见 [快速开始](./quick-start)。

## 在目录中定义路由

把 `routes` 指向一个目录，目录内 `.ts` / `.js` / `.mjs` 文件的默认导出会作为路由对象被加载：

`vite.config.ts`

```ts
import { defineConfig } from 'vite';
import mockData from 'vite-plugin-mock-data';

export default defineConfig({
  plugins: [
    mockData({
      routes: './mock'
    })
  ]
});
```

```txt
.
└── mock
    └── index.ts
```

```ts
export default {
  '/text': 'hello world',
  '/user': { id: 1, name: 'mock' }
};
```

也可以传入目录数组，或将目录与内联对象混合：

```ts
mockData({
  routes: ['./mock', './mock2']
})
```

## 路由匹配

路由对象中的每个 key 是一个路由匹配规则，格式为 `"METHOD /path"`；省略 method 时默认为 `GET`。多个方法用 `/` 分隔，`/path` 中的 `:param` 表示路径参数（fastify 语法）。

| Key | 匹配 |
| --- | --- |
| `'/api/users'` | `GET /api/users` |
| `'GET /api/users'` | `GET /api/users` |
| `'POST /api/users'` | `POST /api/users` |
| `'GET/POST /api/users'` | `GET` **或** `POST` |
| `'/api/users/:id'` | `GET /api/users/1`、`/api/users/2`、… |

## 路由值

路由值只有两种形态：**静态数据**（任意非函数值）或**函数 handler**。插件在运行时通过 `typeof value === 'function'` 判断属于哪一种——没有包裹对象，也不需要额外字段。

### 静态数据

任意可 JSON 序列化的值会原样发送：

- **对象与数组** 序列化为 JSON（`application/json`）。
- **原始值**（`string` / `number` / `boolean` / `null`）经 `String()` 转换后按 `text/plain` 发送。

```ts
export default {
  '/text': 'hello world',           // → text/plain  "hello world"
  '/count': 42,                     // → text/plain  "42"
  '/flag': true,                    // → text/plain  "true"
  '/user': { id: 1, name: 'mock' }, // → application/json
  '/list': [1, 2, 3]                // → application/json
};
```

### 函数 handler

函数原样透传给 fastify，使用原生的 fastify `(request, reply)` 签名。fastify 支持两种响应方式：

- 在 `async` handler 中 **return 一个值** —— 自动发送（对象序列化为 JSON）；
- 自行调用 `reply.send()` / `reply.type()` —— 完全控制状态码与响应头。

```ts
export default {
  // 回显请求体（自动发送 JSON）
  'POST /echo'(request, reply) {
    reply.send(request.body);
  },

  // 返回 HTML，并显式设置 content-type
  '/page'(request, reply) {
    reply.type('text/html').send('<h1>Hello</h1>');
  },

  // async handler：返回值会被自动发送
  '/async'(request, reply) {
    return { ok: true };
  }
};
```

### 从磁盘提供文件

插件以 `cwd` 为根注册了 `@fastify/static`，因此任意函数 handler 都可以通过 `reply.sendFile()` 提供文件：

```ts
export default {
  '/package.json': async (request, reply) => {
    return reply.sendFile('package.json', process.cwd());
  }
};
```

### 未匹配的请求会落回 Vite

插件只处理匹配到的 mock 路由。任何未匹配的请求都会继续走 Vite 自身的中间件链——静态资源、模块转换、SPA fallback、代理等。插件本身**不会**主动返回 `404`，这个决定权始终在 Vite。

## 内联路由

除了目录，也可以直接在配置中传入路由对象：

```ts
import { defineConfig } from 'vite';
import mockData from 'vite-plugin-mock-data';

export default defineConfig({
  plugins: [
    mockData({
      routes: {
        '/text': 'hello',
        '/user': { id: 1 },
        'POST /echo'(request, reply) {
          reply.send(request.body);
        }
      }
    })
  ]
});
```

## TypeScript

导入导出的类型以获得完整的类型提示：

```ts
import type { RouteConfig } from 'vite-plugin-mock-data';

const routes: RouteConfig = {
  '/user': { id: 1 },
  '/echo'(request, reply) {
    reply.send(request.body);
  }
};

export default routes;
```

完整的 `Options` 类型与每个配置项说明见 [配置选项参考](./options)。
