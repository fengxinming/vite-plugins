'use strict';

const runtimePublicPath = '/@react-refresh';
const preambleCode = `import RefreshRuntime from "__BASE__${runtimePublicPath.slice(1)}";
RefreshRuntime.injectIntoGlobalHook(window);
window.$RefreshReg$ = () => {};
window.$RefreshSig$ = () => (type) => type;
window.__vite_plugin_react_preamble_installed__ = true;`;

function moduleScript(base, url, hasReactRefresh) {
  // const preambleCodeScript
  //   = `document.writeln('<script type="module">${preambleCode.replace('__BASE__', base)}</script>');`;

  // const mainScript = `document.write('<script type="module" src="${base}${url}"></script>');`;

  let mainScript = `
const mainScript = document.createElement('script');
mainScript.type = 'module';
mainScript.src = '${base}${url}';
document.body.appendChild(mainScript);
  `;

  if (hasReactRefresh) {
    const preambleCodeScript = `
    if (!document.getElementById('preambleCode')) {
      const preambleCode = document.createElement('script');
      preambleCode.id = 'preambleCode';
      preambleCode.type = 'module';
      preambleCode.appendChild(document.createTextNode(${JSON.stringify(preambleCode.replace('__BASE__', base))}));
      document.head.insertBefore(preambleCode,document.head.firstChild);
    }
    `;

    mainScript = preambleCodeScript + mainScript;
  }

  return mainScript;
}

module.exports = function (mappings = {}) {
  let devBase = '/';
  let devMode;
  let resolvedConfig;

  return {
    name: 'vite:reverse-proxy',

    config(config, { mode }) {
      devBase = config.base;
      devMode = mode;
    },

    configResolved(config) {
      resolvedConfig = config;
    },

    load(id) {
      if (devMode === 'development') {
        const target = mappings[id.replace(/(\?|#).*$/, '')];
        if (target) {
          return moduleScript(
            devBase,
            target,
            !!resolvedConfig.plugins.find((n) => n.name === 'vite:react-refresh')
          );
        }
      }
    }
  };
};
