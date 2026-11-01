import type { HTTPMethods } from 'fastify';

import type { ParsedRouteKey } from '../_types';

/**
 * 解析路由 key：`"METHOD /path"`，支持 `METHOD1/METHOD2 /path` 与 `:param`。
 * 缺省 METHOD 时默认 GET。
 */
export function parseRouteKey(xpath: string): ParsedRouteKey {
  const [first, second] = xpath.split(' ');
  const pathname = second ?? first;
  const methods = (second ? first : 'GET').toUpperCase().split('/') as HTTPMethods[];
  return { methods, pathname };
}
