/**
 * Vue + JSX 入口示例 — 配合 vue external 使用
 *
 * 这里的 JSX 由 @vitejs/plugin-vue-jsx 编译（不是 React JSX），
 * 编译结果同样从 'vue' 取运行时，因此 vue 走 external 后产物仍然引用全局 Vue。
 */
import { createApp, defineComponent, ref } from 'vue';

const App = defineComponent({
  setup() {
    const count = ref(0);

    return () => (
      <div className="vue-jsx-app">
        <p>Hello from vite-plugin-external + Vue JSX</p>
        <button type="button" onClick={() => count.value++}>count is {count.value}</button>
      </div>
    );
  }
});

const el = document.getElementById('app');
if (el) {
  createApp(App).mount(el);
}
