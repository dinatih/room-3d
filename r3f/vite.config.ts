import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  base: '/r3f/dist/',
  resolve: {
    alias: {
      '@data':   path.resolve(__dirname, 'src/data'),
      '@config': path.resolve(__dirname, 'src/config.ts'),
    },
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
