import '@linkdesign/components/dist/index.css';
import React from 'react';
// import ReactDOM from 'react-dom/client';
import ReactDOM from 'react-dom';
import App from './App';

const appDOM = document.getElementById('app');
if (!appDOM) {
  throw new Error('当前页面不存在 <div id="app"></div> 节点.');
}

// ReactDOM.createRoot(document.getElementById('app')).render(
//   <React.StrictMode>
//     <App />
//   </React.StrictMode>
// );
ReactDOM.render(<App />, appDOM);
