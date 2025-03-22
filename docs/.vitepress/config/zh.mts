import { DefaultTheme, defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export const zh = defineConfig({
  description: "一个灵活简单的 JS 日志库，通过配置不同的 Appender 可以在不同的环境记录或收集日志内容。",
  lang: 'zh-CN',
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: '指南', link: '/zh/guide/introduce', activeMatch: '/zh/guide/' },
      { 
        text: '插件列表',
        activeMatch: '/zh/plugins/',
        items: [
          // { text: 'vite-plugin-combine', link: '/zh/plugins/vite-plugin-combine/introduce' },
          // { text: 'vite-plugin-cp', link: '/zh/plugins/vite-plugin-cp' },
          { 
            text: 'vite-plugin-external',
            activeMatch: '/zh/plugins/vite-plugin-external/',
            link: '/zh/plugins/vite-plugin-external/introduce'
           },
          // { text: 'vite-plugin-hook-use', link: '/zh/plugins/vite-plugin-hook-use' },
          // { text: 'vite-plugin-include-css', link: '/zh/plugins/vite-plugin-include-css' },
          // { text: 'vite-plugin-mock-data', link: '/zh/plugins/vite-plugin-mock-data' },
          // { text: 'vite-plugin-reverse-proxy', link: '/zh/plugins/vite-plugin-reverse-proxy' },
          // { text: 'vite-plugin-separate-importer', link: '/zh/plugins/vite-plugin-separate-importer' }
        ] 
      }
    ],

    sidebar: {
      '/zh/guide/': {
        base: '/zh/guide/',
        items: [
          { text: '介绍', link: 'introduce' },
          { text: '本地调试', link: 'debug' },
          { text: '贡献指南', link: 'contribution' }
        ]
      },
      '/zh/plugins/': {
        base: '/zh/plugins/',
        items: sidebarPlugins()
      }
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/fengxinming/vite-plugins.git' }
    ]
  }
})

function sidebarPlugins(): DefaultTheme.SidebarItem[] {
  return [
    {
      text: 'vite-plugin-external',
      base: '/zh/plugins/vite-plugin-external/',
      items: [
        { text: '介绍', link: 'introduce' },
        { text: '配置项', link: 'options' },
        { text: '使用示例', link: 'usage' }
      ]
    }
  ];
}