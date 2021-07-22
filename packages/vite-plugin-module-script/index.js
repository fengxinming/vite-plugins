'use strict';

const crypto = require('crypto');

/**
 * create module script string
 *
 * @param {string} url
 * @returns {string}
 */
function moduleScript(id, url) {
  return `var ${id} = document.getElementById('${id}');`
        + `${id}&&document.body.removeChild(${id});`
        + `${id} = document.body.appendChild(document.createElement('script'));`
        + `${id}.setAttribute('id', '${id}');`
        + `${id}.setAttribute('type', 'module');`
        + `${id}.setAttribute('src', '${url}');`;
}

module.exports = function ({
  mapping
} = {}) {
  return {
    name: 'module-script',

    load(id) {
      const target = mapping[id];
      if (target) {
        const id = `m${crypto.createHash('md5').update(target).digest('hex')}`;
        return moduleScript(id, target);
      }
    }
  };
};
