import { Plugin } from 'vite';

export interface BasicOptions {
  externals: Externals;
}

export interface Externals {
  [propName: string]: any;
}

export interface Options extends BasicOptions {
  externals: Externals;
  development?: BasicOptions;
  production?: BasicOptions;
  cacheDir?: string;
}

export default function createPlugin(options?: Options): Plugin;
