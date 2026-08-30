/**
 * mock 路由格式：
 *   key = "METHOD /path"
 *   value = fastify 风格 handler `(request, reply)` 或 { handler, options } 对象
 *   handler 的返回值自动作为响应发送；request.body / request.params 由 fastify 解析
 */
export default {
  'GET /api/users': async () => {
    return [
      { id: 1, name: 'Alice', email: 'alice@example.com' },
      { id: 2, name: 'Bob', email: 'bob@example.com' }
    ];
  },

  'POST /api/users': async (request: any) => {
    return { id: 3, ...request.body };
  }
};
