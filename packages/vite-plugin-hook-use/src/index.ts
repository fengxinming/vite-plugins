/* eslint-disable no-console */

import { Plugin } from 'vite';
import {
  intro,
  outro,
  spinner
} from '@clack/prompts';
import color from 'picocolors';

const s = spinner();

/**
 * Shows the usage of the hook function of the `vite` plugin.
 *
 * @example
 * ```js
 * import { defineConfig } from 'vite';
 * import vitePluginHookUse from 'vite-plugin-hook-use';
 *
 * export default defineConfig({
 *  plugins: [
 *    vitePluginHookUse()
 *  ]
 * });
 * ```
 *
 * @returns a vite plugin
 */
export default function createPlugin(): Plugin {
  const order = new Map<string, number>();

  const plugin: Plugin = [
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
  ].reduce((prev, hook) => {
    prev[hook] = function () {
      // console.log(color.green(`\n=== Enter hook "${hook}" ===\n`));
      order.set(hook, (order.get(hook) || 0) + 1);
    };
    return prev;
  }, { name: 'vite-plugin-hook-use' });

  const lastConfig = plugin.config as () => void;
  plugin.config = function (userConfig, env) {
    console.log(color.green(`\nenv: ${JSON.stringify(env, null, 2)}\n`));
    lastConfig();
  };

  const lastCloseBundle = plugin.closeBundle as () => void;
  plugin.closeBundle = function () {
    lastCloseBundle();

    console.log();
    intro(color.inverse(' === Start === '));
    order.forEach((count, hookName) => {
      s.start();
      const text = count === 1 ? hookName : `${hookName}(${count})`;
      s.stop(text);
    });
    outro(color.inverse(' === End === '));
  };

  return plugin;
}
