import React from 'react';
import { createRoot } from 'react-dom/client';

function App() {
  return React.createElement('div', null, 'Hello from vite-plugin-external example');
}

const root = createRoot(document.getElementById('app')!);
root.render(React.createElement(App));
