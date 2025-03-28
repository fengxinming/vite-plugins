import { ExternalFn } from '../typings';
export declare function stash(libName: string, globalName: string, cacheDir: string): Promise<string>;
export declare function eachExternal(obj: Record<string, string> | Array<[string, string]>, cacheDir: string, cb: (libName: string, globalName: string) => Promise<string>): Promise<string[]>;
export declare class Resolver {
    private readonly cacheDir;
    stashed: boolean;
    readonly stashMap: Map<string, string>;
    private resolveHook?;
    constructor(cacheDir: string);
    stash(libName: string, globalName: string): Promise<string>;
    stashObject(obj: Record<string, string> | Array<[string, string]>): Promise<string[]>;
    resolve(source: string, importer: string | undefined, isResolved: boolean): Promise<string | boolean | undefined>;
    addHook(fn: ExternalFn): void;
}
