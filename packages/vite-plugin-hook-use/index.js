/* eslint-disable no-console */

export default function () {
  const order = new Map();

  const hooks = [
    // 以下钩子在服务器启动时被调用
    'options',
    'buildStart',
    // 以下钩子会在每个传入模块请求时被调用
    'resolveId',
    'load',
    'transform',
    // 以下钩子在服务器关闭时被调用
    'buildEnd',
    'closeBundle',
    // 在开发中不会被调用
    'moduleParsed',
    // Vite 独有钩子
    'config',
    'configResolved',
    'configureServer',
    'configurePreviewServer',
    'transformIndexHtml',
    'handleHotUpdate'
  ].reduce((prev, cur) => {
    prev[cur] = function () {
      console.log(`=== Enter hook "${cur}" ===`);
      order.set(cur, (order.get(cur) || 0) + 1);
    };
    return prev;
  }, {});

  const lastConfig = hooks.config;
  hooks.config = function (userConfig, env) {
    console.log(`\nenv: ${JSON.stringify(env, null, 2)}\n`);
    lastConfig();
  };

  const lastCloseBundle = hooks.closeBundle;
  hooks.closeBundle = function () {
    lastCloseBundle();

    const flow = [];
    order.forEach((count, hookName) => {
      flow.push(count === 1 ? hookName : `${hookName}(${count})`);
    });

    console.log(`\n${flow.join(' -> ')}\n`);
  };

  return hooks;
}
