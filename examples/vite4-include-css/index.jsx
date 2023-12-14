import React, { useState } from 'react';
import ReactDOM from 'react-dom';

import './index.css';

function App() {
  const [count, setCount] = useState(0);
  return (
    <>
      <h1>Count: {count}</h1>
      <button onClick={() => setCount((prev) => prev + 1)}>Click me</button>
    </>
  );
}

ReactDOM.render(
  <App />,
  document.getElementById('root')
);
