import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import vitePluginExternal from '../../packages/vite-plugin-external';
import vitePluginCp from '../../packages/vite-plugin-cp';

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
    }),
    vitePluginCp({
      targets: [
        { src: './node_modules/vite/dist', dest: 'dist/test' },
        { src: './node_modules/vite/dist', dest: 'dist/test2', flatten: false },
        { src: './node_modules/vite/README.md', dest: 'dist' }
      ]
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
