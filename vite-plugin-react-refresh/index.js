'use strict';

const { EOL } = require('os');
const { readFileSync, writeFileSync } = require('fs');

const OVERRIDDEN_FLAG = '/* VITE-PLUGIN-REACT-REFRESH */';
const TPS_START = '/* TRANSFORM_PLUGINS_START */';
const TPS_END = '/* TRANSFORM_PLUGINS_END */';

function reactRefresh({ transformPlugins, ...restOpts } = {}) {
  const oldReactRefreshPluginPath = require.resolve('@vitejs/plugin-react-refresh');
  let code = readFileSync(oldReactRefreshPluginPath, 'utf8');
  const TPSStr = `${TPS_START}${transformPlugins.join(', ')}${TPS_END}`;

  if (!code.includes(OVERRIDDEN_FLAG)) {
    code = OVERRIDDEN_FLAG + EOL + code.replace(
      /require\(['"]@babel\/plugin-transform-react-jsx-source['"]\)/,
      [
        'require(\'@babel/plugin-transform-react-jsx-source\')',
        TPSStr
      ].join(', ')
    );
  }
  else {
    code = `${code.slice(0, code.indexOf(TPS_START))}${TPSStr}${code.slice(code.indexOf(TPS_END) + TPS_END.length)}`;
  }

  delete require.cache[oldReactRefreshPluginPath];
  writeFileSync(oldReactRefreshPluginPath, code, 'utf8');

  return require(oldReactRefreshPluginPath)(restOpts);
}

module.exports = reactRefresh;
