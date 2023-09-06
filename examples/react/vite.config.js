import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import vitePluginExternal from '../../packages/vite-plugin-external';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    vitePluginExternal({
      externals: {
        react: '$linkdesign.React',
        'react-dom': '$linkdesign.ReactDOM',
        'prop-types': '$linkdesign.PropTypes'
      }
    })
  ],
  server: {
    open: true
  },
  build: {
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        manualChunks: undefined,
        assetFileNames: 'assets/[name][extname]',
        entryFileNames: '[name].js',
        format: 'iife'
      }
    }
  }
})
