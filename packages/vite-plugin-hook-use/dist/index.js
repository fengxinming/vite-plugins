"use strict";
const prompts = require("@clack/prompts");
const color = require("picocolors");
const s = prompts.spinner();
function createPlugin() {
  const order = /* @__PURE__ */ new Map();
  const hooks = [
    // 以下钩子在服务器启动时被调用
    "options",
    "buildStart",
    // 以下钩子会在每个传入模块请求时被调用
    "resolveId",
    "load",
    "transform",
    // 以下钩子在服务器关闭时被调用
    "buildEnd",
    "closeBundle",
    // 在开发中不会被调用
    "moduleParsed",
    // Vite 独有钩子
    "config",
    "configResolved",
    "configureServer",
    "configurePreviewServer",
    "transformIndexHtml",
    "handleHotUpdate"
  ].reduce((prev, hook) => {
    prev[hook] = function() {
      order.set(hook, (order.get(hook) || 0) + 1);
    };
    return prev;
  }, {});
  const lastConfig = hooks.config;
  hooks.config = function(userConfig, env) {
    console.log(color.green(`
env: ${JSON.stringify(env, null, 2)}
`));
    lastConfig();
  };
  const lastCloseBundle = hooks.closeBundle;
  hooks.closeBundle = function() {
    lastCloseBundle();
    console.log();
    prompts.intro(color.inverse(" === Start === "));
    order.forEach((count, hookName) => {
      s.start();
      const text = count === 1 ? hookName : `${hookName}(${count})`;
      s.stop(text);
    });
    prompts.outro(color.inverse(" === End === "));
  };
  return hooks;
}
module.exports = createPlugin;
