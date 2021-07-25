import React, { Component } from 'react';
import { Layout } from '@linkdesign/components';

const LayoutContainer = Layout.container;
export default class extends Component {
  componentDidMount() {
    console.info('componentDidMount 任务管理');
  }

  render() {
    console.info('render 任务管理');

    return (
      <LayoutContainer
        title="任务管理"
        breadcrumb={[
          {
            name: '本地控制台',
            link: './'
          },
          {
            name: '任务管理'
          }
        ]}
      />
    );
  }
}
