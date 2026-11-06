import type { Plugin } from 'vite';
import { appendFileSync, mkdirSync, readdirSync, renameSync, statSync, symlinkSync, unlinkSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

/** Keep recent document journals within a shared disk budget, including long-running sessions. */
export function devLogPlugin(directory = '/tmp/room-3d-logs', maxBytes = 500 * 1024 * 1024): Plugin {
  if (!Number.isSafeInteger(maxBytes) || maxBytes <= 0) throw Error('Invalid log size limit');
  return {
    name: 'app-log-file',
    configureServer(server) {
      mkdirSync(directory, { recursive: true });
      const files = new Map(readdirSync(directory).filter(name => /^\d{4}-.*\.jsonl$/.test(name)).sort()
        .map(name => { const file = path.join(directory, name); return [file, statSync(file).size] as const; }));
      let total = [...files.values()].reduce((sum, size) => sum + size, 0);
      const prune = (incoming: number) => {
        if (total + incoming <= maxBytes) return;
        for (const [file, size] of [...files].sort(([a], [b]) => a.localeCompare(b))) {
          if (total + incoming <= maxBytes) break;
          unlinkSync(file);
          files.delete(file);
          total -= size;
        }
      };
      const updateLatest = () => {
        const latest = [...files.keys()].sort().at(-1);
        const link = path.join(directory, 'latest.jsonl');
        if (!latest) { try { unlinkSync(link); } catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; } return; }
        const temporary = path.join(directory, `.latest-${process.pid}`);
        symlinkSync(latest, temporary);
        renameSync(temporary, link);
      };
      prune(0);
      updateLatest();
      server.config.logger.info(`Logs : ${directory}/latest.jsonl (limite totale : ${maxBytes / 1024 / 1024} Mio)`);
      server.ws.on('room:app-log', payload => {
        try {
          if (typeof payload.session !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(payload.session)) throw Error('Invalid log session');
          const started = new Date(payload.pageStartedAt).toISOString().replace(/[:.]/g, '-');
          const file = path.join(directory, `${started}_${payload.session}.jsonl`);
          let text = JSON.stringify({ receivedAt: new Date().toISOString(), ...payload }) + '\n';
          // Reserve the session header as well before deleting any existing journals.
          const revision = !files.has(file) || total + Buffer.byteLength(text) > maxBytes
            ? execFileSync('git', ['rev-parse', 'HEAD'], { cwd: server.config.root, encoding: 'utf8' }).trim() : '';
          const changes = revision ? execFileSync('git', ['status', '--short'], { cwd: server.config.root, encoding: 'utf8' }) : '';
          const header = JSON.stringify({ receivedAt: new Date().toISOString(), session: payload.session,
            entry: { tag: 'system', action: 'server_session', data: { revision, changes, file } } }) + '\n';
          if (Buffer.byteLength(text + header) > maxBytes) throw Error('Log event exceeds disk budget');
          const previousCount = files.size;
          prune(Buffer.byteLength(text) + (!files.has(file) || total + Buffer.byteLength(text) > maxBytes ? Buffer.byteLength(header) : 0));
          const created = !files.has(file);
          if (created) text = header + text;
          appendFileSync(file, text);
          const bytes = Buffer.byteLength(text);
          files.set(file, (files.get(file) ?? 0) + bytes);
          total += bytes;
          if (created || files.size !== previousCount) updateLatest();
        } catch (error) { server.config.logger.error(`Échec journal applicatif : ${error}`); }
      });
    },
  };
}
