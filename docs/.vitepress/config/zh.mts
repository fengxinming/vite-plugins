import { DefaultTheme, defineConfig } from 'vitepress'

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
        text: '插件列表',
        activeMatch: '/zh/plugins/',
        items: navPlugins() 
      }
    ],

    sidebar: {
      '/zh/guide/': {
        base: '/zh/guide/',
        items: [
          { text: '引言', link: 'introduction' },
          { text: '本地调试', link: 'local-debugging' },
          { text: '贡献指南', link: 'contribution' }
        ]
      },
      '/zh/plugins/vite-plugin-build-chunk/': {
        base: '/zh/plugins/vite-plugin-build-chunk/',
        items: [{
          text: 'vite-plugin-build-chunk',
          items: [
            { text: '快速入门', link: 'quick-start' },
            { text: '配置项', link: 'options' },
          ]
        }]
      },
      '/zh/plugins/vite-plugin-combine/': {
        base: '/zh/plugins/vite-plugin-combine/',
        items: [{
          text: 'vite-plugin-combine',
          items: [
            { text: '快速入门', link: 'quick-start' },
            { text: '配置项', link: 'options' },
            { text: '使用示例', link: 'usage' }
          ]
        }]
      },
      '/zh/plugins/vite-plugin-cp/': {
        base: '/zh/plugins/vite-plugin-cp/',
        items: [{
          text: 'vite-plugin-cp',
          items: [
            { text: '快速入门', link: 'quick-start' },
            { text: '配置项', link: 'options' },
          ]
        }]
      },
      '/zh/plugins/vite-plugin-external/':{
        base: '/zh/plugins/vite-plugin-external/',
        items: [{
          text: 'vite-plugin-external',
          items: [
            { text: '快速入门', link: 'quick-start' },
            { text: '配置项', link: 'options' },
            { text: '使用示例', link: 'usage' }
          ]
        }]
      },
      '/zh/plugins/vite-plugin-hook-use/': {
        base: '/zh/plugins/vite-plugin-hook-use/',
        items: [{
          text: 'vite-plugin-hook-use',
          items: [
            { text: '快速入门', link: 'quick-start' },
            { text: '使用示例', link: 'usage' },
          ]
        }]
      },
      // '/zh/plugins/vite-plugin-include-css/': {
      //   base: '/zh/plugins/vite-plugin-include-css/',
      //   items: [{
      //     text: 'vite-plugin-include-css',
      //     items: [
      //       { text: '快速入门', link: 'quick-start' },
      //     ]
      //   }]
      // },
      '/zh/plugins/vite-plugin-mock-data/': {
        base: '/zh/plugins/vite-plugin-mock-data/',
        items: [{
          text: 'vite-plugin-mock-data',
          items: [
            { text: '快速入门', link: 'quick-start' },
            { text: '配置项', link: 'options' },
            { text: '使用示例', link: 'usage' }
          ]
        }]
      },
      '/zh/plugins/vite-plugin-separate-importer/': {
        base: '/zh/plugins/vite-plugin-separate-importer/',
        items: [{
          text: 'vite-plugin-separate-importer',
          items: [
            { text: '快速入门', link: 'quick-start' },
            { text: '配置项', link: 'options' },
            { text: '使用示例', link: 'usage' }
          ]
        }]
      },
      '/zh/plugins/vite-plugin-view/': {
        base: '/zh/plugins/vite-plugin-view/',
        items: [{
          text: 'vite-plugin-view',
          items: [
            { text: '快速入门', link: 'quick-start' },
            { text: '配置项', link: 'options' },
            { text: '使用示例', link: 'usage' }
          ]
        }]
      },
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/fengxinming/vite-plugins.git' }
    ]
  }
})

function navPlugins(): DefaultTheme.NavItemWithLink[] {
  return [
    { 
      text: 'vite-plugin-build-chunk', 
      activeMatch: '/zh/plugins/vite-plugin-build-chunk/', 
      link: '/zh/plugins/vite-plugin-build-chunk/quick-start'
    },
    { 
      text: 'vite-plugin-combine', 
      activeMatch: '/zh/plugins/vite-plugin-combine/', 
      link: '/zh/plugins/vite-plugin-combine/quick-start'
    },
    { 
      text: 'vite-plugin-cp', 
      activeMatch: '/zh/plugins/vite-plugin-cp/',
      link: '/zh/plugins/vite-plugin-cp/quick-start'
    },
    { 
      text: 'vite-plugin-external',
      activeMatch: '/zh/plugins/vite-plugin-external/',
      link: '/zh/plugins/vite-plugin-external/quick-start'
     },
    { 
      text: 'vite-plugin-hook-use', 
      activeMatch: '/zh/plugins/vite-plugin-hook-use/',
      link: '/zh/plugins/vite-plugin-hook-use/quick-start' 
    },
    { 
      text: 'vite-plugin-include-css', 
      activeMatch: '/zh/plugins/vite-plugin-include-css/',
      link: '/zh/plugins/vite-plugin-include-css/quick-start'
    },
    { 
      text: 'vite-plugin-mock-data', 
      activeMatch: '/zh/plugins/vite-plugin-mock-data/',
      link: '/zh/plugins/vite-plugin-mock-data/quick-start' 
    },
    // { text: 'vite-plugin-reverse-proxy', link: '/zh/plugins/vite-plugin-reverse-proxy' },
    { 
      text: 'vite-plugin-separate-importer', 
      activeMatch: '/zh/plugins/vite-plugin-separate-importer/',
      link: '/zh/plugins/vite-plugin-separate-importer/quick-start' 
    },
    { 
      text: 'vite-plugin-view', 
      activeMatch: '/zh/plugins/vite-plugin-view/',
      link: '/zh/plugins/vite-plugin-view/quick-start' 
    }
  ];
}
