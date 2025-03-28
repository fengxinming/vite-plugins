import type { UserConfig } from 'vite';
import { Resolver } from '../common/Resolver';
import type { ResolvedOptions } from '../typings';
export declare function setOptimizeDeps(opts: ResolvedOptions, config: UserConfig): Promise<Resolver | null>;
