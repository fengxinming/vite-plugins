import { defineConfig } from 'vitepress'
import { generateAPISidebar } from './shared.mts'

// https://vitepress.dev/reference/site-config
export const zh = defineConfig({
  description: "一个包含多个自定义插件的集合，用于增强 Vite 构建工具的功能。",
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
      { icon: 'github', link: 'https://github.com/fengxinming/create-vite-lib-starter.git' }
    ]
  }
})
