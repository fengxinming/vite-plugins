import { EOL } from 'node:os';

import replaceAll from 'fast-replaceall';
import MagicString from 'magic-string';
import { minify } from 'terser';
import type { Plugin, ResolvedConfig } from 'vite';
import { banner } from 'vp-runtime-helper';

import pkg from '../package.json';

const PLUGIN_NAME = pkg.name;

function closure(code: string): string {
  return `!(function(){${code}})();`;
}

function tryCatch(code: string): string {
  return `try{${code}}catch(e){console.error('${PLUGIN_NAME}', e);}`;
}
async function makeStyleCode(jsCode: string, cssCode: string, styleId?: string): Promise<string> {
  let styleCode = `var __vite_style__ = document.createElement("style");
__vite_style__.textContent = ${JSON.stringify(cssCode)};
document.head.appendChild(__vite_style__);${EOL}`;

  if (styleId) {
    styleCode += `__vite_style__.id = "${styleId}";`;
  }

  styleCode = (await minify(closure(styleCode), {
    mangle: {
      toplevel: true
    }
  })).code || '';

  if (jsCode.includes('"use strict";')) {
    return replaceAll(jsCode, '"use strict";', `"use strict";${styleCode}`);
  }

  return closure(tryCatch(styleCode) + jsCode);
}

/**
 * build css into individual js files instead of using css links.
 *
 * @example
 * ```js
 * import { defineConfig } from 'vite';
 * import includeCSS from 'vite-plugin-include-css';
 *
 * export default defineConfig({
 *   plugins: [
 *     includeCSS()
 *   ],
 *   build: {
 *     cssCodeSplit: false,
 *     rollupOptions: {
 *       output: {
 *         manualChunks: undefined,
 *         assetFileNames: 'assets/[name][extname]',
 *         entryFileNames: '[name].js',
 *         format: 'iife'
 *       }
 *     }
 *   }
 * });
 * ```
 *
 * @returns a vite plugin
 */
export default function pluginIncludeCSS(): Plugin {
  banner(pkg.name);

  let resolvedConfig: ResolvedConfig;

  return {
    name: PLUGIN_NAME,
    apply: 'build',
    enforce: 'post',

    configResolved(config) {
      resolvedConfig = config;
    },

    async generateBundle(outputOpts, bundle) {
      let cssCode = '';
      const cssFileNames: string[] = [];
      const htmlKeys: string[] = [];

      // find out all css codes
      for (const [key, chunk] of Object.entries(bundle)) {
        if (chunk && chunk.type === 'asset') {
          if (chunk.fileName.endsWith('.css')) {
            cssCode += chunk.source;
            delete bundle[key];
            cssFileNames.push(chunk.fileName);
          }
          else if (chunk.fileName.endsWith('.html')) {
            htmlKeys.push(key);
          }
        }
      }

      cssCode = cssCode.trim();
      if (!cssCode) {
        return;
      }

      for (const [key, chunk] of Object.entries(bundle)) {
        // inject css code to js entry
        if (chunk && chunk.type === 'chunk' && chunk.isEntry) {
          const code = await makeStyleCode(chunk.code, cssCode, key.replace(/[./]/g, '_'));

          chunk.code = code;

          if (resolvedConfig.build.sourcemap) {
            const ms = new MagicString(code);
            chunk.map = ms.generateMap({ hires: 'boundary' });
          }
          break;
        }
      }

      for (const key of htmlKeys) {
        let html = (bundle[key] as any).source;
        cssFileNames.forEach((fileName) => {
          html = html.replace(new RegExp(`<link(.+)${fileName.replace('.', '\\.')}(.+)>`), '');
        });
        (bundle[key] as any).source = html;
      }
    }
  };
}
