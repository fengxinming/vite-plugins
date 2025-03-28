import type { ConfigEnv } from 'vite';
import type { Options, ResolvedOptions } from '../typings';
export declare function buildOptions(opts: Options, env: ConfigEnv): ResolvedOptions;
export declare function isRuntime({ command, interop }: ResolvedOptions): boolean;
