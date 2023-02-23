/* eslint-disable guard-for-in */
function closure(code) {
  return `(function(){${code}})();`;
}

function tryCatch(code) {
  return `try{${code}}catch(e){console.error('vite-plugin-inject-css', e);}`;
}

function createStyle(jsCode, cssCode, styleId) {
  let newCode = 'var elementStyle = document.createElement(\'style\');'
  + `elementStyle.appendChild(document.createTextNode(${JSON.stringify(cssCode)}));`
  + 'document.head.appendChild(elementStyle);';
  if (styleId) {
    newCode += ` elementStyle.id = "${styleId}"; `;
  }

  return closure(tryCatch(newCode)) + jsCode;
}

function VitePluginInjectCss() {
  return {
    name: 'vite-plugin-inject-css',
    apply: 'build',
    enforce: 'post',
    generateBundle(_, bundle) {
      let cssCode = '';

      // find out all css codes
      for (const key in bundle) {
        const chunk = bundle[key];
        if (chunk && chunk.type === 'asset'
          && chunk.fileName.includes('.css')) {
          cssCode += chunk.source;
          delete bundle[key];
        }
      }
      cssCode = cssCode.trim();
      if (!cssCode) {
        return;
      }

      for (const key in bundle) {
        const chunk = bundle[key];

        // inject css code to js code
        if (chunk && chunk.type === 'chunk'
          && chunk.fileName.match(/.[cm]?js$/) !== null
          && !chunk.fileName.includes('polyfill')) {
          chunk.code = createStyle(chunk.code, cssCode);
          break;
        }
      }
    }
  };
}

export default VitePluginInjectCss;
