import history from '../router/history';

export default {
  header: '边缘计算控制台',
  defaultActiveKey: ['/dashboard'],
  onSelect(v) {
    history.push(v[0]);
  },
  dataSource: [
    {
      key: '/dashboard',
      label: '首页'
    },
    {
      key: '/products',
      label: '产品管理'
    },
    {
      key: '/devices',
      label: '设备管理'
    },
    {
      key: '/logs',
      label: '日志',
      children: [
        {
          key: '/daily',
          label:
`日常环境是用于开发人员日常调试所用的开发环境，包括服务器、系统环境、
开发资源和集成环境组成日常环境是用于开发人员日常调试所用的开发环境，包括服务器、系统环境、开发资源和集成环境组成日常环境是用于开发人员日常调试所用的开发环境，包括服务器、系统环境、开发资源和集成环境组成`
        },
        {
          key: '/prod',
          label: '生产环境'
        }
      ]
    },
    {
      key: '/others',
      label: '其他',
      children: [
        {
          key: '/help',
          label: '帮助',
          children: [
            {
              key: '/help1',
              label: '帮助1'
            },
            {
              key: '/docs1',
              label: '文档1',
              disabled: true
            }
          ]
        },
        {
          key: '/docs',
          label: '文档',
          disabled: true
        }
      ]
    }
  ]
};
