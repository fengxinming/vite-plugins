import http from '@/common/http';
import { forEach, page } from 'celia';
import moment from 'moment';

const list = [];
forEach(40, (num) => {
  list.push({
    id: `产品${num}`,
    ProductKey: Math.random().toString(36).substr(4),
    NodeType: '设备',
    UpdateTime: moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
    Status: num % 3 === 0
  });
});

export function getDevices(current, pageSize) {
  return http()
    .then(() => page(list, current, pageSize));
}
