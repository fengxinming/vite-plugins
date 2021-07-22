import React, { Component } from 'react';

export default class extends Component {
  componentDidMount() {
    console.info('componentDidMount 任务管理');
  }

  render() {
    console.info('render 任务管理');

    return (
      <h2>任务管理</h2>
    );
  }
}
