'use strict';

/**
 * create module script string
 *
 * @param {string} url
 * @returns {string}
 */
function moduleScript(url) {
  const varName = `__${Math.random().toString(36).slice(2)}`;
  return `var ${varName} = document.body.appendChild(document.createElement('script'));`
        + `${varName}.setAttribute('type', 'module');`
        + `${varName}.setAttribute('src', '${url}');`;
}

module.exports = function ({
  mapping
} = {}) {
  return {
    name: 'module-script',

    load(id) {
      const target = mapping[id];
      if (target) {
        return moduleScript(target);
      }
    }
  };
};
