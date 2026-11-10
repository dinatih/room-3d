import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { execSync } from 'child_process';
import pkg from './package.json' with { type: 'json' };
import { devLogPlugin } from './scripts/dev-log-plugin.ts';

const commitHash = (() => {
  try {
    const raw = process.env.VITE_COMMIT_HASH || execSync('git rev-parse --short HEAD').toString();
    return raw.trim().slice(0, 7);
  } catch {
    return 'dev';
  }
})();

const buildTime = new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC';

export default defineConfig({
  plugins: [react(), devLogPlugin()],
  base: '/',
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __COMMIT_HASH__: JSON.stringify(commitHash),
    __BUILD_TIME__: JSON.stringify(buildTime),
  },
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
