import { readdirSync, readFileSync } from 'node:fs';
import { EOL } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { DefaultTheme, defineConfig } from 'vitepress';
import { groupIconMdPlugin, groupIconVitePlugin } from 'vitepress-plugin-group-icons';

import pkg from '../../../package.json';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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

  vite: {
    plugins: [
      groupIconVitePlugin() as any
    ]
  }
});


function pushSidebar(
  dir: string,
  base: string,
  sidebar: Record<string, DefaultTheme.SidebarItem>,
): void {
  readdirSync(dir).forEach((file) => {
    if (file === 'index.md') {
      return;
    }

    if (file.endsWith('.md')) {
      sidebar[base].items![0].items!.push({
        text: new RegExp(`#\\s+\\**([^*${EOL}]+)\\**\\${EOL}`)
          .exec(readFileSync(join(dir, file), 'utf8'))![1],
        link: file.replace(/\.md$/, '')
      });
    }
    else {
      let text: string | null = null;
      try {
        text = new RegExp(`#\\s+\\**([^*${EOL}]+)\\**\\${EOL}`)
          .exec(readFileSync(join(dir, file, 'index.md'), 'utf8'))![1];
      }
      catch (e) { }

      const nextBase = `${join(base, file)}/`;
      const subItem: DefaultTheme.SidebarItem = {
        items: []
      };
      const item: DefaultTheme.SidebarItem = {
        base: nextBase,
        items: [subItem]
      };

      if (text) {
        subItem.text = text;
        subItem.link = 'index';
      }

      sidebar[nextBase] = item;
      pushSidebar(join(dir, file), nextBase, sidebar);

      if (subItem.items!.length === 0) {
        delete sidebar[nextBase];
      }
    }
  });
}

export function createSidebar(dir: string, base: string): DefaultTheme.Sidebar {
  const absDir = join(__dirname, '../..', dir);
  const sidebar: Record<string, DefaultTheme.SidebarItem> = {};

  pushSidebar(absDir, base, sidebar);

  return sidebar as DefaultTheme.Sidebar;
}

export function createNavItems(dir: string, base: string): DefaultTheme.NavItemWithLink[] {
  return readdirSync(join(__dirname, '../..', dir)).map((name) => {
    return {
      text: name,
      activeMatch: `${join(dir, name)}/`,
      link: join(base, name)
    };
  });
}
