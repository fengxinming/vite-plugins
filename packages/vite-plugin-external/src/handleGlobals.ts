import { InputPluginOption, OutputOptions, Plugin as RollupPlugin, RollupOptions } from 'rollup';

function rollupOutputGlobals(
  output: OutputOptions,
  externals: Record<string, any>
): void {
  let { globals } = output;
  if (!globals) {
    globals = {};
    output.globals = globals;
  }
  if (typeof globals === 'function') {
    output.globals = function (name) {
      return externals[name] || globals(name);
    };
  }
  else {
    Object.assign(globals, externals);
  }
}

export function setOutputGlobals(
  rollupOptions: RollupOptions,
  globals?: Record<string, any>,
  externalGlobals?: (globals: Record<string, any>) => RollupPlugin
): void {
  if (!globals) {
    return;
  }

  if (typeof externalGlobals === 'function') {
    rollupOptions.plugins = [
      externalGlobals(globals),
      ...((rollupOptions.plugins as InputPluginOption[]) || [])
    ];
  }
  else {
    let { output } = rollupOptions;
    if (!output) {
      output = {};
      rollupOptions.output = output;
    }

    // compat Array
    if (Array.isArray(output)) {
      output.forEach((n) => {
        rollupOutputGlobals(n, globals);
      });
    }
    else {
      rollupOutputGlobals(output, globals);
    }
  }
}
