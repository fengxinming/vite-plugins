import React from 'react';
import { Layout } from '@linkdesign/components';

const LayoutContainer = Layout.container;

function Devices() {
  return (
    <LayoutContainer
      title="设备管理"
      breadcrumb={[
        {
          name: '边缘计算控制台',
          link: './'
        },
        {
          name: '设备管理'
        }
      ]}
    />
  );
}

export default Devices;
