import '@linkdesign/components/dist/index.css';
import React from 'react';
import ReactDOM from 'react-dom';
import { Router } from './config/routes';

const BUNDLE = document.getElementById('bundle');
if (!BUNDLE) {
  throw new Error('当前页面不存在 <div id="bundle"></div> 节点.');
}

ReactDOM.render(
  (
    <Router />
  ),
  BUNDLE,
);
