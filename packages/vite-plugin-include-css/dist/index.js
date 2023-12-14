"use strict";
function closure(code) {
  return `(function(){${code}})();`;
}
function tryCatch(code) {
  return `try{${code}}catch(e){console.error('vite-plugin-include-css', e);}`;
}
function createStyle(jsCode, cssCode, styleId) {
  let newCode = `var elementStyle = document.createElement('style');elementStyle.appendChild(document.createTextNode(${JSON.stringify(cssCode)}));document.head.appendChild(elementStyle);`;
  if (styleId) {
    newCode += ` elementStyle.id = "${styleId}"; `;
  }
  return closure(tryCatch(newCode)) + jsCode;
}
function createPlugin() {
  return {
    name: "vite-plugin-include-css",
    apply: "build",
    enforce: "post",
    generateBundle(outputOpts, bundle) {
      let cssCode = "";
      const cssFileNames = [];
      const htmlKeys = [];
      Object.entries(bundle).forEach(([key, chunk]) => {
        if (chunk && chunk.type === "asset") {
          if (chunk.fileName.endsWith(".css")) {
            cssCode += chunk.source;
            delete bundle[key];
            cssFileNames.push(chunk.fileName);
          } else if (chunk.fileName.endsWith(".html")) {
            htmlKeys.push(key);
          }
        }
      });
      cssCode = cssCode.trim();
      if (!cssCode) {
        return;
      }
      for (const key in bundle) {
        const chunk = bundle[key];
        if (chunk && chunk.type === "chunk" && chunk.isEntry) {
          chunk.code = createStyle(chunk.code, cssCode, key.replace(/[./]/g, "_"));
          break;
        }
      }
      htmlKeys.forEach((key) => {
        let html = bundle[key].source;
        cssFileNames.forEach((fileName) => {
          html = html.replace(new RegExp(`<link(.+)${fileName.replace(".", "\\.")}(.+)>`), "");
        });
        bundle[key].source = html;
      });
    }
  };
}
module.exports = createPlugin;
