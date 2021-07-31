'use strict';

const { existsSync, readFileSync, writeFileSync } = require('fs');

const TPS_START = '/* TRANSFORM_PLUGINS_START */';
const TPS_END = '/* TRANSFORM_PLUGINS_END */';

function reactRefresh(opts) {
  const oldReactRefreshPluginPath = require.resolve('@vitejs/plugin-react-refresh');
  const newReactRefreshPluginPath = oldReactRefreshPluginPath.replace(/\.js$/, '.plus.js');

  if (!existsSync(newReactRefreshPluginPath)) {
    let code = readFileSync(oldReactRefreshPluginPath, 'utf8');
    const TPSStr = `${TPS_START}...((opts && opts.transformPlugins) || [])${TPS_END}`;

    code = code.replace(
      /require\(['"]@babel\/plugin-transform-react-jsx-source['"]\)/,
      `require('@babel/plugin-transform-react-jsx-source'), ${TPSStr}`
    );

    writeFileSync(newReactRefreshPluginPath, code, 'utf8');
  }

  return require(newReactRefreshPluginPath)(opts);
}

module.exports = reactRefresh;
