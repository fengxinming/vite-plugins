import React, { Component } from 'react';

export default class extends Component {
  componentDidMount() {
    console.info('componentDidMount 监控管理');
  }

  render() {
    console.info('render 监控管理');

    return (
      <h2>监控管理</h2>
    );
  }
}
