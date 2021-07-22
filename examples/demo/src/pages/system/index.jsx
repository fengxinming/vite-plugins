import React, { Component } from 'react';

export default class extends Component {
  componentDidMount() {
    console.info('componentDidMount 系统管理');
  }

  render() {
    console.info('render 系统管理');

    return (
      <h2>系统管理</h2>
    );
  }
}
