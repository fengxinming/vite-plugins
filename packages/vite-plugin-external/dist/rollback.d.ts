import { Plugin, ResolvedConfig } from 'vite';
import { ExternalFn, Options } from './typings';
export declare function cleanupCache(externals: Record<string, string> | ExternalFn | undefined, config: ResolvedConfig): Promise<void>;
export default function rollback(opts: Options): Plugin;
export * from './typings';
