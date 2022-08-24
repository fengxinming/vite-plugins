'use strict';

const runtimePublicPath = '/@react-refresh';
const preambleCode = `import RefreshRuntime from "__BASE__${runtimePublicPath.slice(1)}";
RefreshRuntime.injectIntoGlobalHook(window);
window.$RefreshReg$ = () => {};
window.$RefreshSig$ = () => (type) => type;
window.__vite_plugin_react_preamble_installed__ = true;`;

function moduleScript(base, url) {
  // const preambleCodeScript
  //   = `document.writeln('<script type="module">${preambleCode.replace('__BASE__', base)}</script>');`;

  // const mainScript = `document.write('<script type="module" src="${base}${url}"></script>');`;

  const preambleCodeScript = `
if (!document.getElementById('preambleCode')) {
  const preambleCode = document.createElement('script');
  preambleCode.id = 'preambleCode';
  preambleCode.type = 'module';
  preambleCode.appendChild(document.createTextNode(${JSON.stringify(preambleCode.replace('__BASE__', base))}));
  document.head.insertBefore(preambleCode,document.head.firstChild);
}
`;

  const mainScript = `
const mainScript = document.createElement('script');
mainScript.type = 'module';
mainScript.src = '${base}${url}';
document.body.appendChild(mainScript);
  `;

  return preambleCodeScript + mainScript;
}

module.exports = function (mappings = {}) {
  let devBase = '/';

  return {
    name: 'vite:module-script',

    config(config) {
      devBase = config.base;
    },

    // configResolved(resolvedConfig) {
    //   console.log(resolvedConfig.base, 'resolvedConfig.base');
    //   devBase = resolvedConfig.base;
    // },

    load(id) {
      const target = mappings[id.replace(/(\?|#).*$/, '')];
      if (target) {
        return moduleScript(devBase, target);
      }
    }
  };
};
