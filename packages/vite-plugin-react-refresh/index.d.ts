import { Plugin } from 'vite'
import { Options } from '@vitejs/plugin-react-refresh'
import { PluginItem } from '@babel/core'

export interface EnhancementOptions extends Options {
  transformPlugins?: PluginItem[]
}

export default function createPlugin(options?: EnhancementOptions): Plugin
