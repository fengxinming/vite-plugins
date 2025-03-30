import { defineConfig } from 'vite';
import vitePluginCp from 'vite-plugin-cp';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vitePluginCp({
      logLevel: 'TRACE',
      targets: [
        // Copy all files from 'node_modules/vite/dist' to 'dist/cp/test'
        { src: './node_modules/vite/dist', dest: 'dist/cp/test' },

        // Copy all files from 'node_modules/vite/dist' to 'dist/cp/test2', but keep the directory structure
        { src: './node_modules/vite/dist', dest: 'dist/cp/test2', flatten: false },

        // Copy the README.md file from 'node_modules/vite' to 'dist/cp'
        { src: './node_modules/vite/README.md', dest: 'dist/cp' },

        { src: './node_modules/vite/index.cjs', dest: 'dist/cp', rename: 'index.js' },

        // Copy all .ts files from 'node_modules/vite' to 'dist/cp/types'
        { src: './node_modules/vite/**/*.ts', dest: 'dist/cp/types' },

        // Copy all .ts files from 'node_modules/vite' to 'dist/cp/types2', but modify the name
        {
          src: './node_modules/vite/**/*.ts', dest: 'dist/cp/types2', rename(name) {
            return name.replace('.d.ts', '.ts');
          }
        },

        // Copy the package.json file from 'node_modules/vite' to 'dist/cp', but modify the name and version
        {
          src: './node_modules/vite/package.json', dest: 'dist/cp', transform(buf: Buffer) {
            const pkg = JSON.parse(buf.toString());
            return JSON.stringify({
              ...pkg,
              name: 'vite-plugin-cp-test',
              version: '1.0.0'
            }, null, 2);
          }
        }
      ]
    })
  ],
  build: {
    outDir: 'dist/cp',
    lib: {
      entry: 'src/util/noop.ts',
      formats: ['es'],
      fileName: '[name]'
    }
  }
});
