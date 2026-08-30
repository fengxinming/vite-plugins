/**
 * GET /api/users/:id
 * 文件名 [id].ts → 路由参数 :id（fastify 同 find-my-way 参数语法）
 */
const users = [
  { id: 1, name: 'Alice', email: 'alice@example.com' },
  { id: 2, name: 'Bob', email: 'bob@example.com' }
];

export default {
  'GET /api/users/:id': async (request: any) => {
    const user = users.find((u) => u.id === Number(request.params.id));
    return user || { error: 'Not found' };
  },

  'PUT /api/users/:id': async (request: any) => {
    return { id: Number(request.params.id), ...request.body, updated: true };
  },

  'DELETE /api/users/:id': async (request: any) => {
    return { id: Number(request.params.id), deleted: true };
  }
};
