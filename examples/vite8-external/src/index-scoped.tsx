/**
 * 专用于 vite.config.2.mts（函数 externals 示例）的入口文件。
 * 独立的入口文件避免影响其他使用 src/index.tsx 的配置。
 *
 * 故意引入：
 *   1. react / react-dom/client — 触发函数 externals 的命名全局变量分支
 *   2. @scope/foo — 触发函数 externals 的 @scope/* 前缀 pure external 分支
 */
import { foo } from '@scope/foo';
import React from 'react';
import { createRoot } from 'react-dom/client';

function App() {
  // 引用 foo 防止 tree-shake，确保 @scope/* 分支被真正触发
  return React.createElement('div', null, 'Hello from scoped example', String(foo));
}

const root = createRoot(document.getElementById('app')!);
root.render(React.createElement(App));
