import { useEffect, useState } from 'react';

interface User {
  id: number;
  name: string;
  email?: string;
}

export default function App() {
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/users')
      .then((r) => r.json())
      .then((data: User[]) => setUsers(data))
      .catch((e) => setError(String(e)));
  }, []);

  return (
    <main className="app">
      <h1>React + vite-plugin-mock-data</h1>
      <p>
        下面的用户列表由 mock 接口 <code>GET /api/users</code> 提供，页面本身经 Vite
        转译管线处理（证明 mock 插件没有劫持 <code>.tsx</code> 模块）。
      </p>
      {error && <p className="error">加载失败：{error}</p>}
      <ul>
        {users.map((u) => (
          <li key={u.id}>
            {u.name}
            {u.email ? ` <${u.email}>` : ''}
          </li>
        ))}
      </ul>
    </main>
  );
}
