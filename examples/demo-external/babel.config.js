module.exports = {
  presets: [
    '@babel/preset-react',
    ['@babel/preset-env', { loose: true }]
  ],
  plugins: [
    // 移除 PropTypes
    ['transform-react-remove-prop-types', {
      mode: 'remove',
      removeImport: true
    }],
    ['@babel/plugin-transform-runtime', {
      corejs: false,
      regenerator: false
    }],
    // export v from 'mod';
    '@babel/plugin-proposal-export-default-from',
    // @annotation
    ['@babel/plugin-proposal-decorators', { legacy: true }],
    // import.meta
    '@babel/plugin-syntax-import-meta',
    // import _ from 'lodash'; _.map() -> import _map from 'lodash/map'; _map()
    'lodash'
  ]
};
