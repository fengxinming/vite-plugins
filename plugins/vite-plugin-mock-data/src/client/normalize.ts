import { pathToRegexp } from 'path-to-regexp';

import type { MockClientRoute, MockRouteOptions } from '../_types';
import { parseRouteKey } from '../lib/parseRouteKey';
import { RouteValue } from '../types';

/**
 * 路径具体度评分：静态段 +1，`:param` -10，`*` -100。
 * 评分高者优先匹配，保证 `/api/users/me` 先于 `/api/users/:id` 先于 `/api/*`。
 */
function specificity(path: string): number {
  return path.split('/').reduce((score, seg) => {
    if (seg.startsWith('*')) {
      return score - 100;
    }
    if (seg.startsWith(':')) {
      return score - 10;
    }
    return score + 1;
  }, 0);
}

/**
 * 把构建期下发的 base 前缀拼到路由路径上，与 dev 端 fastify 的 prefix 注册对齐。
 *
 * fastify 在 prefix 以 `/` 结尾时会去掉 path 开头的 `/`（见 fastify/lib/route.js），
 * 这里做同样处理，避免 `/app/` + `/api/users` 拼成 `/app//api/users`——
 * 否则开启 ignoreDuplicateSlashes 时会出现 dev 端命中、产物端不命中的漂移。
 * base 为空串或 `/` 时视为无前缀，路径保持原样。
 */
function withBase(base: string | undefined, pathname: string): string {
  if (!base || base === '/') {
    return pathname;
  }
  return base.replace(/\/+$/, '') + pathname.replace(/^\/+/, '/');
}

/**
 * 把 mock 配置数组编译成浏览器端可直接 `exec` 的路由表。
 *
 * 路径在此处用 path-to-regexp 编译，发生在浏览器端模块装载阶段（仅一次），
 * 因此 path-to-regexp 会随客户端产物一起进入浏览器包。
 * 编译选项来自 `routeOptions`（由 fastify `routerOptions` 三级取值推导）：
 *   - `sensitive` → 大小写是否敏感（← caseSensitive，默认 true）
 *   - `trailing`  → 是否容忍尾随分隔符（← ignoreTrailingSlash，默认 false，
 *                    直接烤进正则，matcher 无需额外处理）
 * `collapseSlashes` / `maxParamLength` 无法编码进正则，由 matcher 在匹配前做对称预处理。
 * `base` 是构建期下发的路由前缀（与 dev 端 fastify 的 prefix 同源），在此处编进
 * 路径后再编译；matcher 拿到的仍是可以直接 exec 的活正则，无需感知前缀。
 * 所有路由同加前缀，具体度排序的相对次序不变。
 */
export function normalizeRoutes(
  routes: Array<Record<string, RouteValue>>,
  routeOptions: MockRouteOptions,
  base: string
): MockClientRoute[] {
  const result: MockClientRoute[] = [];

  for (const route of routes) {
    for (const [key, value] of Object.entries(route)) {
      const { methods, pathname } = parseRouteKey(key);
      const path = withBase(base, pathname);
      const { regexp, keys } = pathToRegexp(path, {
        sensitive: routeOptions.sensitive,
        trailing: routeOptions.trailing
      });
      const keyNames = keys.map((k) => k.name);

      for (const method of methods) {
        result.push({ method, path, regexp, keys: keyNames, value });
      }
    }
  }

  // 更具体的路径优先
  result.sort((a, b) => specificity(b.path) - specificity(a.path));

  return result;
}
