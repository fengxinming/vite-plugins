import { base, routeOptions, routes } from 'virtual:mock-routes';

import { match } from './client/matcher';
import { normalizeRoutes } from './client/normalize';
import type { MockRequest, MockResponse } from './types';

// base 经 normalizeRoutes（内部 withBase）在客户端装载时编进路径正则，与 dev 端
// fastify 的 prefix 注册同源；调用方用带前缀的路径命中（axios baseURL 或直接写全路径）。
export const mockRoutes = normalizeRoutes(routes, routeOptions, base);

export async function request(req: MockRequest): Promise<MockResponse> {
  return match(req, mockRoutes, routeOptions);
}
