import styles from './index.module.scss';
import React from 'react';
import { Layout, SilderNav } from '@linkdesign/components';
import aside from '@/config/aside';

const Panel = Layout.panel;

function BasicLayout({ children, location }) {
  aside.activeKey = location.pathname;

  return (
    <>
      <div className={styles.header}>
        <a href="#/">
          <span className={styles.logo}>LOGO</span>
        </a>
      </div>
      <div className={styles.body}>
        <SilderNav nav={aside} offsetHeight={50} />
        <Panel>
          {children}
        </Panel>
      </div>
    </>
  );
}

export default BasicLayout;
