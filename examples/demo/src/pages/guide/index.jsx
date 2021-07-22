import React, { Component } from 'react';

export default class extends Component {
  componentDidMount() {
    console.info('componentDidMount 引导页');
  }

  render() {
    console.info('render 引导页');

    return (
      <h2>引导页</h2>
    );
  }
}
