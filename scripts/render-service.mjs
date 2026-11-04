import { createServer } from 'vite';
import puppeteer from 'puppeteer';
import { mkdir, writeFile, readdir, readFile } from 'node:fs/promises';
import { createReadStream, createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { randomUUID } from 'node:crypto';
const jobs = new Map();
const port = Number(process.env.RENDER_PORT || 5174);
const serviceUrl = `http://127.0.0.1:${port}`;
await mkdir('renders', { recursive: true });
const server = await createServer({ plugins: [{ name: 'render-jobs', configureServer(s) { s.middlewares.use('/api/render-jobs', handleJobs); s.middlewares.use((req, res, next) => {
  if (req.url !== '/render-jobs') return next();
  res.writeHead(302, { Location: '/render-jobs.html' }); res.end();
}); } }], server: { host: '127.0.0.1', port, strictPort: true }, open: false });
let active = false;
async function pump() {
  if (active) return;
  const job = [...jobs.values()].find(j => j.state === 'queued');
  if (!job) return;
  active = true;
  let browser;
  try {
    job.state = 'rendering';
    browser = await puppeteer.launch({ headless: true, protocolTimeout: 0, args: ['--enable-gpu', '--disable-background-timer-throttling', '--disable-renderer-backgrounding'] });
    job.browser = browser;
    if (job.state === 'cancelled') return;
    const page = await browser.newPage(); job.page = page;
    await page.exposeFunction('progress', samples => { job.samples = samples; });
    await page.goto(`${serviceUrl}/render-worker.html`);
    await page.waitForFunction(() => typeof window.renderJob === 'function');
    const png = await page.evaluate(async url => window.renderJob(url), `${serviceUrl}/api/render-jobs/${job.id}/input`);
    await writeFile(`renders/${job.id}.png`, Buffer.from(png, 'base64'));
    job.state = 'completed';
  } catch (error) { if (job.state !== 'cancelled') job.state = 'failed'; job.error = String(error); }
  finally { delete job.page; delete job.browser; await browser?.close(); await writeFile(`renders/${job.id}.json`, JSON.stringify(job)); active = false; void pump(); }
}
async function handleJobs(req, res) {
  const origin = req.headers.origin;
  if (origin && !['http://localhost:5173', 'http://127.0.0.1:5173', serviceUrl].includes(origin)) { res.statusCode = 403; res.end(); return; }
  if (origin) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.end(); return; }
  try {
    const action = req.url.split('/').filter(Boolean);
    if (action.length) {
      const job = jobs.get(action[0]);
      if (!job) { res.statusCode = 404; res.end(); return; }
      if (action[1] === 'input') { res.setHeader('Content-Type', 'application/octet-stream'); await pipeline(createReadStream(`renders/${job.id}.bin`), res); return; }
      if (action[1] === 'image') { res.setHeader('Content-Type', 'image/png'); res.end(await readFile(`renders/${job.id}.png`)); return; }
      if (req.method === 'POST') {
        if (action[1] === 'cancel') { job.state = 'cancelled'; await job.browser?.close(); }
        else if (['pause', 'resume'].includes(action[1]) && job.page) { await job.page.evaluate(paused => { window.renderPaused = paused; }, action[1] === 'pause'); job.state = action[1] === 'pause' ? 'paused' : 'rendering'; }
        res.end('{}'); return;
      }
    }
    if (req.method === 'POST') {
      if (req.headers['content-type'] !== 'application/octet-stream') throw new Error('Archive binaire de rendu attendue. Rechargez la page.');
      const job = { id: randomUUID(), state: 'queued', samples: 0 };
      await pipeline(req, createWriteStream(`renders/${job.id}.bin`));
      jobs.set(job.id, job); await writeFile(`renders/${job.id}.json`, JSON.stringify({ id: job.id, state: 'interrupted', samples: 0 })); res.end(JSON.stringify({ id: job.id })); void pump();
    } else { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify([...jobs.values()].map(({ page, browser, ...job }) => job))); }
  } catch (error) { res.statusCode = 400; res.end(String(error)); }
}
for (const file of await readdir('renders')) {
  if (!file.endsWith('.json')) continue;
  const job = JSON.parse(await readFile(`renders/${file}`, 'utf8')); jobs.set(job.id, job);
}
await server.listen();
console.log(`Service raytracing : ${serviceUrl}/render-jobs.html — résultats dans renders/`);
