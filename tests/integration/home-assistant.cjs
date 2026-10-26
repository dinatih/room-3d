const assert = require('node:assert/strict');
const { WebSocketServer } = require('ws');
const launchBrowser = require('../../scripts/browser-test-options.cjs');

(async () => {
  let accepting = true;
  let entity = { entity_id: 'light.entree_entree', state: 'off', attributes: {}, context: {}, last_changed: new Date().toISOString(), last_updated: new Date().toISOString() };
  const calls = [];
  const subscriptions = new Map();
  const server = new WebSocketServer({ host: '127.0.0.1', port: 0 });
  await new Promise(resolve => server.once('listening', resolve));
  const url = `http://127.0.0.1:${server.address().port}`;
  const publish = (state, attributes = {}) => {
    const previous = entity;
    entity = { ...entity, state, attributes };
    for (const [ws, id] of subscriptions) if (ws.readyState === 1) ws.send(JSON.stringify({
      id, type: 'event', event: { event_type: 'state_changed', data: { entity_id: entity.entity_id, new_state: entity, old_state: previous } },
    }));
  };
  server.on('connection', ws => {
    if (!accepting) { ws.close(); return; }
    ws.send(JSON.stringify({ type: 'auth_required', ha_version: '2026.10.3' }));
    ws.on('close', () => subscriptions.delete(ws));
    ws.on('message', bytes => {
      const message = JSON.parse(bytes);
      if (message.type === 'auth') { ws.send(JSON.stringify({ type: 'auth_ok', ha_version: '2026.10.3' })); return; }
      let result = null;
      if (message.type === 'get_states') result = [entity];
      else if (message.type === 'subscribe_events') subscriptions.set(ws, message.id);
      else if (message.type === 'unsubscribe_events') subscriptions.delete(ws);
      else if (message.type === 'call_service') calls.push(message);
      else if (message.type === 'ping') { ws.send(JSON.stringify({ id: message.id, type: 'pong' })); return; }
      else if (message.type !== 'supported_features') throw Error(`Unexpected HA command: ${message.type}`);
      ws.send(JSON.stringify({ id: message.id, type: 'result', success: true, result }));
    });
  });
  let browser;
  try {
    browser = await launchBrowser({ args: ['--no-sandbox', '--disable-dev-shm-usage'] });
    const page = await browser.newPage();
    const errors = [];
    page.on('console', message => { if (message.type() === 'error') console.error('Page console:', message.text()); });
    await page.evaluateOnNewDocument(() => window.addEventListener('unhandledrejection', event => console.error('Unhandled rejection:', JSON.stringify(event.reason))));
    page.on('pageerror', error => errors.push(error.message));
    page.on('requestfailed', request => console.error('Failed resource:', request.url().split('?')[0], request.failure()?.errorText));
    await page.setRequestInterception(true);
    page.on('request', request => {
      if (new URL(request.url()).pathname === '/src/main.tsx') return request.respond({ contentType: 'application/javascript', body: '' });
      if (request.url().startsWith('https://gc.zgo.at/')) return request.respond({ contentType: 'application/javascript', body: '' });
      return request.continue();
    });
    await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });
    await page.evaluate(url => {
      sessionStorage.setItem('room3d.ha.enabled', '1');
      sessionStorage.setItem('room3d.ha.auth', JSON.stringify({ hassUrl: url, clientId: location.origin, access_token: 'integration-test', refresh_token: 'integration-test', expires: Date.now() + 3600000 }));
    }, url);
    await page.evaluate(async () => { window.haTest = await import('/tests/fixtures/home-assistant-entry.tsx'); });
    await page.waitForFunction(() => window.haTest.useHomeAssistant.getState().available);
    const read = () => page.evaluate(() => ({ remote: window.haTest.useHomeAssistant.getState(), on: window.haTest.useSceneStore.getState().furniture.lampCorridor }));
    assert.equal((await read()).on, false);
    assert.equal(calls.length, 0, 'Initial state must never send a command');
    await page.evaluate(() => window.haTest.useSceneStore.getState().triggerAction('lampCorridor', true));
    assert.equal(calls.length, 0, 'NPC action must never command a real light');
    assert.equal((await read()).on, false);
    await page.evaluate(() => [...document.querySelectorAll('button')].find(button => button.textContent.includes('Lampe Couloir')).click());
    await page.waitForFunction(() => !window.haTest.useHomeAssistant.getState().pending);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].service, 'turn_on');
    assert.equal(calls[0].service_data.entity_id, 'light.entree_entree');
    assert.equal((await read()).on, false, 'Service acknowledgment must not optimistically change the scene');
    publish('on', { brightness: 128, rgb_color: [20, 100, 240] });
    await page.waitForFunction(() => window.haTest.useSceneStore.getState().furniture.lampCorridor);
    assert.equal((await read()).remote.lamp.brightness, 128 / 255);
    assert.deepEqual((await read()).remote.lamp.rgb, [20, 100, 240]);
    assert.equal(calls.length, 1, 'An HA update must not loop back into a command');
    publish('unavailable');
    await page.waitForFunction(() => !window.haTest.useHomeAssistant.getState().available);
    assert.equal((await read()).on, true, 'Unavailable must preserve the last state');
    assert(await page.evaluate(() => [...document.querySelectorAll('button')].find(button => button.textContent.includes('Lampe Couloir')).disabled));
    accepting = false;
    for (const ws of server.clients) ws.terminate();
    await page.waitForFunction(() => window.haTest.useHomeAssistant.getState().status === 'reconnecting');
    await page.evaluate(() => window.haTest.useSceneStore.getState().toggleFurniture('lampCorridor'));
    assert.equal(calls.length, 1, 'Offline commands must not be queued');
    entity = { ...entity, state: 'off', attributes: {} };
    accepting = true;
    await page.waitForFunction(() => window.haTest.useHomeAssistant.getState().available, { timeout: 30000 });
    assert.equal((await read()).on, false, 'Reconnect must fetch current state');
    assert.equal(calls.length, 1, 'Reconnect must not replay a command');
    await page.evaluate(() => [...document.querySelectorAll('button')].find(button => button.textContent.includes('Déconnecter Home Assistant')).click());
    await page.waitForFunction(() => !window.haTest.useHomeAssistant.getState().enabled);
    assert.equal(await page.evaluate(() => sessionStorage.getItem('room3d.ha.auth')), null);
    await page.evaluate(() => window.haTest.useSceneStore.getState().toggleFurniture('lampCorridor'));
    assert.equal((await read()).on, true, 'Simulation must work after voluntary disconnect');
    assert.equal(calls.length, 1);
    await page.evaluate(() => window.haTest.unmount());
    assert.deepEqual(errors, []);
    console.log('PASS: initial sync, user command, NPC isolation, state/color updates, unavailable, reconnect, no replay, logout and simulation');
  } finally {
    if (browser) await browser.close();
    for (const ws of server.clients) ws.terminate();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
