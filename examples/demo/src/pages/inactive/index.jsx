/* eslint-disable max-len */
import styles from './index.module.scss';
import React from 'react';
import { Button, Icon, Message } from '@alicloud/console-components';
import { history } from '../../config/routes';
import { stashActiveFlag } from '@/common/user';

// const productAdvantages = [
//   {
//     img: 'https://gw.alicdn.com/imgextra/i3/O1CN01xikAkX1WQeumZ72ZI_!!6000000002783-55-tps-48-48.svg',
//     h: '优势一',
//     p: '优势一内容。'
//   },
//   {
//     img: 'https://img.alicdn.com/imgextra/i1/O1CN01klOrLq1C0HnFwCBBQ_!!6000000000018-55-tps-48-48.svg',
//     h: '优势二',
//     p: '优势二内容。'
//   },
//   {
//     img: 'https://img.alicdn.com/imgextra/i1/O1CN01bDSqrU1sUhxo0EJJu_!!6000000005770-55-tps-48-48.svg',
//     h: '优势三I',
//     p: '优势三内容。'
//   },
//   {
//     img: 'https://img.alicdn.com/imgextra/i2/O1CN01u76C1P1TFGDBqc8Tm_!!6000000002352-55-tps-48-48.svg',
//     h: '优势四',
//     p: '优势四内容。'
//   }
// ];

export default function () {
  const onActive = () => {
    stashActiveFlag(1);
    history.push('/');
    Message.success('开通服务成功');
  };

  return (
    <div className={styles['inactive-page']}>
      <div className={styles.introduce}>
        <div className={styles['introduce-wrapped-img']}>
          <img src="https://img.alicdn.com/imgextra/i2/O1CN01V7j1HU23h2Or58MnQ_!!6000000007286-55-tps-220-162.svg" alt="" />
        </div>
        <div className={styles['introduce-info']}>
          <h2 className={styles['introduce-info-title']}>某产品服务</h2>
          <p className={styles['introduce-info-desc']}>
            某产品服务介绍
            <a href="https://www.baidu.com/" target="_blank" rel="noreferrer">
              了解详情&nbsp;
              <Icon type="external-link" size="xs" />
            </a>
          </p>
          <Button type="primary" onClick={onActive}>开通服务</Button>
        </div>
      </div>
      <div className={styles['grey-area']}>
        <div className={styles['product-advantages']}>
          <h3>产品优势</h3>
          {/* <ul>
            <li x-for={advantage in productAdvantages} key={advantage.h}>
              <span className={styles['product-advantages-u-wrapped']}>
                <span className={styles['product-advantages-u']}>
                  <span className={styles['product-advantages-u-wrapped-img']}>
                    <img src={advantage.img} alt="" />
                  </span>
                  <span className={styles['product-advantages-u-info']}>
                    <h4>{advantage.h}</h4>
                    <p>{advantage.p}</p>
                  </span>
                </span>
              </span>
            </li>
          </ul> */}
        </div>
      </div>
    </div>
  );
}
