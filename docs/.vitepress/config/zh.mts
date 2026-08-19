import { type DefaultTheme, type LocaleSpecificConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export const zh: LocaleSpecificConfig<DefaultTheme.Config> = {
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
      },
      {
        // Legacy / 归档入口：指向 docs/zh/legacy/*（我们把 Vite 1-6 旧文档拷到
        // 了 docs/zh/legacy 下，复用 shared.rewrites 里的 'zh/:rest*' => '/zh/:rest*'
        // 规则；这样访问 /zh/legacy/guide/introduction 就会去读
        // docs/zh/legacy/guide/introduction.md，不会出现双重 /zh/legacy/zh/... 路径
        // 带来的 404。
        text: 'Vite 1-6 旧文档',
        link: '/zh/legacy/',
        activeMatch: '/zh/legacy/'
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
      '/zh/plugins/vite-plugin-include-css/': {
        base: '/zh/plugins/vite-plugin-include-css/',
        items: [{
          text: 'vite-plugin-include-css',
          items: [
            { text: '快速入门', link: 'quick-start' },
          ]
        }]
      },
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
      '/zh/plugins/vite-plugin-reverse-proxy/': {
        base: '/zh/plugins/vite-plugin-reverse-proxy/',
        items: [{
          text: 'vite-plugin-reverse-proxy',
          items: [
            { text: '快速入门', link: 'quick-start' },
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

      // Legacy docs — 旧文档归档（Vite 1~6 历史版本，不再更新）
      // 磁盘结构为 docs/zh/legacy/{guide,plugins/<name>}/*.md，
      // 由 shared.rewrites 的 'zh/:rest*' 规则映射为路由 /zh/legacy/...
      // 因此 sidebar key 必须写 '/zh/legacy/guide/' 而不是 '/zh/legacy/zh/guide/'（后者 404）。
      '/zh/legacy/guide/': {
        base: '/zh/legacy/guide/',
        items: [
          { text: '[旧] 引言', link: 'introduction' },
          { text: '[旧] 本地调试', link: 'local-debugging' },
          { text: '[旧] 贡献指南', link: 'contribution' }
        ]
      },
      '/zh/legacy/plugins/vite-plugin-build-chunk/': {
        base: '/zh/legacy/plugins/vite-plugin-build-chunk/',
        items: [{ text: 'vite-plugin-build-chunk (Vite 1-6 旧版)', items: [
          { text: '快速入门', link: 'quick-start' },
          { text: '配置项', link: 'options' },
        ]}]
      },
      '/zh/legacy/plugins/vite-plugin-combine/': {
        base: '/zh/legacy/plugins/vite-plugin-combine/',
        items: [{ text: 'vite-plugin-combine (Vite 1-6 旧版)', items: [
          { text: '快速入门', link: 'quick-start' }, { text: '配置项', link: 'options' }, { text: '使用示例', link: 'usage' }
        ]}]
      },
      '/zh/legacy/plugins/vite-plugin-cp/': {
        base: '/zh/legacy/plugins/vite-plugin-cp/',
        items: [{ text: 'vite-plugin-cp (Vite 1-6 旧版)', items: [
          { text: '快速入门', link: 'quick-start' }, { text: '配置项', link: 'options' }
        ]}]
      },
      '/zh/legacy/plugins/vite-plugin-external/': {
        base: '/zh/legacy/plugins/vite-plugin-external/',
        items: [{ text: 'vite-plugin-external (Vite 1-6 旧版)', items: [
          { text: '快速入门', link: 'quick-start' }, { text: '配置项', link: 'options' }, { text: '使用示例', link: 'usage' }
        ]}]
      },
      '/zh/legacy/plugins/vite-plugin-hook-use/': {
        base: '/zh/legacy/plugins/vite-plugin-hook-use/',
        items: [{ text: 'vite-plugin-hook-use (Vite 1-6 旧版)', items: [
          { text: '快速入门', link: 'quick-start' }, { text: '使用示例', link: 'usage' }
        ]}]
      },
      '/zh/legacy/plugins/vite-plugin-include-css/': {
        base: '/zh/legacy/plugins/vite-plugin-include-css/',
        items: [{ text: 'vite-plugin-include-css (Vite 1-6 旧版)', items: [
          { text: '快速入门', link: 'quick-start' }
        ]}]
      },
      '/zh/legacy/plugins/vite-plugin-mock-data/': {
        base: '/zh/legacy/plugins/vite-plugin-mock-data/',
        items: [{ text: 'vite-plugin-mock-data (Vite 1-6 旧版)', items: [
          { text: '快速入门', link: 'quick-start' }, { text: '配置项', link: 'options' }, { text: '使用示例', link: 'usage' }
        ]}]
      },
      '/zh/legacy/plugins/vite-plugin-reverse-proxy/': {
        base: '/zh/legacy/plugins/vite-plugin-reverse-proxy/',
        items: [{ text: 'vite-plugin-reverse-proxy (Vite 1-6 旧版)', items: [
          { text: '快速入门', link: 'quick-start' }
        ]}]
      },
      '/zh/legacy/plugins/vite-plugin-separate-importer/': {
        base: '/zh/legacy/plugins/vite-plugin-separate-importer/',
        items: [{ text: 'vite-plugin-separate-importer (Vite 1-6 旧版)', items: [
          { text: '快速入门', link: 'quick-start' }, { text: '配置项', link: 'options' }, { text: '使用示例', link: 'usage' }
        ]}]
      },
      '/zh/legacy/plugins/vite-plugin-view/': {
        base: '/zh/legacy/plugins/vite-plugin-view/',
        items: [{ text: 'vite-plugin-view (Vite 1-6 旧版)', items: [
          { text: '快速入门', link: 'quick-start' }, { text: '配置项', link: 'options' }, { text: '使用示例', link: 'usage' }
        ]}]
      },
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/fengxinming/vite-plugins.git' }
    ]
  }
}

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
    {
      text: 'vite-plugin-reverse-proxy',
      activeMatch: '/zh/plugins/vite-plugin-reverse-proxy/',
      link: '/zh/plugins/vite-plugin-reverse-proxy/quick-start'
    },
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
