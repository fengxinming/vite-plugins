'use strict';

const crypto = require('crypto');

const runtimePublicPath = '/@react-refresh';
const preambleCode = `import RefreshRuntime from "__BASE__${runtimePublicPath.slice(1)}";`
+ 'RefreshRuntime.injectIntoGlobalHook(window);'
+ 'window.$RefreshReg$ = () => {};'
+ 'window.$RefreshSig$ = () => (type) => type;'
+ 'window.__vite_plugin_react_preamble_installed__ = true;';


/**
 * create module script string
 *
 * @param {string} id
 * @param {string} base
 * @param {string} url
 * @param {object} opts
 * @returns {string}
 */
function moduleScript(id, base, url, { async, defer }) {
  if (async) {
    let s = `var ${id} = document.getElementById('${id}');`
        + `${id}&&document.body.removeChild(${id});`
        + `${id} = document.body.appendChild(document.createElement('script'));`
        + `${id}.setAttribute('id', '${id}');`
        + `${id}.setAttribute('type', 'module');`
        + `${id}.setAttribute('src', '${base}${url}');`;

    if (async) {
      s += `${id}.setAttribute('async', true);`;
    }

    if (defer) {
      s += `${id}.setAttribute('defer', true);`;
    }

    return s;
  }

  return `document.writeln('<script type="module">${preambleCode.replace('__BASE__', base)}</script>');`
    + `document.write('<script id="${id}" type="module" src="${base}${url}"></script>');`;
}

module.exports = function ({
  async,
  defer,
  mapping
} = {}) {
  let base = '';

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

    load(id) {
      const target = mapping[id];
      if (target) {
        const id = `m${crypto.createHash('md5').update(target).digest('hex')}`;
        return moduleScript(id, base, target.slice(1), {
          async,
          defer
        });
      }
    }
  };
};
