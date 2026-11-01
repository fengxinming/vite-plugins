import type { MatchContext } from '../_types';
import type { MockResponse } from '../types';

/** 常用 HTTP 状态码对应的原因短语，未列出的走 `statusTextFor` 的 'Error' 兜底 */
const REASON_PHRASES: Record<number, string> = {
  200: 'OK',
  201: 'Created',
  204: 'No Content',
  301: 'Moved Permanently',
  302: 'Found',
  304: 'Not Modified',
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  405: 'Method Not Allowed',
  408: 'Request Timeout',
  409: 'Conflict',
  422: 'Unprocessable Entity',
  429: 'Too Many Requests',
  500: 'Internal Server Error',
  502: 'Bad Gateway',
  503: 'Service Unavailable',
  504: 'Gateway Timeout'
};

/** 由状态码推导原因短语；未命中常用表时统一兜底 'Error' */
export function statusTextFor(code: number): string {
  return REASON_PHRASES[code] ?? 'Error';
}

function createMockReply() {
  const state = {
    statusCode: 200,
    statusText: statusTextFor(200),
    headers: {} as Record<string, string>,
    body: undefined as any,
    sent: false
  };

  const reply: any = {
    get sent() {
      return state.sent;
    },

    code(n: number) {
      state.statusCode = n;
      state.statusText = statusTextFor(n);
      return reply;
    },
    status(n: number) {
      state.statusCode = n;
      state.statusText = statusTextFor(n);
      return reply;
    },

    type(t: string) {
      state.headers['content-type'] = t;
      return reply;
    },
    header(k: string, v: any) {
      state.headers[k.toLowerCase()] = String(v);
      return reply;
    },
    headers(h: Record<string, any>) {
      for (const [k, v] of Object.entries(h)) {
        state.headers[k.toLowerCase()] = String(v);
      }
      return reply;
    },

    send(payload?: any) {
      state.body = payload;
      state.sent = true;
      return reply;
    },

    redirect(url: string, code = 302) {
      state.statusCode = code;
      state.headers['location'] = url;
      state.sent = true;
      return reply;
    },

    sendFile() {
      throw new Error(
        '[mock-data] reply.sendFile() 在浏览器打包环境不受支持，请改用静态对象或函数返回内容'
      );
    },

    toResponse(): MockResponse {
      const headers = { ...state.headers };
      let data = state.body;

      if (data === undefined || data === null) {
        data = '';
        if (!headers['content-type']) {
          headers['content-type'] = 'text/plain; charset=utf-8';
        }
      }
      else if (typeof data === 'string') {
        if (!headers['content-type']) {
          headers['content-type'] = 'text/plain; charset=utf-8';
        }
      }
      else if (data instanceof Uint8Array) {
        if (!headers['content-type']) {
          headers['content-type'] = 'application/octet-stream';
        }
      }
      else {
        if (!headers['content-type']) {
          headers['content-type'] = 'application/json; charset=utf-8';
        }
        data = JSON.stringify(data);
      }

      return {
        status: state.statusCode,
        statusText: state.statusText,
        headers,
        data
      };
    }
  };

  return reply;
}

function staticResponse(value: any): MockResponse {
  const reply = createMockReply();
  reply.send(value);
  return reply.toResponse();
}

function toFastifyRequest(ctx: MatchContext) {
  return {
    method: ctx.method,
    url: ctx.url,
    params: ctx.params,
    query: ctx.query,
    body: ctx.body,
    headers: ctx.headers
  };
}

export async function executeHandler(value: any, ctx: MatchContext): Promise<MockResponse> {
  // 静态值：对象 / 数组 / 字符串 / 数字 / null
  if (typeof value !== 'function') {
    return staticResponse(value);
  }

  const reply = createMockReply();
  const request = toFastifyRequest(ctx);

  const resolved = await Promise.resolve(value(request, reply));

  // handler 未调用 reply.send()，但 return 了非 reply 值时自动发送
  if (!reply.sent && resolved !== undefined && resolved !== reply) {
    reply.send(resolved);
  }

  return reply.toResponse();
}
