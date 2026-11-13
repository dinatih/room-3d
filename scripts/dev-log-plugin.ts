import type { Plugin } from 'vite';
import { appendFileSync, mkdirSync, readdirSync, renameSync, statSync, symlinkSync, unlinkSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

const unlinkIfExists = (target: string) => {
  try { unlinkSync(target); }
  catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; }
};

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
        let pruned = false;
        for (const [file, size] of state.files) {
          if (state.total + incoming <= maxBytes) break;
          unlinkIfExists(file);
          state.files.delete(file);
          state.total -= size;
          pruned = true;
        }
        return { ...state, pruned };
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
      updateLatest(prune(0).files);
      server.config.logger.info(`Logs : ${directory}/latest.jsonl (limite totale : ${maxBytes / 1024 / 1024} Mio)`);
      server.ws.on('room:app-log', payload => {
        try {
          if (typeof payload.session !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(payload.session)) throw Error('Invalid log session');
          const started = new Date(payload.pageStartedAt).toISOString().replace(/[:.]/g, '-');
          const file = path.join(directory, `${started}_${payload.session}.jsonl`);
          let text = JSON.stringify({ receivedAt: new Date().toISOString(), ...payload }) + '\n';
          const textBytes = Buffer.byteLength(text);
          const before = scan();
          // Reserve the session header as well before deleting any existing journals.
          const needsHeader = !before.files.has(file) || before.total + textBytes > maxBytes;
          const revision = needsHeader
            ? execFileSync('git', ['rev-parse', 'HEAD'], { cwd: server.config.root, encoding: 'utf8' }).trim() : '';
          const changes = revision ? execFileSync('git', ['status', '--short'], { cwd: server.config.root, encoding: 'utf8' }) : '';
          const header = JSON.stringify({ receivedAt: new Date().toISOString(), session: payload.session,
            entry: { tag: 'system', action: 'server_session', data: { revision, changes, file } } }) + '\n';
          if (textBytes + Buffer.byteLength(header) > maxBytes) throw Error('Log event exceeds disk budget');
          const { files, pruned } = prune(textBytes + (needsHeader ? Buffer.byteLength(header) : 0), before);
          const created = !files.has(file);
          if (created) text = header + text;
          appendFileSync(file, text);
          files.set(file, (files.get(file) ?? 0) + Buffer.byteLength(text));
          if (created || pruned) updateLatest(files);
        } catch (error) { server.config.logger.error(`Échec journal applicatif : ${error}`); }
      });
    },
  };
}
