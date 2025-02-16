const { runQueue } = require('celia');

const fns = [
  (a) => {
    a.i++;
  },
  (a) => {
    a.i += 2;
  }
];
const a = { i: 0 };
runQueue(
  fns,
  (middleware, next) => {
    middleware(a);
    next();
  },
  () => {
    a.i += 3;
    console.info(a.i);
    // 6
  });
