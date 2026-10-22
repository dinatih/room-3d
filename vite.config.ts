import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { appendFileSync } from 'node:fs';

export default defineConfig({
  plugins: [react(), {
    name: 'app-log-file',
    configureServer(server) {
      const logFile = '/tmp/room-3d-app.jsonl';
      server.config.logger.info(`Logs applicatifs Chrome : ${logFile}`);
      server.ws.on('room:app-log', (payload) => {
        try {
          appendFileSync(logFile, JSON.stringify({ receivedAt: new Date().toISOString(), ...payload }) + '\n');
        } catch (error) {
          server.config.logger.error(`Échec écriture ${logFile} : ${error}`);
        }
      });
    },
  }],
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
    watch: {
      ignored: [
        '**/.git/**',
      ],
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
