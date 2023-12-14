import { Config as SirvConfig, HTTPVersion, RouteOptions, Handler } from 'find-my-way';
import { Plugin } from 'vite';
export interface HandleRoute {
    file?: string;
    handler?: any | Handler<HTTPVersion.V1>;
    options?: RouteOptions;
    store?: any;
}
export interface RouteConfig {
    [route: string]: string | Handler<HTTPVersion.V1> | HandleRoute;
}
export interface Options {
    /**
     * The directory to serve files from.
     * @default `process.cwd()`
     */
    cwd?: string;
    /**
     * If `true`, these mock routes is matched after internal middlewares are installed.
     * @default `false`
     */
    isAfter?: boolean;
    /** Specify the directory to define mock assets. */
    mockAssetsDir?: string;
    /** Initial options of `find-my-way`. see more at https://github.com/delvedor/find-my-way#findmywayoptions */
    mockRouterOptions?: SirvConfig<HTTPVersion.V1> | SirvConfig<HTTPVersion.V2>;
    /** Initial list of mock routes that should be added to the dev server. */
    mockRoutes?: RouteConfig | RouteConfig[];
    /** Specify the directory to define mock routes that should be added to the dev server. */
    mockRoutesDir?: string;
}
/**
 * Provides a simple way to mock data.
 * @param opts Options
 * @returns a vite plugin
 */
export default function createPlugin(opts: Options): Plugin;
