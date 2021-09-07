import { Plugin } from 'vite'

export interface Externals {
  [propName: string]: any
}

export interface Options {
  externals: Externals
  development?: { externals: Externals }
  production?: { externals: Externals }
}

type createPlugin = (options?: Options) => Plugin

export default createPlugin
