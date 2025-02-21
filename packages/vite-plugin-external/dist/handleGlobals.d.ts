import { RollupOptions, Plugin as RollupPlugin } from 'rollup';
export declare function setOutputGlobals(rollupOptions: RollupOptions, globals?: Record<string, any>, externalGlobals?: (globals: Record<string, any>) => RollupPlugin): void;
