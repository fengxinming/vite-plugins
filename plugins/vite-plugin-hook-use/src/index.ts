/* eslint-disable no-console */

import {
  intro,
  log,
  outro
} from '@clack/prompts';
import color from 'picocolors';
import { Plugin } from 'vite';
import { banner } from 'vp-runtime-helper';

import pkg from '../package.json' with { type: 'json' };

const PLUGIN_NAME = pkg.name;

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
export default function pluginHookUse(): Plugin {
  banner(PLUGIN_NAME);

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
    'hotUpdate',
    'applyToEnvironment',
    'config',
    'configEnvironment',
    'configResolved',
    'configureServer',
    'configurePreviewServer',
    'transformIndexHtml',
    'handleHotUpdate',
    // rollup 钩子
    'outputOptions',
    'renderStart',
    // Note: `resolveFileUrl`, `resolveImportMeta`, and `renderDynamicImport`
    // are no longer supported by Rolldown in Vite 8 and have been removed.
    'banner',
    'footer',
    'intro',
    'outro',
    'renderChunk',
    'augmentChunkHash',
    'generateBundle',
    'writeBundle',
    'closeBundle',
    'renderError',
    'onLog',
    'closeWatcher',
    'watchChange'
  ].reduce((prev, hook) => {
    prev[hook] = function () {
      // console.log(color.green(`\n=== Enter hook "${hook}" ===\n`));
      order.set(hook, (order.get(hook) || 0) + 1);
      // `applyToEnvironment` is a Vite 8 FILTER hook, not a lifecycle event:
      // Vite uses its return value to decide whether the plugin applies to a
      // given environment. The counter above returns `undefined` (falsy) by
      // default, which makes Vite 8 skip ALL of the plugin's environment-
      // scoped hooks (buildStart, resolveId, load, transform, ..., closeBundle)
      // — so the demo plugin would silently stop observing those hooks. Return
      // `true` here so the plugin keeps applying to every environment and the
      // per-hook counters still accumulate.
      //
      // `applyToEnvironment` 是 Vite 8 的「过滤钩子」而非生命周期事件：
      // Vite 用它的返回值判断插件是否作用于某个环境。上面计数函数默认返回
      // `undefined`（falsy），会让 Vite 8 跳过插件所有环境级钩子
      // （buildStart、resolveId、load、transform、…、closeBundle）——演示插件
      // 会静默停止观测这些钩子。这里返回 `true`，让插件继续作用于每个环境，
      // 各钩子计数器才能正常累加。
      if (hook === 'applyToEnvironment') {
        return true;
      }
    };
    return prev;
  }, { name: PLUGIN_NAME });

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
      const text = `${hookName}(${count})`;
      log.step(text);
    });
    outro(color.inverse(' === End === '));
  };

  return plugin;
}
