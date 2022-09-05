import { Plugin } from 'vite';

export interface Options {
  [propName: string]: any;
}

export default function createPlugin(options?: Options): Plugin;
