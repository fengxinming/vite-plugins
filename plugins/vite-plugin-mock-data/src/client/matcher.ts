import type { MockClientRoute, MockRouteOptions } from '../_types';
import type { MockRequest, MockResponse } from '../types';
import { executeHandler, statusTextFor } from './handler';
import { mergeQuery, parseBody, stripQuery } from './req-util';

/**
 * 用构建期编译好的活正则匹配请求。
 *
 * `collapseSlashes` / `maxParamLength` 无法编码进正则，必须在匹配前对 pathname
 * 做对称预处理，才能与 dev 端 fastify 行为一致：
 *   - `collapseSlashes`（← ignoreDuplicateSlashes）：折叠连续 `//`；
 *   - `maxParamLength`（← maxParamLength）：参数值超长则按未命中处理。
 * 大小写 / 尾随分隔符已烤进正则（`routeOptions.sensitive` / `trailing`），此处无需处理。
 */
export async function match(
  req: MockRequest,
  routes: MockClientRoute[],
  routeOptions: MockRouteOptions
): Promise<MockResponse> {
  const { collapseSlashes, maxParamLength } = routeOptions;
  const method = (req.method ?? 'GET').toUpperCase();
  const pathname = stripQuery(req.url);
  // url 上的 query 与调用方传入的 req.query 合并（同名键累加成数组）
  const query = mergeQuery(req.url, req.query);
  const headers = req.headers ?? {};
  const body = parseBody(req.body, headers['Content-Type'] ?? headers['content-type']);

  let testPath = pathname;
  if (collapseSlashes) {
    testPath = testPath.replace(/\/{2,}/g, '/');
  }

  for (const route of routes) {
    if (route.method !== method) {
      continue;
    }

    const m = route.regexp.exec(testPath);
    if (!m) {
      continue;
    }

    const params: Record<string, string> = {};
    let matched = true;
    for (let i = 0; i < route.keys.length; i++) {
      const raw = m[i + 1];
      if (raw === undefined) {
        continue;
      }
      const decoded = decodeURIComponent(raw);
      if (maxParamLength > 0 && decoded.length > maxParamLength) {
        matched = false;
        break;
      }
      params[route.keys[i]] = decoded;
    }

    if (!matched) {
      continue;
    }

    const ctx = {
      method,
      url: req.url,
      pathname,
      params,
      query,
      body,
      headers
    };

    return executeHandler(route.value, ctx);
  }

  return {
    data: null,
    status: 404,
    statusText: statusTextFor(404),
    headers: {}
  };
}
