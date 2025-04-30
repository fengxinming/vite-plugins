import '../index.css';

import { StrictMode, useState, version } from 'react';
import { createRoot } from 'react-dom/client';
function App() {
  const [count, setCount] = useState(0);
  return (
    <div className="box">
      <h1>Count: {count}</h1>
      <button onClick={() => setCount((prev) => prev + 1)}>Click me</button>
    </div>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {version}
    <App />
  </StrictMode>,
);
