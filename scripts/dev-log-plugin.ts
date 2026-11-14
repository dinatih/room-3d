import type { Plugin } from 'vite';
import { appendFileSync, mkdirSync, readdirSync, renameSync, statSync, symlinkSync, unlinkSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

const unlinkIfExists = (target: string): boolean => {
  try { unlinkSync(target); return true; }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    return false;
  }
};

const formatBytes = (bytes: number): string =>
  bytes >= 1024 * 1024 ? `${Number((bytes / 1024 / 1024).toFixed(1))} Mio`
    : bytes >= 1024 ? `${Number((bytes / 1024).toFixed(1))} Kio`
      : `${bytes} o`;

/** Keep recent document journals within a shared disk budget, including long-running sessions. */
export function devLogPlugin(directory = '/tmp/room-3d-logs', maxBytes = 500 * 1024 * 1024): Plugin {
  if (!Number.isSafeInteger(maxBytes) || maxBytes <= 0) throw Error('Invalid log size limit');
  return {
    name: 'app-log-file',
    configureServer(server) {
      const scan = () => {
        mkdirSync(directory, { recursive: true });
        const files = new Map<string, number>();
        let total = 0;
        for (const name of readdirSync(directory).sort()) {
          if (!/^\d{4}-.*\.jsonl$/.test(name)) continue;
          const file = path.join(directory, name);
          try {
            const size = statSync(file).size;
            files.set(file, size);
            total += size;
          } catch (error) {
            if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
          }
        }
        return { files, total };
      };
      const prune = (incoming: number, state = scan()) => {
        const removed: string[] = [];
        let freed = 0;
        for (const [file, size] of state.files) {
          if (state.total + incoming <= maxBytes) break;
          if (unlinkIfExists(file)) {
            removed.push(path.basename(file));
            freed += size;
          }
          state.files.delete(file);
          state.total -= size;
        }
        if (removed.length) {
          const plural = removed.length > 1 ? 's' : '';
          server.config.logger.info(
            `Logs : ${removed.length} fichier${plural} supprimé${plural} (libéré : ${formatBytes(freed)}, reste ${formatBytes(state.total)} / ${formatBytes(maxBytes)}) : ${removed.join(', ')}`,
          );
        }
        return { ...state, pruned: removed.length > 0 };
      };
      const updateLatest = (files: Map<string, number>) => {
        const latest = [...files.keys()].sort().at(-1);
        const link = path.join(directory, 'latest.jsonl');
        if (!latest) { unlinkIfExists(link); return; }
        const temporary = path.join(directory, `.latest-${process.pid}`);
        unlinkIfExists(temporary);
        symlinkSync(latest, temporary);
        renameSync(temporary, link);
      };
      let tracked = prune(0);
      updateLatest(tracked.files);
      server.config.logger.info(`Logs : ${directory}/latest.jsonl (${formatBytes(tracked.total)} / limite ${formatBytes(maxBytes)})`);
      server.ws.on('room:app-log', payload => {
        try {
          if (typeof payload.session !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(payload.session)) throw Error('Invalid log session');
          const started = new Date(payload.pageStartedAt).toISOString().replace(/[:.]/g, '-');
          const file = path.join(directory, `${started}_${payload.session}.jsonl`);
          let text = JSON.stringify({ receivedAt: new Date().toISOString(), ...payload }) + '\n';
          const textBytes = Buffer.byteLength(text);
          // Vérifier sans rescanner tout le dossier à chaque événement, tout en détectant une suppression externe.
          if (tracked.files.has(file)) {
            try {
              const liveSize = statSync(file).size;
              const prevSize = tracked.files.get(file)!;
              if (liveSize !== prevSize) {
                tracked.files.set(file, liveSize);
                tracked.total += liveSize - prevSize;
              }
            } catch (error) {
              if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
              tracked.total -= tracked.files.get(file)!;
              tracked.files.delete(file);
            }
          }
          const needsPrune = tracked.total + textBytes > maxBytes;
          const before = needsPrune ? scan() : tracked;
          // Reserve the session header as well before deleting any existing journals.
          const needsHeader = !before.files.has(file) || before.total + textBytes > maxBytes;
          const revision = needsHeader
            ? execFileSync('git', ['rev-parse', 'HEAD'], { cwd: server.config.root, encoding: 'utf8' }).trim() : '';
          const changes = revision ? execFileSync('git', ['status', '--short'], { cwd: server.config.root, encoding: 'utf8' }) : '';
          const header = needsHeader
            ? JSON.stringify({ receivedAt: new Date().toISOString(), session: payload.session,
                entry: { tag: 'system', action: 'server_session', data: { revision, changes, file } } }) + '\n'
            : '';
          const headerBytes = Buffer.byteLength(header);
          if (textBytes + headerBytes > maxBytes) throw Error('Log event exceeds disk budget');
          const state = needsPrune || needsHeader ? prune(textBytes + headerBytes, before) : { ...before, pruned: false };
          const created = !state.files.has(file);
          if (created) text = header + text;
          appendFileSync(file, text);
          const written = Buffer.byteLength(text);
          state.files.set(file, (state.files.get(file) ?? 0) + written);
          state.total += written;
          tracked = state;
          if (created || state.pruned) updateLatest(state.files);
        } catch (error) {
          tracked = scan();
          server.config.logger.error(`Échec journal applicatif : ${error}`);
        }
      });
    },
  };
}
