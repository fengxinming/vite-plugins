import './index.css';

import React, { useState, version } from 'react';
import ReactDOM from 'react-dom';

function App() {
  const [count, setCount] = useState(0);
  return (
    <>
      <p>{version}</p>
      <h1>Count: {count}</h1>
      <button onClick={() => setCount((prev) => prev + 1)}>Click me</button>
    </>
  );
}

ReactDOM.render(
  <App />,
  document.getElementById('root')
);
