const assert = require('node:assert/strict');
const fs = require('node:fs');

(async () => {
  const { createServer } = await import('vite');
  const server = await createServer({ server: { port: 0, open: false } });
  let socket;
  try {
    await server.listen();
    const port = server.httpServer.address().port;
    const payload = { session: 'log-test-' + Date.now(), url: 'http://localhost/log-test', entry: { tag: 'test', message: 'Vérification transport des logs', action: 'nav_blocked' } };
    const received = new Promise(resolve => server.ws.on('room:app-log', resolve));
    socket = new WebSocket(`ws://localhost:${port}`, 'vite-hmr');
    await new Promise((resolve, reject) => {
      socket.addEventListener('open', resolve, { once: true });
      socket.addEventListener('error', reject, { once: true });
    });
    socket.send(JSON.stringify({ type: 'custom', event: 'room:app-log', data: payload }));
    await received;
    const line = fs.readFileSync('/tmp/room-3d-app.jsonl', 'utf8').trim().split('\n').at(-1);
    const saved = JSON.parse(line);
    assert.deepEqual(saved.entry, payload.entry);
    assert.equal(saved.session, payload.session);
    assert.equal(saved.url, payload.url);
    assert.ok(saved.receivedAt);
    console.log('OK : événement Vite reçu et persisté avec ses métadonnées.');
  } finally {
    socket?.close();
    await server.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
