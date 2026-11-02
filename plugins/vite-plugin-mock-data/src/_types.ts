import type { HTTPMethods } from 'fastify';
import { Connect } from 'vite';

/**
 * connect 中间件的 next 回调在 fastify 404 handler 之间的传递载体。
 *
 * fastify 以 `app.routing(req, res)` 嵌入 connect 中间件时，未匹配的请求会
 * 走到 fastify 的 404 handler，但那里拿不到 connect 的 `next`。因此
 * configureServer 在 middleware 里先把 `next` 挂到 `request.raw.__mockNext`，
 * 404 handler 取出并调用，让请求落回 Vite 的中间件链（配合 reply.hijack()）。
 */
export type ViteRequest = Connect.IncomingMessage & { __mockNext?: () => void };

/** 路由键 `'GET/POST /path'` 的拆解结果（dev 注册与浏览器端归一化共用） */
export interface ParsedRouteKey {
  /** 拆解出的 HTTP 方法列表，已大写 */
  methods: HTTPMethods[];
  /** 路径模式，含 `:param` 等 path-to-regexp 语法 */
  pathname: string;
}

/**
 * 浏览器端的一条 mock 路由：由 `normalizeRoutes` 在运行时把虚拟模块下发的
 * 路由清单编译得到，供 matcher 逐条 `exec` 匹配。
 *
 * `regexp` / `keys` 是路径模式编译后的结果。编译发生在浏览器端运行时内部，
 * 因此 matcher 拿到的是可以直接 `exec` 的活正则，自身不必依赖 path-to-regexp。
 */
export interface MockClientRoute {
  method: string;
  /** 原始路径模式，含 `:param` 等 path-to-regexp 语法（报错与排查时回显用） */
  path: string;
  /** `path` 编译出的正则，用于 `exec` 请求 pathname */
  regexp: RegExp;
  /** 参数名，与 `regexp` 的捕获组按顺序一一对应 */
  keys: string[];
  value: unknown;
}

/**
 * 运行时入口编译路径所需的选项。
 *
 * 值由构建期按 fastify 的三级取值（`routerOptions` > 顶层 > 默认值）推导，
 * 经虚拟模块注入入口——因此这里与 fastify 的 `routerOptions` 是**映射关系**
 * 而非同一份结构：`trailing` 对应 `ignoreTrailingSlash` 的取反语义，
 * `collapseSlashes` 则是 path-to-regexp 无原生能力、需自行预处理的补偿项。
 */
export interface MockRouteOptions {
  /** 大小写是否敏感（← `caseSensitive`，默认 true） */
  sensitive: boolean;
  /** 是否容忍尾随分隔符（← `ignoreTrailingSlash`，默认 false） */
  trailing: boolean;
  /** 是否折叠连续斜杠（← `ignoreDuplicateSlashes`，默认 false） */
  collapseSlashes: boolean;
  /** 单个路径参数的最大长度（← `maxParamLength`，默认 100） */
  maxParamLength: number;
}

/**
 * 匹配上下文：matcher 解析出请求信息后，交给 `executeHandler` 执行
 * 静态数据 / 函数 handler。字段与 fastify 的 request 对齐。
 */
export interface MatchContext {
  method: string;
  url: string;
  pathname: string;
  params: Record<string, string>;
  query: Record<string, any>;
  body: any;
  headers: Record<string, string>;
}

/** 归一化后的查询参数：同名键取数组，与 dev 端 fastify 的 query 语义一致 */
export type QueryParams = Record<string, string | string[]>;
