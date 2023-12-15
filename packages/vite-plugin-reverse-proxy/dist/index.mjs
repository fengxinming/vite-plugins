import path from "node:path";
const CLIENT_PUBLIC_PATH = "/@vite/client";
function moduleScript(base, url, preambleCode) {
  let preScript = "";
  const clientCodeScript = `
  
    if (!document.getElementById('clientCode')) {
      const clientCode = document.createElement('script');
      clientCode.id = 'clientCode';
      clientCode.type = 'module';
      clientCode.src = '${path.posix.join(base, CLIENT_PUBLIC_PATH)}';
      document.head.insertBefore(clientCode, document.head.firstChild);
    }
    `;
  preScript += clientCodeScript;
  if (preambleCode) {
    const preambleCodeScript = `
if (!document.getElementById('preambleCode')) {
  const preambleCode = document.createElement('script');
  preambleCode.id = 'preambleCode';
  preambleCode.type = 'module';
  preambleCode.appendChild(document.createTextNode(${JSON.stringify(preambleCode.replace("__BASE__", base))}));
  document.head.insertBefore(preambleCode, document.getElementById('clientCode'));
}
    `;
    preScript += preambleCodeScript;
  }
  return `${preScript}
const mainScript = document.createElement('script');
mainScript.type = 'module';
mainScript.src = '${path.posix.join(base, url)}';
document.body.appendChild(mainScript);
    `;
}
function createPlugin(options) {
  let devBase = "/";
  let isProduction = true;
  const { targets, preambleCode } = options || {};
  return {
    name: "vite:reverse-proxy",
    config(config) {
      devBase = config.base;
    },
    configResolved(config) {
      isProduction = config.isProduction;
      if (!devBase) {
        devBase = config.base;
      }
    },
    load(id) {
      if (isProduction || !targets) {
        return;
      }
      const target = targets[id.replace(/(\?|#).*$/, "")];
      if (!target) {
        return;
      }
      return moduleScript(devBase, target, preambleCode);
    }
  };
}
export {
  createPlugin as default
};
