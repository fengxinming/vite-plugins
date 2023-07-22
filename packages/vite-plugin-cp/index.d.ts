import { Plugin } from 'vite';
import { GlobbyOptions } from 'globby';

export interface Target {
  src: string;
  dest: string;
  rename?: string;
}

export interface Options {
  hook?: string;
  targets: Target[];
  globbyOptions?: GlobbyOptions;
}

export default function createPlugin(options?: Options): Plugin;
