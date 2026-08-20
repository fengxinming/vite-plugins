import { defineConfig } from 'vitepress';
import { createNavItems, createSidebar } from './shared.mjs';

// https://vitepress.dev/reference/site-config
export const en = defineConfig({
  description: "Here is description.",
  lang: 'en-US',
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { 
        text: 'Guide',
        link: '/guide/',
        activeMatch: '/guide/'
      },
      {
        text: 'Modules',
        activeMatch: '/packages/',
        items: createNavItems('en/packages', '/packages')
      }
    ],

    sidebar: {
      ...createSidebar('en/packages', '/packages')
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/fengxinming/vite-plugins' }
    ]
  }
});