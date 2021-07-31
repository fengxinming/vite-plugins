import { Plugin } from 'vite'
import { Options } from '@vitejs/plugin-react-refresh'
import { PluginItem } from '@babel/core'

export interface EnhancementOptions extends Options {
  transformPlugins?: PluginItem[]
}

type PluginFactory = (options?: EnhancementOptions) => Plugin

export default PluginFactory
