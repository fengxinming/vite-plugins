import { defineConfig } from 'vitepress'
import { generateAPISidebar } from './shared.mjs'

// https://vitepress.dev/reference/site-config
export const en = defineConfig({
  description: "Here is description.",
  lang: 'en-US',
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { 
        text: 'Guide',
        link: '/guide/introduction',
        activeMatch: '/guide/'
      },
      { 
        text: 'API',
        link: '/api/entry',
        activeMatch: '/api/'
      }
    ],

    sidebar: {
      '/guide/': {
        base: '/guide/',
        items: [
          { text: 'Introduction', link: 'introduction' }
        ]
      },
      '/api/': {
        base: '/api/',
        items: generateAPISidebar('../../en/api')
      }
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/fengxinming/vite-plugins' }
    ]
  }
})