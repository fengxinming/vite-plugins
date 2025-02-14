export default {
  '/world': 'world',

  '/world2'(req, res) {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html');
    res.end('world2');
  },

  '/world3': {
    handler(req, res) {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'text/html');
      res.end('world3');
    }
  },

  '/json2': {
    handler: { world: 1 }
  },

  '/package2': {
    file: './package.json'
  }
};
