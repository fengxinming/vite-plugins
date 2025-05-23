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
      '/plugins/vite-plugin-build-chunk/': {
        base: '/plugins/vite-plugin-build-chunk/',
        items: [{
          text: 'vite-plugin-build-chunk',
          items: [
            { text: 'Quick start', link: 'quick-start' },
            { text: 'Options', link: 'options' },
          ]
        }]
      },
      '/plugins/vite-plugin-combine/': {
        base: '/plugins/vite-plugin-combine/',
        items: [{
          text: 'vite-plugin-combine',
          items: [
            { text: 'Quick start', link: 'quick-start' },
            { text: 'Options', link: 'options' },
            { text: 'Usage Examples', link: 'usage' }
          ]
        }]
      },
      '/plugins/vite-plugin-cp/': {
        base: '/plugins/vite-plugin-cp/',
        items: [{
          text: 'vite-plugin-cp',
          items: [
            { text: 'Quick start', link: 'quick-start' },
            { text: 'Options', link: 'options' },
          ]
        }]
      },
      '/plugins/vite-plugin-external/': {
        base: '/plugins/vite-plugin-external/',
        items: [{
          text: 'vite-plugin-external',
          items: [
            { text: 'Quick start', link: 'quick-start' },
            { text: 'Options', link: 'options' },
            { text: 'Usage Examples', link: 'usage' }
          ]
        }]
      },
      '/plugins/vite-plugin-hook-use/': {
        base: '/plugins/vite-plugin-hook-use/',
        items: [{
          text: 'vite-plugin-hook-use',
          items: [
            { text: 'Quick start', link: 'quick-start' },
            { text: 'Usage Examples', link: 'usage' }
          ]
        }]
      },
      // '/plugins/vite-plugin-include-css/': {
      //   base: '/plugins/vite-plugin-include-css/',
      //   items: [{
      //     text: 'vite-plugin-include-css',
      //     items: [
      //       { text: 'Quick start', link: 'quick-start' },
      //     ]
      //   }]
      // },
      '/plugins/vite-plugin-mock-data/': {
        base: '/plugins/vite-plugin-mock-data/',
        items: [{
          text: 'vite-plugin-mock-data',
          items: [
            { text: 'Quick start', link: 'quick-start' },
            { text: 'Options', link: 'options' },
            { text: 'Usage Examples', link: 'usage' }
          ]
        }]
      },
      '/plugins/vite-plugin-separate-importer/': {
        base: '/plugins/vite-plugin-separate-importer/',
        items: [{
          text: 'vite-plugin-separate-importer',
          items: [
            { text: 'Quick start', link: 'quick-start' },
            { text: 'Options', link: 'options' },
            { text: 'Usage Examples', link: 'usage' }
          ]
        }]
      },
      '/plugins/vite-plugin-view/': {
        base: '/plugins/vite-plugin-view/',
        items: [{
          text: 'vite-plugin-view',
          items: [
            { text: 'Quick start', link: 'quick-start' },
            { text: 'Options', link: 'options' },
            { text: 'Usage Examples', link: 'usage' }
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
      activeMatch: '/plugins/vite-plugin-build-chunk/', 
      link: '/plugins/vite-plugin-build-chunk/quick-start'
    },
    { 
      text: 'vite-plugin-combine', 
      activeMatch: '/plugins/vite-plugin-combine/', 
      link: '/plugins/vite-plugin-combine/quick-start' 
    },
    { 
      text: 'vite-plugin-cp',
      activeMatch: '/plugins/vite-plugin-cp/',
      link: '/plugins/vite-plugin-cp/quick-start'
    },
    { 
      text: 'vite-plugin-external',
      activeMatch: '/plugins/vite-plugin-external/',
      link: '/plugins/vite-plugin-external/quick-start'
    },
    { 
      text: 'vite-plugin-hook-use',
      activeMatch: '/plugins/vite-plugin-hook-use/',
      link: '/plugins/vite-plugin-hook-use/quick-start'
    },
    { 
      text: 'vite-plugin-include-css', 
      activeMatch: '/plugins/vite-plugin-include-css/',
      link: '/plugins/vite-plugin-include-css/quick-start'
    },
    { 
      text: 'vite-plugin-mock-data', 
      activeMatch: '/plugins/vite-plugin-mock-data/',
      link: '/plugins/vite-plugin-mock-data/quick-start'
    },
    // { text: 'vite-plugin-reverse-proxy', link: '/plugins/vite-plugin-reverse-proxy' },
    { 
      text: 'vite-plugin-separate-importer', 
      activeMatch: '/plugins/vite-plugin-separate-importer/',
      link: '/plugins/vite-plugin-separate-importer/quick-start' 
    },
    { 
      text: 'vite-plugin-view', 
      activeMatch: '/plugins/vite-plugin-view/',
      link: '/plugins/vite-plugin-view/quick-start'
    }
  ];
}
