import { history } from '@/config/routes';
import { isActive, isLogin } from '@/common/user';
import { sleep } from 'celia';

export default function () {
  return sleep(1000).then(() => {
    if (!isLogin()) {
      history.push('/login');
    }
    else if (!isActive()) {
      history.push('/inactive');
    }
  });
}
