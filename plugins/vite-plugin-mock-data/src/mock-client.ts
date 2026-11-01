import { routeOptions, routes } from 'virtual:mock-routes';

import { match } from './client/matcher';
import { normalizeRoutes } from './client/normalize';
import type { MockRequest, MockResponse } from './types';

// 路由表构建期固化、运行期不变，模块装载时编译一遍即可；
// 放进 request() 里会让每条请求都重新 pathToRegexp + 排序。
const clientRoutes = normalizeRoutes(routes, routeOptions);

export function request(req: MockRequest): Promise<MockResponse> {
  return match(req, clientRoutes, routeOptions);
}
