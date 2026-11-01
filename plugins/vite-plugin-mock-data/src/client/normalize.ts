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
 * 把 mock 配置数组编译成浏览器端可直接 `exec` 的路由表。
 *
 * 路径在此处用 path-to-regexp 编译，发生在浏览器端模块装载阶段（仅一次），
 * 因此 path-to-regexp 会随客户端产物一起进入浏览器包。
 * 编译选项来自 `routeOptions`（由 fastify `routerOptions` 三级取值推导）：
 *   - `sensitive` → 大小写是否敏感（← caseSensitive，默认 true）
 *   - `trailing`  → 是否容忍尾随分隔符（← ignoreTrailingSlash，默认 false，
 *                    直接烤进正则，matcher 无需额外处理）
 * `collapseSlashes` / `maxParamLength` 无法编码进正则，由 matcher 在匹配前做对称预处理。
 */
export function normalizeRoutes(
  routes: Array<Record<string, RouteValue>>,
  routeOptions: MockRouteOptions
): MockClientRoute[] {
  const result: MockClientRoute[] = [];

  for (const route of routes) {
    for (const [key, value] of Object.entries(route)) {
      const { methods, pathname } = parseRouteKey(key);
      const { regexp, keys } = pathToRegexp(pathname, {
        sensitive: routeOptions.sensitive,
        trailing: routeOptions.trailing
      });
      const keyNames = keys.map((k) => k.name);

      for (const method of methods) {
        result.push({ method, path: pathname, regexp, keys: keyNames, value });
      }
    }
  }

  // 更具体的路径优先
  result.sort((a, b) => specificity(b.path) - specificity(a.path));

  return result;
}
