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
    cwd?: string;
    isAfter?: boolean;
    mockAssetsDir?: string;
    mockRouterOptions?: SirvConfig<HTTPVersion.V1> | SirvConfig<HTTPVersion.V2>;
    mockRoutes?: RouteConfig | RouteConfig[];
    mockRoutesDir?: string;
}
export default function createPlugin(opts: Options): Plugin;
