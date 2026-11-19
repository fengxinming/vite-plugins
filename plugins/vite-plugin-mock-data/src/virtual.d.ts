declare module 'virtual:mock-routes' {
  import type { MockRouteOptions } from './_types';
  import type { RouteValue } from './types';

  /** mock 路由清单：由 `createMockRoutesSource` 生成源码、经 resolveId/load 注入（每个文件 default 导出一个 RouteConfig） */
  export const routes: Array<Record<string, RouteValue>>;
  /** 由 fastify `routerOptions` 三级取值推导的路径编译选项，随产物下发给浏览器端 */
  export const routeOptions: MockRouteOptions;
  /** 构建期下发的路由前缀，与 dev 端 configureServer 注册 fastify 路由时的 prefix 同源；未配置时为空串 */
  export const base: string;
}
