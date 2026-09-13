<script setup lang="ts">
import { onMounted, ref } from 'vue';

interface User {
  id: number;
  name: string;
  email?: string;
}

const users = ref<User[]>([]);
const error = ref<string | null>(null);

onMounted(async () => {
  try {
    const res = await fetch('/api/users');
    users.value = await res.json();
  } catch (e) {
    error.value = String(e);
  }
});
</script>

<template>
  <main class="app">
    <h1>Vue + vite-plugin-mock-data</h1>
    <p>
      下面的用户列表由 mock 接口 <code>GET /api/users</code> 提供，页面本身经 Vite
      转译管线处理（证明 mock 插件没有劫持 <code>.vue</code> 单文件组件）。
    </p>
    <p v-if="error" class="error">加载失败：{{ error }}</p>
    <ul>
      <li v-for="u in users" :key="u.id">
        {{ u.name }}<span v-if="u.email"> &lt;{{ u.email }}&gt;</span>
      </li>
    </ul>
  </main>
</template>

<style scoped>
.app {
  font-family: system-ui, -apple-system, sans-serif;
  max-width: 640px;
  margin: 2rem auto;
  padding: 0 1rem;
  line-height: 1.6;
}

.app code {
  background: #f3f3f3;
  padding: 0 0.25rem;
  border-radius: 4px;
}

.error {
  color: #d33;
}
</style>
