import { createElement, Fragment, useState, version } from 'react';
import ReactDOM from 'react-dom';

function App() {
  const [count, setCount] = useState(0);
  return createElement(Fragment, null,
    createElement('p', null, version),
    createElement('h1', null, `Count: ${count}`),
    createElement('button', {
      onClick: () => setCount((prev) => prev + 1)
    }, 'Click me')
  );
}

ReactDOM.render(
  createElement(App),
  document.getElementById('root')
);
