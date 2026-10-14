import config from '../vite.config.ts';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

// Other imports can be edited concurrently. Preview the committed registry
// plus the draft Inter-X manifest without changing those working files.
const registryPath = path.resolve('src/features/scene/animations/animationRegistry.ts');
const registry = execFileSync('git', ['show', 'HEAD:src/features/scene/animations/animationRegistry.ts'], { encoding: 'utf8' });

// Isolated preview of the draft catalog; the studio's manifests stay untouched.
export default {
  ...config,
  cacheDir: '/tmp/room-interx-priority-vite',
  server: { ...config.server, hmr: false, watch: null },
  plugins: [{
    name: 'interx-draft-preview',
    enforce: 'pre',
    load(id) {
      if (id.split('?')[0] === registryPath) return registry;
    },
    resolveId(source, importer) {
      if (source === './animations_manifest.json' && importer?.endsWith('/animations/interxManifest.ts')) {
        return path.resolve('scripts/interx_priority_draft_manifest.json');
      }
    },
  }, ...config.plugins],
};
