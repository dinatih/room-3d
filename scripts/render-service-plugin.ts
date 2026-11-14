import type { Plugin } from 'vite';
import { spawn } from 'node:child_process';
import { closeSync, openSync } from 'node:fs';

const RENDER_PORT = Number(process.env.RENDER_PORT || 5174);
const SERVICE_URL = `http://127.0.0.1:${RENDER_PORT}`;
const LOG_FILE = '/tmp/room-3d-render-service.log';

async function isRenderServiceReady(): Promise<boolean> {
  try {
    const response = await fetch(`${SERVICE_URL}/api/render-jobs`, {
      signal: AbortSignal.timeout(1000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function startRenderService(root: string): Promise<void> {
  if (await isRenderServiceReady()) return;

  const logFd = openSync(LOG_FILE, 'a');
  const child = spawn('npm', ['run', 'render:service'], {
    cwd: root,
    detached: true,
    stdio: ['ignore', logFd, logFd],
  });
  closeSync(logFd);
  child.unref();

  let exitError: string | null = null;
  const onError = (error: Error) => {
    exitError = error.message;
  };
  const onExit = (code: number | null, signal: NodeJS.Signals | null) => {
    exitError = `Le service s'est arrêté prématurément (code=${code ?? 'null'}, signal=${signal ?? 'null'}). Voir ${LOG_FILE}`;
  };
  child.once('error', onError);
  child.once('exit', onExit);

  try {
    const deadline = Date.now() + 15000;
    while (Date.now() < deadline) {
      if (exitError) throw new Error(exitError);
      if (await isRenderServiceReady()) return;
      await new Promise(resolve => setTimeout(resolve, 150));
    }
    throw new Error(`Délai dépassé en attendant ${SERVICE_URL}. Voir ${LOG_FILE}`);
  } finally {
    child.off('error', onError);
    child.off('exit', onExit);
  }
}

/** Démarre automatiquement `npm run render:service` à la demande en dev. */
export function renderServicePlugin(): Plugin {
  let starting: Promise<void> | null = null;

  return {
    name: 'render-service-launcher',
    configureServer(server) {
      server.middlewares.use('/api/render-service/start', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end('Method Not Allowed');
          return;
        }
        if (!starting) {
          server.config.logger.info(`Démarrage du service raytracing (${SERVICE_URL})…`);
          starting = startRenderService(server.config.root).finally(() => {
            starting = null;
          });
        }
        void starting
          .then(() => {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ ok: true, url: SERVICE_URL }));
          })
          .catch((error: unknown) => {
            res.statusCode = 500;
            res.end(error instanceof Error ? error.message : String(error));
          });
      });
    },
  };
}
