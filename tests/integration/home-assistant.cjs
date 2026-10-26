const assert = require('node:assert/strict');
const { WebSocketServer } = require('ws');
const launchBrowser = require('../../scripts/browser-test-options.cjs');

(async () => {
  const lights = [
    { key: 'lampCorridor', entity: 'light.entree_entree', button: 'Lampe Couloir', action: 'lampCorridor' },
    { key: 'lampBath', entity: 'light.douche_douche', button: 'Lampe SDB', action: 'lampBath' },
    { key: 'lampOn', entity: 'light.porte', button: 'Lumière Séjour (OLA)', action: 'lamp-toggle' },
    { key: 'lampKitchen', entity: 'light.cuisine_barre', button: 'Barre · Cuisine', action: 'kolvatten-toggle' },
  ];
  let accepting = true;
  let authorizationExchanges = 0;
  let refreshExchanges = 0;
  const entities = Object.fromEntries(lights.map(light => [light.entity, {
    entity_id: light.entity, state: light.key === 'lampOn' ? 'unavailable' : 'off', attributes: {},
    context: {}, last_changed: new Date().toISOString(), last_updated: new Date().toISOString(),
  }]));
  entities['light.principale_porte'] = { ...entities['light.porte'], entity_id: 'light.principale_porte', state: 'on' };
  const calls = [];
  const subscriptions = new Map();
  const server = new WebSocketServer({ host: '127.0.0.1', port: 0 });
  await new Promise(resolve => server.once('listening', resolve));
  const url = `http://127.0.0.1:${server.address().port}`;
  const publish = (entityId, state, attributes = {}) => {
    const previous = entities[entityId];
    const entity = entities[entityId] = { ...previous, state, attributes };
    for (const [ws, id] of subscriptions) if (ws.readyState === 1) ws.send(JSON.stringify({
      id, type: 'event', event: { event_type: 'state_changed', data: { entity_id: entityId, new_state: entity, old_state: previous } },
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
      if (message.type === 'get_states') result = Object.values(entities);
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
      if (request.url() === `${url}/auth/token`) {
        const authorization = request.postData().includes('authorization_code');
        if (authorization) authorizationExchanges++; else refreshExchanges++;
        const invalid = authorization && authorizationExchanges > 1;
        return request.respond({ status: invalid ? 400 : 200, contentType: 'application/json',
          headers: { 'Access-Control-Allow-Origin': 'http://localhost:5173' },
          body: JSON.stringify(invalid ? { error: 'invalid_grant' } : {
            access_token: 'integration-test', ...(authorization ? { refresh_token: 'integration-refresh' } : {}), expires_in: 3600,
          }),
        });
      }
      if (new URL(request.url()).pathname === '/src/main.tsx') return request.respond({ contentType: 'application/javascript', body: '' });
      if (request.url().startsWith('https://gc.zgo.at/')) return request.respond({ contentType: 'application/javascript', body: '' });
      return request.continue();
    });
    const state = Buffer.from(JSON.stringify({ hassUrl: url, clientId: 'http://localhost:5173/' })).toString('base64');
    await page.goto(`http://localhost:5173/?characterCount=0&auth_callback=1&code=one-use&state=${encodeURIComponent(state)}#studio`, { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => sessionStorage.setItem('room3d.ha.enabled', '1'));
    await page.evaluate(async () => { window.haTest = await import('/tests/fixtures/home-assistant-entry.tsx'); });
    await page.waitForFunction(() => window.haTest.useHomeAssistant.getState().status === 'connected');
    const returnedUrl = new URL(page.url());
    for (const name of ['auth_callback', 'code', 'state']) assert.equal(returnedUrl.searchParams.has(name), false, `Consumed OAuth ${name} must be removed`);
    assert.equal(returnedUrl.searchParams.get('characterCount'), '0');
    assert.equal(returnedUrl.hash, '#studio');
    await page.evaluate(() => {
      const tokens = JSON.parse(sessionStorage.getItem('room3d.ha.auth'));
      tokens.expires = 0;
      sessionStorage.setItem('room3d.ha.auth', JSON.stringify(tokens));
    });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.evaluate(async () => { window.haTest = await import('/tests/fixtures/home-assistant-entry.tsx'); });
    await page.waitForFunction(() => window.haTest.useHomeAssistant.getState().status === 'connected');
    assert.equal(authorizationExchanges, 1, 'Reload must not reuse the authorization code or ask for login');
    assert.equal(refreshExchanges, 1, 'An expired access token must refresh automatically');
    assert.equal(await page.evaluate(() => JSON.parse(sessionStorage.getItem('room3d.ha.auth')).refresh_token), 'integration-refresh');
    const staleCallback = new URL(page.url());
    staleCallback.searchParams.set('auth_callback', '1');
    staleCallback.searchParams.set('code', 'one-use');
    staleCallback.searchParams.set('state', state);
    await page.evaluate(url => history.replaceState(history.state, '', url), staleCallback.toString());
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.evaluate(async () => { window.haTest = await import('/tests/fixtures/home-assistant-entry.tsx'); });
    await page.waitForFunction(() => window.haTest.useHomeAssistant.getState().status === 'connected');
    assert.equal(authorizationExchanges, 1, 'A saved session must ignore an already-consumed callback');
    assert.equal(refreshExchanges, 1);
    assert.equal(new URL(page.url()).searchParams.has('auth_callback'), false);

    const read = key => page.evaluate(key => ({
      light: window.haTest.useHomeAssistant.getState().lights[key],
      on: window.haTest.useSceneStore.getState().furniture[key],
    }), key);
    const disabled = label => page.evaluate(label => [...document.querySelectorAll('button')].find(button => button.textContent.includes(label)).disabled, label);
    assert.equal(calls.length, 0, 'Initial synchronization must never send a command');
    assert.equal((await read('lampOn')).light.available, false);
    assert(await disabled('Lumière Séjour (OLA)'));
    assert.equal(await disabled('Lampe Couloir'), false, 'An unavailable OLA must not disable the corridor');
    publish('light.porte', 'off');
    await page.waitForFunction(() => window.haTest.useHomeAssistant.getState().lights.lampOn.available);
    for (const [index, light] of lights.entries()) {
      await page.evaluate(action => window.haTest.useSceneStore.getState().triggerAction(action, true), light.action);
      assert.equal(calls.length, index, 'NPC actions must not command any real light');
      assert.equal((await read(light.key)).on, false);
      await page.evaluate(label => [...document.querySelectorAll('button')].find(button => button.textContent.includes(label)).click(), light.button);
      await page.waitForFunction(key => !window.haTest.useHomeAssistant.getState().lights[key].pending, {}, light.key);
      assert.equal(calls.length, index + 1);
      assert.equal(calls[index].service, 'turn_on');
      assert.equal(calls[index].service_data.entity_id, light.entity);
      assert.equal((await read(light.key)).on, false, 'Acknowledgment must not optimistically change the scene');
      const rgb = [20 + index, 100, 240];
      publish(light.entity, 'on', { brightness: 128 + index, rgb_color: rgb });
      await page.waitForFunction(key => window.haTest.useSceneStore.getState().furniture[key], {}, light.key);
      assert.equal((await read(light.key)).light.brightness, (128 + index) / 255);
      assert.deepEqual((await read(light.key)).light.rgb, rgb);
      assert.equal(calls.length, index + 1, 'An HA update must not loop into a command');
    }
    publish('light.douche_douche', 'unavailable');
    await page.waitForFunction(() => !window.haTest.useHomeAssistant.getState().lights.lampBath.available);
    assert.equal((await read('lampBath')).on, true, 'Unavailable must preserve the last state');
    assert(await disabled('Lampe SDB'));
    assert.equal(await disabled('Lampe Couloir'), false);
    await page.evaluate(() => window.haTest.useSceneStore.getState().triggerAction('lamp-toggle', false, 'user'));
    await page.waitForFunction(() => !window.haTest.useHomeAssistant.getState().lights.lampOn.pending);
    assert.equal(calls.length, 5);
    assert.equal(calls[4].service, 'turn_off');
    assert.equal(calls[4].service_data.entity_id, 'light.porte');
    publish('light.porte', 'off');
    await page.waitForFunction(() => !window.haTest.useSceneStore.getState().furniture.lampOn);
    await page.evaluate(() => {
      const store = window.haTest.useSceneStore.getState();
      store.toggleLayer('lightsHD');
      store.triggerAction('lightsHD', true, 'user');
    });
    assert.equal((await read('lampOn')).on, false, 'Graphics controls must not overwrite the real OLA state');
    assert.equal(calls.length, 5);
    accepting = false;
    for (const ws of server.clients) ws.terminate();
    await page.waitForFunction(() => window.haTest.useHomeAssistant.getState().status === 'reconnecting');
    for (const light of lights) await page.evaluate(key => window.haTest.useSceneStore.getState().toggleFurniture(key), light.key);
    assert.equal(calls.length, 5, 'Offline commands must not be queued');
    for (const entity of Object.values(entities)) { entity.state = 'off'; entity.attributes = {}; }
    accepting = true;
    await page.waitForFunction(() => window.haTest.useHomeAssistant.getState().status === 'connected', { timeout: 30000 });
    for (const light of lights) assert.equal((await read(light.key)).on, false, 'Reconnect must refresh every light');
    assert.equal(calls.length, 5, 'Reconnect must not replay commands');
    await page.evaluate(() => [...document.querySelectorAll('button')].find(button => button.textContent.includes('Déconnecter Home Assistant')).click());
    await page.waitForFunction(() => !window.haTest.useHomeAssistant.getState().enabled);
    assert.equal(await page.evaluate(() => sessionStorage.getItem('room3d.ha.auth')), null);
    for (const light of lights) {
      await page.evaluate(key => window.haTest.useSceneStore.getState().toggleFurniture(key), light.key);
      assert.equal((await read(light.key)).on, true, 'Simulation must work after disconnect');
    }
    assert.equal(calls.length, 5);
    await page.evaluate(() => window.haTest.unmount());
    assert.deepEqual(errors, []);
    console.log('PASS: OAuth callback cleanup, reload with token refresh, four lights, independent availability, state/color sync, user/NPC separation, graphics isolation, reconnect without replay and simulation');
  } finally {
    if (browser) await browser.close();
    for (const ws of server.clients) ws.terminate();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
