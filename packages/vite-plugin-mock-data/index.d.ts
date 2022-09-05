import { Plugin } from 'vite';
import { IncomingMessage, ServerResponse } from 'http';
import Router from 'find-my-way';

export function Handler (req: IncomingMessage, res: ServerResponse): void;

export interface HandleRoute {
  file?: string;
  handler?: string | Handler;
}

export type RouteConfig = string | HandleRoute;

export interface Options {
  isAfter?: boolean;
  mockAssetsDir: string;
  mockRouterOptions?: Router.Config;
  mockRoutes?: RouteConfig | RouteConfig[]
  mockRoutesDir?: string;
}

export default function createPlugin(options?: Options): Plugin;
