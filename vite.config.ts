import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  base: '/',
  resolve: {
    alias: {
      '@':         path.resolve(__dirname, 'src'),
      '@features': path.resolve(__dirname, 'src/features'),
      '@shared':   path.resolve(__dirname, 'src'),
      '@config':   path.resolve(__dirname, 'src/features/scene/config.ts'),
    },
  },
  server: {
    port: 5173,
  },
  build: {
    rollupOptions: {
      input: {
        inventory: path.resolve(__dirname, 'index.html'),
      },
    },
  },
});
