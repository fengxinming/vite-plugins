import { DefaultTheme, defineConfig } from 'vitepress';
import { groupIconMdPlugin, groupIconVitePlugin } from 'vitepress-plugin-group-icons';

import pkg from '../../../package.json';
import { basename, join } from 'node:path';
import { readdirSync } from 'node:fs';

export const shared = defineConfig({
  title: pkg.name,
  rewrites: {
    'en/:rest*': ':rest*'
  },
  base: process.env.BASE_URL || '/',
  lastUpdated: true,
  cleanUrls: true,
  metaChunk: true,

  markdown: {
    math: true,
    codeTransformers: [
      // We use `[!!code` in demo to prevent transformation, here we revert it back.
      {
        postprocess(code) {
          return code.replace(/\[!!code/g, '[!code');
        }
      }
    ],
    config(md) {
      // TODO: remove when https://github.com/vuejs/vitepress/issues/4431 is fixed
      const fence = md.renderer.rules.fence!
      md.renderer.rules.fence = function (tokens, idx, options, env, self) {
        const { localeIndex = 'root' } = env
        const codeCopyButtonTitle = (() => {
          switch (localeIndex) {
            case 'zh':
              return '复制代码'
            default:
              return 'Copy code'
          }
        })()
        return fence(tokens, idx, options, env, self).replace(
          '<button title="Copy Code" class="copy"></button>',
          `<button title="${codeCopyButtonTitle}" class="copy"></button>`
        )
      }
      md.use(groupIconMdPlugin)
    }
  },

  themeConfig: {
    socialLinks: [
      { icon: 'github', link: 'https://github.com/fengxinming/create-vite-lib-starter' }
    ]
  },

  vite: {
    plugins: [
      groupIconVitePlugin() as any
    ]
  }
});


export function generateAPISidebar(apiDir: string): DefaultTheme.SidebarItem[] {
  const exclude = ['entry'];
  return readdirSync(join(__dirname, apiDir))
    .reduce((items, file) => {
      const fnName = basename(file, '.md');
      if(!exclude.includes(fnName)) {
        items.push({
          text: fnName,
          link: file
        });
      }
      return items;
    }, [] as DefaultTheme.SidebarItem[]);
};