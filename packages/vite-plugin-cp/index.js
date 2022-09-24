'use strict';

const { copy } = require('fs-extra');
const globby = require('globby');
const { join, isAbsolute, parse } = require('path');

function copyFile(src, dest, cwd, rename) {
  if (!isAbsolute(src)) {
    src = join(cwd, src);
  }
  const parsed = parse(src);
  return copy(src, join(dest, rename || parsed.base));
}

module.exports = function (opts = {}) {
  const { hook = 'writeBundle', targets, globbyOptions } = opts;
  const cwd = process.cwd();
  let copied = false;

  return {
    name: 'vite:cp',

    [hook]() {
      if (copied) {
        return;
      }
      if (Array.isArray(targets)) {
        Promise.all(targets.map(({ src, dest, rename }) => {
          if (!isAbsolute(dest)) {
            dest = join(cwd, dest);
          }
          return globby(src, globbyOptions).then((paths) => {
            if (paths.length) {
              return paths.map((pth) => {
                return copyFile(pth, dest, cwd, rename);
              });
            }

            console.warn('Not found targets!');
            return false;
          });
        })).then((ret) => {
          if (ret !== false) {
            console.info('Done!');
          }
        }).catch((err) => {
          console.error(err);
        });
      }
      copied = true;
    }
  };
};
