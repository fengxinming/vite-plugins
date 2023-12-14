export interface Options {
    targets?: Record<string, string>;
    preambleCode?: string;
}
/**
 * Makes the script to be served with the text/javascript MIME type instead of module MIME type.
 * @param options Options
 * @returns a vite plugin
 */
export default function createPlugin(options?: Options): {
    name: string;
    config(config: any): void;
    configResolved(config: any): void;
    load(id: any): string | undefined;
};
