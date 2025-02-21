import { types } from 'node:util';

import { RollupOptions } from 'rollup';

export function setExternals(
  rollupOptions: RollupOptions,
  externalNames: any[]
) {
  if (externalNames.length === 0) {
    return;
  }

  const { external } = rollupOptions;

  // if external indicates
  if (!external) {
    rollupOptions.external = externalNames;
  }
  // string or RegExp or array
  else if (
    typeof external === 'string'
    || types.isRegExp(external)
    || Array.isArray(external)
  ) {
    rollupOptions.external = externalNames.concat(external);
  }
  // function
  else if (typeof external === 'function') {
    rollupOptions.external = function (
      source: string,
      importer: string | undefined,
      isResolved: boolean
    ): boolean | null | undefined | void {
      if (
        externalNames.some((libName) =>
          (types.isRegExp(libName) ? libName.test(source) : libName === source)
        )
      ) {
        return true;
      }
      return external(source, importer, isResolved);
    };
  }
}
