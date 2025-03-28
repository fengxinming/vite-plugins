import { ResolvedConfig } from 'vite';
declare function getValue<T = any>(object: Record<string, any>, path: string | string[], defaultValue?: any): T;
declare function escapeRegex(str: string): string;
declare const flattenId: (id: string) => string;
declare function getDepsCacheDir(config: ResolvedConfig, ssr: boolean): string;
export { escapeRegex, flattenId, getDepsCacheDir, getValue };
