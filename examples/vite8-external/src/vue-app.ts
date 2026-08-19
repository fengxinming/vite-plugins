/**
 * Vue 应用入口示例 — 配合 vue external 使用
 */
import { createApp, defineComponent, h } from 'vue';

const App = defineComponent({
  setup() {
    return () => h('div', 'Hello from vite-plugin-external + Vue');
  }
});

const el = document.getElementById('app');
if (el) {
  createApp(App).mount(el);
}
