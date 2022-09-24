import React from 'react';
import { Layout } from '@linkdesign/components';
import Counter from '@/features/Counter';

const LayoutContainer = Layout.container;

function Dashboard() {
  return (
    <LayoutContainer
      title="首页"
      breadcrumb={[
        {
          name: '边缘计算控制台',
          link: './'
        },
        {
          name: '首页'
        }
      ]}
    >
      <Counter />
    </LayoutContainer>
  );
}

export default Dashboard;
