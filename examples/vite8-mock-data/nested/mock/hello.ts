/**
 * 专属于 config 5（cwd 验证）的 mock 目录。
 *
 * config 5 把 cwd 指向 nested/（与 process.cwd() 不同），并用相对路径 './mock' 引用这里。
 * 若插件错误地按 process.cwd() 解析相对 routes，这条路由就会 404 —— 以此区分实现是否
 * 真正使用了配置里的 cwd。
 * Belongs to config 5 only: proves relative routes resolve against the configured cwd.
 */
export default {
  'GET /api/hello': async () => {
    return { from: 'nested-mock' };
  }
};
