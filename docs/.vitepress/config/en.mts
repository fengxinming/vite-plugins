import { DefaultTheme, defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export const en = defineConfig({
  description: "A collection of custom plugins designed to enhance the functionality of the Vite build tool.",
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
        text: 'Plugins',
        activeMatch: '/plugins/',
        items: navPlugins() 
      }
    ],

    sidebar: {
      '/guide/': {
        base: '/guide/',
        items: [
          { text: 'Introduction', link: 'introduction' },
          { text: 'Local debugging', link: 'local-debugging' },
          { text: 'Contribution', link: 'contribution' }
        ]
      },
      '/plugins/': {
        base: '/plugins/',
        items: sidebarPlugins()
      }
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/fengxinming/vite-plugins.git' }
    ]
  }
})

function navPlugins(): DefaultTheme.NavItemWithLink[] {
  return [
    // { text: 'vite-plugin-combine', link: '/plugins/vite-plugin-combine/introduction' },
    // { text: 'vite-plugin-cp', link: '/plugins/vite-plugin-cp' },
    { 
      text: 'vite-plugin-external',
      activeMatch: '/plugins/vite-plugin-external/',
      link: '/plugins/vite-plugin-external/quick-start'
     },
    // { text: 'vite-plugin-hook-use', link: '/plugins/vite-plugin-hook-use' },
    // { text: 'vite-plugin-include-css', link: '/plugins/vite-plugin-include-css' },
    // { text: 'vite-plugin-mock-data', link: '/plugins/vite-plugin-mock-data' },
    // { text: 'vite-plugin-reverse-proxy', link: '/plugins/vite-plugin-reverse-proxy' },
    // { text: 'vite-plugin-separate-importer', link: '/plugins/vite-plugin-separate-importer' }
  ];
}

function sidebarPlugins(): DefaultTheme.SidebarItem[] {
  return [
    {
      text: 'vite-plugin-external',
      base: '/plugins/vite-plugin-external/',
      items: [
        { text: 'Quick start', link: 'quick-start' },
        { text: 'Options', link: 'options' },
        { text: 'Usage Examples', link: 'usage' }
      ]
    }
  ];
}