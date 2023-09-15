import { Plugin } from 'vite';

function closure(code: string): string {
  return `(function(){${code}})();`;
}

function tryCatch(code: string): string {
  return `try{${code}}catch(e){console.error('vite-plugin-inject-css', e);}`;
}

function createStyle(jsCode: string, cssCode: string, styleId?: string): string {
  let newCode = 'var elementStyle = document.createElement(\'style\');'
  + `elementStyle.appendChild(document.createTextNode(${JSON.stringify(cssCode)}));`
  + 'document.head.appendChild(elementStyle);';
  if (styleId) {
    newCode += ` elementStyle.id = "${styleId}"; `;
  }

  return closure(tryCatch(newCode)) + jsCode;
}

export default function createPlugin(): Plugin {
  return {
    name: 'vite-plugin-include-css',
    apply: 'build',
    enforce: 'post',
    generateBundle(outputOpts, bundle) {
      let cssCode = '';
      const cssFileNames: string[] = [];
      const htmlKeys: string[] = [];

      // find out all css codes
      Object.entries(bundle).forEach(([key, chunk]) => {
        if (chunk && chunk.type === 'asset') {
          if (chunk.fileName.endsWith('.css')) {
            // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
            cssCode += chunk.source;
            delete bundle[key];
            cssFileNames.push(chunk.fileName);
          }
          else if (chunk.fileName.endsWith('.html')) {
            htmlKeys.push(key);
          }
        }
      });

      cssCode = cssCode.trim();
      if (!cssCode) {
        return;
      }

      // eslint-disable-next-line guard-for-in
      for (const key in bundle) {
        const chunk = bundle[key];

        // inject css code to js entry
        if (chunk && chunk.type === 'chunk' && chunk.isEntry) {
          chunk.code = createStyle(chunk.code, cssCode);
          break;
        }
      }

      htmlKeys.forEach((key) => {
        let html = (bundle[key] as any).source;
        cssFileNames.forEach((fileName) => {
          html = html.replace(new RegExp(`<link(.+)${fileName.replace('.', '\\.')}(.+)>`), '');
        });
        (bundle[key] as any).source = html;
      });
    }
  };
}
