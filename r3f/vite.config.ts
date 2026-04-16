import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@data':   path.resolve(__dirname, '../js/ui'),
      '@config': path.resolve(__dirname, '../js/config.js'),
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
