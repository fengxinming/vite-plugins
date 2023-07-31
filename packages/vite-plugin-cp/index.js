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

async function mapTargets(targets) {
  return targets.map(({ src, dest, rename }) => {
    if (!isAbsolute(dest)) {
      dest = join(cwd, dest);
    }

    const paths = await globby(src, globbyOptions);

    if (paths.length) {
      return paths.map(path => copyFile(path, dest, cwd, rename));
    } else {
      console.warn(`No found targets for ${src}`);
      return [];
    }
  });
}

module.exports = function (opts = {}) {
  const { hook = 'writeBundle', targets, globbyOptions } = opts;
  const cwd = process.cwd();
  let copied = false;

  return {
    name: 'vite:cp',

    async [hook]() {
      if (copied) {
        return;
      }

      if (Array.isArray(targets)) {
        try {
          await Promise.all(mapTargets(targets));
          console.info('Done!');
          copied = true;
        } catch (err) {
          console.error(err);
        }
      }
    }
  };
};
