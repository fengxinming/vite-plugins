import { history } from './routes';

export default {
  header: '本地控制台',
  onSelect(selectedKeys) {
    history.push(selectedKeys[0]);
  },
  dataSource: [{
    label: '引导页',
    key: '/guide'
  },
  {
    label: '设备管理',
    key: '/devices'
  },
  {
    label: '任务管理',
    key: '/tasks'
  },
  {
    label: '监控管理',
    key: '/monitor'
  },
  {
    label: '系统管理',
    key: '/system'
  }]
};
