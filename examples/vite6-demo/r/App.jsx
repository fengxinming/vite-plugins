import React, { useState, version } from 'react';

export default function App() {
  const [count, setCount] = useState(0);
  return (
    <div className="box">
      <p>{version}</p>
      <h1>Count: {count}</h1>
      <button onClick={() => setCount((prev) => prev + 1)}>Click me</button>
    </div>
  );
}
