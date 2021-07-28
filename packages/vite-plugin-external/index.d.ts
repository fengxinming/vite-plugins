import { Plugin } from 'vite'

export interface externals {
  [propName: string]: any
}

export interface Options {
  externals: externals
  development?: { externals: externals }
  production?: { externals: externals }
}

type PluginFactory = (options?: Options) => Plugin

export default PluginFactory
