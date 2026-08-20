/**
 * mock 路由格式：
 *   key = "METHOD /path"
 *   value = handler 函数 或 { handler, options } 对象
 */
export default {
  'GET /api/users': () => {
    return [
      { id: 1, name: 'Alice', email: 'alice@example.com' },
      { id: 2, name: 'Bob', email: 'bob@example.com' }
    ];
  },

  'POST /api/users': (req: any) => {
    return { id: 3, ...req.body };
  }
};
