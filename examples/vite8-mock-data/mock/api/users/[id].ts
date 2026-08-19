/**
 * GET /api/users/:id
 * 文件名 [id].ts → 路由参数 :id
 */
const users = [
  { id: 1, name: 'Alice', email: 'alice@example.com' },
  { id: 2, name: 'Bob', email: 'bob@example.com' }
];

export default {
  'GET /api/users/:id': (req: any) => {
    const user = users.find((u) => u.id === Number(req.params.id));
    return user || { error: 'Not found' };
  },

  'PUT /api/users/:id': (req: any) => {
    return { id: Number(req.params.id), ...req.body, updated: true };
  },

  'DELETE /api/users/:id': (req: any) => {
    return { id: Number(req.params.id), deleted: true };
  }
};
