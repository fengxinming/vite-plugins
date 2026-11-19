import React from 'react';
import { createRoot } from 'react-dom/client';

function App() {
  return (
    <div>Hello from vite-plugin-external example</div>
  );
}

const root = createRoot(document.getElementById('app')!);
root.render(React.createElement(App));
