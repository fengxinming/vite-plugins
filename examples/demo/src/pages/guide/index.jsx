import React, { Component } from 'react';
import { Layout } from '@linkdesign/components';

const LayoutContainer = Layout.container;
export default class extends Component {
  componentDidMount() {
    console.info('componentDidMount 引导页');
  }

  render() {
    console.info('render 引导页');

    return (
      <LayoutContainer
        title="引导页"
        breadcrumb={[
          {
            name: '本地控制台',
            link: './'
          },
          {
            name: '引导页'
          }
        ]}
      />
    );
  }
}
