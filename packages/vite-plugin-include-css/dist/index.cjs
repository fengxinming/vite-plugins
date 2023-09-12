'use strict';

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
function createPlugin() {
    return {
        name: 'vite-plugin-include-css',
        apply: 'build',
        enforce: 'post',
        generateBundle(outputOpts, bundle) {
            let cssCode = '';
            // find out all css codes
            Object.entries(bundle).forEach(([key, chunk]) => {
                if (chunk && chunk.type === 'asset'
                    && chunk.fileName.includes('.css')) {
                    // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
                    cssCode += chunk.source;
                    delete bundle[key];
                }
            });
            cssCode = cssCode.trim();
            if (!cssCode) {
                return;
            }
            // eslint-disable-next-line guard-for-in
            for (const key in bundle) {
                const chunk = bundle[key];
                // inject css code to js code
                if (chunk && chunk.type === 'chunk'
                    && /.[cm]?js$/.exec(chunk.fileName) !== null
                    && !chunk.fileName.includes('polyfill')) {
                    chunk.code = createStyle(chunk.code, cssCode);
                    break;
                }
            }
        }
    };
}

module.exports = createPlugin;
