import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { devLogPlugin } from './scripts/dev-log-plugin.ts';

export default defineConfig({
  plugins: [react(), devLogPlugin()],
  base: '/',
  resolve: {
    alias: {
      '@':         path.resolve(import.meta.dirname, 'src'),
      '@features': path.resolve(import.meta.dirname, 'src/features'),
      '@shared':   path.resolve(import.meta.dirname, 'src'),
      '@config':   path.resolve(import.meta.dirname, 'src/features/scene/config.ts'),
    },
  },
  server: {
    port: 5173,
    watch: {
      ignored: [
        '**/.git/**',
      ],
    },
  },
  build: {
    rolldownOptions: {
      input: {
        inventory: path.resolve(import.meta.dirname, 'index.html'),
      },
    },
  },
});
