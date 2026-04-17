import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  base: '/r3f/dist/',
  resolve: {
    alias: [
      { find: '@data',         replacement: path.resolve(__dirname, '../js/ui') },
      { find: '@config',       replacement: path.resolve(__dirname, '../js/config.js') },
      // js/ files imported via @data alias use bare 'three' — resolve to r3f's own copy.
      // three/addons/* must come before the bare 'three' alias so sub-paths resolve correctly.
      { find: /^three\/addons\/(.*)$/, replacement: path.resolve(__dirname, 'node_modules/three/examples/jsm/$1') },
      { find: 'three',         replacement: path.resolve(__dirname, 'node_modules/three') },
    ],
  },
  server: {
    port: 5173,
    fs: {
      allow: ['..'],
    },
  },
  build: {
    rollupOptions: {
      input: {
        inventory: path.resolve(__dirname, 'index.html'),
      },
    },
  },
});
