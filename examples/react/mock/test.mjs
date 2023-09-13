export default {
    '/hello': 'hello',
  
    '/hello2'(req, res) {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'text/html');
      res.end('hello2');
    },
  
    '/hello3': {
      handler(req, res) {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/html');
        res.end('hello3');
      }
    },
  
    '/json': {
      handler: { hello: 1 }
    },
  
    '/package': {
      file: './package.json'
    }
};