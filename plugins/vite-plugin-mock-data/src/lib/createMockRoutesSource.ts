import { EOL } from 'node:os';

import { FastifyServerOptions } from 'fastify';

import { MockRouteOptions } from '../_types';

/**
 * 由 fastify `routerOptions` 三级取值（routerOptions > 顶层 > 默认值）推导
 * 构建期路径编译选项，使产物端匹配语义与 dev 端 fastify 一致。
 *
 * 映射关系（非同一份结构）：
 *   sensitive      ← caseSensitive          （默认 true）
 *   trailing       ← ignoreTrailingSlash    （默认 false）
 *   collapseSlashes ← ignoreDuplicateSlashes （默认 false）
 *   maxParamLength  ← maxParamLength         （默认 100）
 */
function resolveRouteOptions(opts?: FastifyServerOptions): MockRouteOptions {
  const ro = opts?.routerOptions;
  const caseSensitive = ro?.caseSensitive ?? opts?.caseSensitive ?? true;
  const ignoreTrailingSlash = ro?.ignoreTrailingSlash ?? opts?.ignoreTrailingSlash ?? false;
  const ignoreDuplicateSlashes = ro?.ignoreDuplicateSlashes ?? opts?.ignoreDuplicateSlashes ?? false;
  const maxParamLength = ro?.maxParamLength ?? opts?.maxParamLength ?? 100;

  return {
    sensitive: caseSensitive,
    trailing: ignoreTrailingSlash,
    collapseSlashes: ignoreDuplicateSlashes,
    maxParamLength
  };
}

export function createMockRoutesSource(
  mockFiles: string[],
  fastifyOptions?: FastifyServerOptions,
) {
  const imports: string[] = [];
  const vars: string[] = [];

  for (let i = 0; i < mockFiles.length; i++) {
    const v = `__m${i}`;
    const f = mockFiles[i];
    imports.push(`import ${v} from ${JSON.stringify(f)};`);
    vars.push(v);
  }

  const routeOptions = resolveRouteOptions(fastifyOptions);

  // routes（mock 文件清单）+ routeOptions（fastify 路由语义）一同注入虚拟模块，
  // 作为构建期「只有构建期才知道的信息」随产物下发浏览器端。
  return imports.concat([
    `export const routes = [${vars.join(', ')}];`,
    `export const routeOptions = ${JSON.stringify(routeOptions)};`
  ]).join(EOL);
}

