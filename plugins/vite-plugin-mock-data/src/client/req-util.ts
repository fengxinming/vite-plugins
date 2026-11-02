import { QueryParams } from '../_types';


/** 追加一个查询值，同名键自动收敛成数组 */
function appendQuery(target: QueryParams, key: string, value: string): void {
  const prev = target[key];
  if (prev === undefined) {
    target[key] = value;
  }
  else if (Array.isArray(prev)) {
    prev.push(value);
  }
  else {
    target[key] = [prev, value];
  }
}

/** 解析查询串部分（`?` 之后的内容），同名键收敛为数组 */
function parseSearch(search: string): QueryParams {
  const out: QueryParams = {};
  if (!search) {
    return out;
  }
  new URLSearchParams(search).forEach((value, key) => appendQuery(out, key, value));
  return out;
}

/**
 * 解析 url 上的查询串。
 *
 * `?a=1&a=2` 产出 `{ a: ['1', '2'] }`，与 dev 端保持一致。
 */
function parseQuery(url: string): QueryParams {
  const start = url.indexOf('?');
  return start === -1 ? {} : parseSearch(url.slice(start + 1));
}

/**
 * 合并 url 上的查询串与 `req.query`。
 *
 * 同名键必须**累加成数组**而不是覆盖 —— 直接展开对象会让
 * `?tag=a` 与 `query: { tag: ['b','c'] }` 变成只剩后者。
 */
export function mergeQuery(url: string, query?: QueryParams): QueryParams {
  const out = parseQuery(url);
  if (!query) {
    return out;
  }

  for (const [key, value] of Object.entries(query)) {
    if (Array.isArray(value)) {
      value.forEach((item) => appendQuery(out, key, item));
    }
    else {
      appendQuery(out, key, value);
    }
  }

  return out;
}

/** 取请求体，还原 axios 在进入 adapter 前做的序列化 */
export function parseBody(body: unknown, contentType?: string): unknown {
  if (typeof body !== 'string' || !body) {
    return body;
  }
  // 表单编码：dev 端由 @fastify/formbody 解析成对象，浏览器端同样还原。
  // 附带 `=` 判断：axios 对字符串 data 会默认带上 urlencoded 头，
  // 若只看 content-type，纯文本 body 会被误解析成 `{ 'plain text': '' }`。
  if (contentType && /application\/x-www-form-urlencoded/i.test(contentType) && body.includes('=')) {
    return parseSearch(body);
  }
  try {
    return JSON.parse(body);
  }
  catch {
    return body;
  }
}

/** 去掉 query 与 origin，只留 pathname（matcher 内统一处理） */
export function stripQuery(url: string | undefined): string {
  return (url ?? '').split('?')[0].replace(/^https?:\/\/[^/]+/, '');
}
