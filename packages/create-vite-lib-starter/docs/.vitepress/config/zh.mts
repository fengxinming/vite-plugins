import { defineConfig } from 'vitepress';
import { createNavItems, createSidebar } from './shared.mjs';

// https://vitepress.dev/reference/site-config
export const zh = defineConfig({
  description: "这里是描述。",
  lang: 'zh-CN',
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { 
        text: '引言',
        link: '/zh/guide/',
        activeMatch: '/zh/guide/'
      },
      {
        text: '模块列表',
        activeMatch: '/zh/packages/',
        items: createNavItems('zh/packages', '/zh/packages')
      }
    ],

    sidebar: {
      ...createSidebar('zh/packages', '/zh/packages')
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/fengxinming/vite-plugins' }
    ]
  }
})
