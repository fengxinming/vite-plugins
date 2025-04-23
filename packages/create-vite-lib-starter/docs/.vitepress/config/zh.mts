import { defineConfig } from 'vitepress'
import { generateAPISidebar } from './shared.mjs'

// https://vitepress.dev/reference/site-config
export const zh = defineConfig({
  description: "这里是描述。",
  lang: 'zh-CN',
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { 
        text: '指南',
        link: '/zh/guide/introduction',
        activeMatch: '/zh/guide/'
      },
      { 
        text: 'APi',
        link: '/zh/api/entry',
        activeMatch: '/zh/api/'
      }
    ],

    sidebar: {
      '/zh/guide/': {
        base: '/zh/guide/',
        items: [
          { text: '介绍', link: 'introduction' },
        ]
      },
      '/zh/api/': {
        base: '/zh/api/',
        items: generateAPISidebar('../../zh/api')
      }
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/fengxinming/vite-plugins' }
    ]
  }
})
