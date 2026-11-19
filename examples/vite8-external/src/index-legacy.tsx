/**
 * React 16.12 入口 — dev 用 React/ReactDOM（unpkg），build 用 $linkdesign.*（阿里 linkdesign）
 *
 * 16.12 没有 react-dom/client，createRoot 是 18+ 的 API，只能用 ReactDOM.render。
 * 页面由 vite.config.4.mts 的 view() 按 command 分支渲染 CDN：
 *   dev   <script src="https://unpkg.com/react@16.12.0/umd/react.development.js"></script>
 *         <script src="https://unpkg.com/react-dom@16.12.0/umd/react-dom.development.js"></script>
 *   build <script src="//g.alicdn.com/linkdesign/lib/1.0.1/~react.js"></script>
 * 两端同为 React 16.12，只是全局名不同（React/ReactDOM ↔ $linkdesign.React/$linkdesign.ReactDOM）。
 *
 * React 16.12 entry: no react-dom/client, so it uses the legacy ReactDOM.render API.
 */
import React from 'react';
import ReactDOM from 'react-dom';

function App() {
  return (
    <div>Hello from vite-plugin-external + React 16.12</div>
  );
}

// config 4 把 'react-dom' 外置成 UMD 全局（dev: ReactDOM / build: $linkdesign.ReactDOM），
// 运行时 render 是存在的；装的是 @types/react-dom 19，只有类型侧不认识这个 API。
(ReactDOM as any).render(<App />, document.getElementById('app'));
