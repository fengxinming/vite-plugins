import { defineConfig } from 'vite';
import vitePluginExternal from 'vite-plugin-external';
import vitePluginIncludeCss from 'vite-plugin-include-css';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vitePluginExternal({
      externals: {
        react: '$linkdesign.React',
        'react-dom': '$linkdesign.ReactDOM',
        'prop-types': '$linkdesign.PropTypes'
      }
    }),
    vitePluginIncludeCss()
  ],
  server: {
    open: true
  },
  build: {
    outDir: 'dist/include-css',
    cssCodeSplit: false,
    // minify: false,
    rollupOptions: {
      output: {
        format: 'iife'
      }
    }
  }
});
