'use strict';

const { send } = require('vite');
const crypto = require('crypto');
const getRouter = require('find-my-way');

const runtimePublicPath = '/@react-refresh';
const preambleCode = `import RefreshRuntime from "__BASE__${runtimePublicPath.slice(1)}";`
+ 'RefreshRuntime.injectIntoGlobalHook(window);'
+ 'window.$RefreshReg$ = () => {};'
+ 'window.$RefreshSig$ = () => (type) => type;'
+ 'window.__vite_plugin_react_preamble_installed__ = true;';

function sanitizeUrl(url) {
  for (let i = 0, len = url.length; i < len; i++) {
    const charCode = url.charCodeAt(i);
    // Some systems do not follow RFC and separate the path and query
    // string with a `;` character (code 59), e.g. `/foo;jsessionid=123456`.
    // Thus, we need to split on `;` as well as `?` and `#`.
    if (charCode === 63 || charCode === 59 || charCode === 35) {
      return url.slice(0, i);
    }
  }
  return url;
}

/**
 * create module script string
 *
 * @param {string} id
 * @param {string} base
 * @param {string} url
 * @param {object} opts
 * @returns {string}
 */
function moduleScript(id, base, url, { inject, async, defer }) {
  if (inject) {
    let s = `var ${id} = document.getElementById('${id}');`
      + `var $${inject} = document.querySelector('${inject}');`
        + `${id}&&$${inject}.removeChild(${id});`
        + `${id} = $${inject}.appendChild(document.createElement('script'));`
        + `${id}.setAttribute('id', '${id}');`
        + `${id}.setAttribute('type', 'module');`
        + `${id}.setAttribute('src', '${base}${url}');`;

    if (async) {
      s += `${id}.setAttribute('async', true);`;
    }

    if (defer) {
      s += `${id}.setAttribute('defer', true);`;
    }

    s += 'var preambleCode = document.head.appendChild(document.createElement(\'script\'));'
    + `preambleCode.appendChild(document.createTextNode(${preambleCode.replace('__BASE__', base)}));`;

    return s;
  }

  return `document.writeln('<script type="module">${preambleCode.replace('__BASE__', base)}</script>');`
    + `document.write('<script id="${id}" type="module" src="${base}${url}"></script>');`;
}

const router = getRouter();

module.exports = function ({
  async,
  defer,
  mapping
} = {}) {
  let keys;
  if (!mapping || !(keys = Object.keys(mapping)).length) {
    return null;
  }

  let base = '';
  keys.forEach((n, i) => {
    router.on('GET', n, (req, res, params) => {
      const target = mapping[keys[i]];
      const id = `m${crypto.createHash('md5').update(target).digest('hex')}`;
      send(req, res, moduleScript(id, base, target.slice(1), {
        async,
        defer
      }), 'application/javascript');
    });
  });

  return {
    name: 'module-script',

    config(config) {
      base = config.base || '';
      // console.log(config.base);
    },

    // configResolved(resolvedConfig) {
    //   // base = resolvedConfig.base;
    //   console.log(resolvedConfig.base);
    // },

    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const handle = router.find(req.method, sanitizeUrl(req.url), router.constrainer.deriveConstraints(req));
        if (handle === null) {
          return next();
        }
        return handle.handler(req, res, handle.params, handle.store);
      });
    }
  };
};
