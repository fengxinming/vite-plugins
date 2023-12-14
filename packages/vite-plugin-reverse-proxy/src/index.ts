import path from 'node:path';

const CLIENT_PUBLIC_PATH = '/@vite/client';

function moduleScript(base: string, url: string, preambleCode?: string) {
  let preScript = '';

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
  preambleCode.appendChild(document.createTextNode(${JSON.stringify(preambleCode.replace('__BASE__', base))}));
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

export interface Options {
  targets?: Record<string, string>;
  preambleCode?: string;
}

/**
 * Makes the script to be served with the text/javascript MIME type instead of module MIME type.
 * @param options Options
 * @returns a vite plugin
 */
export default function createPlugin(options: Options = {}) {
  let devBase = '/';
  let isProduction = true;

  const { targets, preambleCode } = options;

  return {
    name: 'vite:reverse-proxy',

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

      const target = targets[id.replace(/(\?|#).*$/, '')];
      if (!target) {
        return;
      }

      return moduleScript(
        devBase,
        target,
        preambleCode
      );
    }
  };
}
