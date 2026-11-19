/**
 * Vue 应用入口示例 — 配合 vue external 使用
 */
import { createApp } from 'vue';

import VueApp from './VueApp.vue';

const el = document.getElementById('app');
if (el) {
  createApp(VueApp).mount(el);
}
