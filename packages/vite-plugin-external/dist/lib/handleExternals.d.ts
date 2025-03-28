import type { UserConfig } from 'vite';
import { ResolvedOptions } from '../typings';
export declare function checkLibName(externalArray: Array<RegExp | string>, source: string): boolean;
export declare function collectExternals(globalObject: Record<string, any>, opts: ResolvedOptions): any[];
export declare function setExternals(opts: ResolvedOptions, config: UserConfig): void;
