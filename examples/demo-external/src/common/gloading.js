import React from 'react';
import ReactDOM from 'react-dom';
import { Loading } from '@alicloud/console-components';

const wrap = document.body.appendChild(document.createElement('div'));

export function show() {
  ReactDOM.render((
    <Loading visible fullScreen inline={false} />
  ), wrap);
}

export function hide() {
  ReactDOM.render((
    <Loading visible={false} fullScreen inline={false} />
  ), wrap);
}
