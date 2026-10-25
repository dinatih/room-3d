import type { Plugin } from 'vite';
import { createWriteStream, mkdirSync, renameSync, symlinkSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

/** One append-only journal per document, shared across that document's HMR updates. */
export function devLogPlugin(directory = '/tmp/room-3d-logs'): Plugin {
  return {
    name: 'app-log-file',
    configureServer(server) {
      mkdirSync(directory, { recursive: true });
      const streams = new Map<string, ReturnType<typeof createWriteStream>>();
      let latestPageStartedAt = -Infinity;
      server.config.logger.info(`Logs par chargement de page : ${directory}/latest.jsonl`);
      server.ws.on('room:app-log', payload => {
        try {
          if (typeof payload.session !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(payload.session)) throw Error('Invalid log session');
          let stream = streams.get(payload.session);
          if (!stream) {
            const revision = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: server.config.root, encoding: 'utf8' }).trim();
            const changes = execFileSync('git', ['status', '--short'], { cwd: server.config.root, encoding: 'utf8' });
            const started = new Date(payload.pageStartedAt).toISOString().replace(/[:.]/g, '-');
            const file = path.join(directory, `${started}_${payload.session}.jsonl`);
            stream = createWriteStream(file, { flags: 'a' });
            stream.on('error', error => server.config.logger.error(`Échec écriture ${file} : ${error}`));
            streams.set(payload.session, stream);
            stream.write(JSON.stringify({ receivedAt: new Date().toISOString(), session: payload.session,
              entry: { tag: 'system', action: 'server_session', data: { revision, changes, file } } }) + '\n');
            if (Date.parse(payload.pageStartedAt) >= latestPageStartedAt) {
              const temporary = path.join(directory, `.latest-${process.pid}`);
              symlinkSync(file, temporary);
              renameSync(temporary, path.join(directory, 'latest.jsonl'));
              latestPageStartedAt = Date.parse(payload.pageStartedAt);
            }
            server.config.logger.info(`Nouvelle session : ${file}`);
          }
          stream.write(JSON.stringify({ receivedAt: new Date().toISOString(), ...payload }) + '\n');
        } catch (error) { server.config.logger.error(`Échec journal applicatif : ${error}`); }
      });
      server.httpServer?.once('close', () => { for (const stream of streams.values()) stream.end(); });
    },
  };
}
