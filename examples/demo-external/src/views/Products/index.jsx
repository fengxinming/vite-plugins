import React from 'react';
import { Layout } from '@linkdesign/components';

const LayoutContainer = Layout.container;

function Products() {
  return (
    <LayoutContainer
      title="产品管理"
      breadcrumb={[
        {
          name: '边缘计算控制台',
          link: './'
        },
        {
          name: '产品管理'
        }
      ]}
    />
  );
}

export default Products;
