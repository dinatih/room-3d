import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Allow importing shared data from the parent project
      '@data': path.resolve(__dirname, '../js/ui'),
    },
  },
  server: {
    port: 5173,
  },
});
