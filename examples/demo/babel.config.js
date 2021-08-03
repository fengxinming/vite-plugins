module.exports = {
  presets: [
    '@babel/preset-react',
    ['@babel/preset-env', { loose: true }]
  ],
  plugins: [
    ['transform-react-remove-prop-types', {
      mode: 'remove',
      removeImport: true
    }], // 移除 PropTypes
    ['@babel/plugin-transform-runtime', {
      corejs: false,
      regenerator: false
    }],
    '@babel/plugin-proposal-export-default-from', // export v from 'mod';
    ['@babel/plugin-proposal-decorators', { legacy: true }], // @annotation
    '@babel/plugin-syntax-import-meta', // import.meta
    'lodash', // import _ from 'lodash'; _.map() -> import _map from 'lodash/map'; _map()
    'babel-plugin-jsx-advanced' // jsx 扩展指令
  ]
};
