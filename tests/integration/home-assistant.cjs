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
  for (const [id, state, attributes] of [
    ['fan.living_room', 'off', { supported_features: 57, percentage: 20, percentage_step: 10, preset_modes: ['auto', 'sleep', 'turbo'], preset_mode: 'auto' }],
    ['select.living_room_function', 'heating', { options: ['fan', 'circulation', 'heating'] }],
    ['number.living_room', '0', { min: 0, max: 350, step: 5 }],
    ['number.living_room_temperature', '24', { min: 1, max: 37, step: 1 }],
    ['select.living_room_timer', 'Off', { options: ['Off', '30min', '1h'] }],
    ['select.living_room_preferred_index', 'pm25', { options: ['pm25', 'gas_level', 'indoor_allergen_index'] }],
    ['light.living_room_display_backlight', 'on', { brightness: 26 }],
    ['switch.living_room_auto_plus', 'on', {}],
    ['switch.living_room_beep', 'on', {}],
    ['switch.living_room_child_lock', 'off', {}],
    ['switch.living_room_standby_sensors', 'on', {}],
    ['cover.volet', 'open', { supported_features: 7, current_position: 50 }],
    ['media_player.tele', 'on', { supported_features: 384 }],
  ]) entities[id] = { entity_id: id, state, attributes };
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
      if (message.type === 'config/device_registry/list') result = [{ id: 'ola', name: 'Porte ', name_by_user: 'Lumière Séjour', identifiers: [['tuya', 'stable-device']], area_id: 'living', model: 'Smart Lighting' }];
      else if (message.type === 'config/entity_registry/list') result = [{ device_id: 'ola', platform: 'tuya', entity_id: 'light.porte', name: 'Lumière Séjour' }];
      else if (message.type === 'config/area_registry/list') result = [{ area_id: 'living', name: 'Séjour' }];
      else if (message.type === 'get_states') result = Object.values(entities);
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
    assert.equal(await page.evaluate(() => window.haTest.useSceneStore.getState().furniture.glassDoorV2ShutterPos), 50);
    assert.equal(await page.evaluate(() => window.haTest.useSceneStore.getState().furniture.tvOn), true);
    assert(await disabled('Arrêter volet'));
    publish('light.entree_entree', 'on', { friendly_name: 'Couloir renommé' });
    await page.waitForFunction(() => [...document.querySelectorAll('button')].some(button => button.textContent.includes('Couloir renommé')));
    await page.select('select[aria-label="Fonction du purificateur"]', 'circulation');
    await page.waitForFunction(() => !window.haTest.useHomeAssistant.getState().applianceCommands.airPerformerMode?.pending);
    assert.equal(calls.at(-1).domain, 'select');
    assert.equal(calls.at(-1).service, 'select_option');
    assert.deepEqual(calls.at(-1).service_data, { entity_id: 'select.living_room_function', option: 'circulation' });
    for (const [label, domain, service, data] of [
      ['Marche / arrêt purificateur', 'fan', 'turn_on', { entity_id: 'fan.living_room' }],
      ['Vitesse suivante', 'fan', 'set_percentage', { entity_id: 'fan.living_room', percentage: 30 }],
      ['Fermer volet', 'cover', 'set_cover_position', { entity_id: 'cover.volet', position: 0 }],
      ['Marche / arrêt télévision', 'media_player', 'turn_off', { entity_id: 'media_player.tele' }],
    ]) {
      const before = calls.length;
      await page.evaluate(label => [...document.querySelectorAll('button')].find(button => button.textContent.includes(label)).click(), label);
      await page.waitForFunction(() => !Object.values(window.haTest.useHomeAssistant.getState().applianceCommands).some(command => command.pending));
      assert.equal(calls.length, before + 1);
      assert.equal(calls.at(-1).domain, domain);
      assert.equal(calls.at(-1).service, service);
      assert.deepEqual(calls.at(-1).service_data, data);
    }
    assert.equal(await page.evaluate(() => window.haTest.useSceneStore.getState().furniture.glassDoorV2ShutterPos), 50, 'Cover waits for HA confirmation');
    publish('cover.volet', 'open', { supported_features: 7, current_position: 25 });
    await page.waitForFunction(() => window.haTest.useSceneStore.getState().furniture.glassDoorV2ShutterPos === 75);
    for (const [key, value, domain, service, data] of [
      ['airPerformerOscillation', 270, 'number', 'set_value', { entity_id: 'number.living_room', value: 270 }],
      ['airPerformerTemperature', 26, 'number', 'set_value', { entity_id: 'number.living_room_temperature', value: 26 }],
      ['airPerformerPreset', 'sleep', 'fan', 'set_preset_mode', { entity_id: 'fan.living_room', preset_mode: 'sleep' }],
      ['airPerformerTimer', '30min', 'select', 'select_option', { entity_id: 'select.living_room_timer', option: '30min' }],
      ['airPerformerIndex', 'gas_level', 'select', 'select_option', { entity_id: 'select.living_room_preferred_index', option: 'gas_level' }],
      ['airPerformerDisplay', 50, 'light', 'turn_on', { entity_id: 'light.living_room_display_backlight', brightness_pct: 50 }],
      ['airPerformerChildLock', true, 'switch', 'turn_on', { entity_id: 'switch.living_room_child_lock' }],
      ['airPerformerAutoPlus', false, 'switch', 'turn_off', { entity_id: 'switch.living_room_auto_plus' }],
      ['airPerformerBeep', false, 'switch', 'turn_off', { entity_id: 'switch.living_room_beep' }],
      ['airPerformerStandbySensors', false, 'switch', 'turn_off', { entity_id: 'switch.living_room_standby_sensors' }],
    ]) {
      const before = calls.length;
      await page.evaluate(([key, value]) => window.haTest.useSceneStore.getState().triggerAction(key, value, 'user'), [key, value]);
      await page.waitForFunction(key => !window.haTest.useHomeAssistant.getState().applianceCommands[key]?.pending, {}, key);
      assert.equal(calls.length, before + 1, key);
      assert.equal(calls.at(-1).domain, domain);
      assert.equal(calls.at(-1).service, service);
      assert.deepEqual(calls.at(-1).service_data, data);
    }
    publish('number.living_room', '270', { min: 0, max: 350, step: 5 });
    await page.waitForFunction(() => document.querySelector('input[aria-label="Oscillation"]').value === '270');
    const expectedCalls = calls.length;
    for (const key of ['airPerformerPower', 'airPerformerMode', 'airPerformerSpeed', 'airPerformerOscillation', 'airPerformerTemperature', 'airPerformerPreset', 'airPerformerTimer', 'airPerformerDisplay', 'airPerformerChildLock', 'tv-toggle', 'glassDoorV2ShutterPos']) {
      await page.evaluate(key => window.haTest.useSceneStore.getState().triggerAction(key), key);
    }
    assert.equal(calls.length, expectedCalls, 'NPC actions must never command real appliances');
    const toggleLink = async () => {
      const wasLinked = await page.evaluate(() => window.haTest.useHomeAssistant.getState().linked);
      await page.evaluate(() => document.querySelector('input[role="switch"]').click());
      await page.waitForFunction(previous => window.haTest.useHomeAssistant.getState().linked !== previous, {}, wasLinked);
    };
    await toggleLink();
    await page.evaluate(() => [...document.querySelectorAll('summary')].find(summary => summary.textContent.includes('Comparer les noms')).click());
    await page.waitForFunction(() => [...document.querySelectorAll('td')].some(cell => cell.textContent.includes('Porte ')));
    assert(await page.evaluate(() => [...document.querySelectorAll('td')].some(cell => cell.textContent.includes('Lumière Séjour'))));
    assert.equal(calls.length, expectedCalls, 'Name comparison is read-only and works while unlinked');
    assert.equal(await page.evaluate(() => window.haTest.useHomeAssistant.getState().status), 'connected');
    assert(await page.evaluate(() => !!sessionStorage.getItem('room3d.ha.auth')));
    assert.equal((await read('lampCorridor')).on, true, 'Real corridor is initially on');
    await page.evaluate(() => {
      const store = window.haTest.useSceneStore.getState();
      store.toggleFurniture('lampCorridor');
      store.triggerAction('tv-toggle', false, 'user');
      store.toggleFurniture('glassDoorV2ShutterPos');
      store.triggerAction('airPerformerPower', undefined, 'user');
    });
    const localPurifier = await page.evaluate(() => {
      const { getSceneActionValue } = window.haTest;
      const store = window.haTest.useSceneStore.getState();
      store.triggerAction('airPerformerOscillation', undefined, 'user');
      store.triggerAction('airPerformerAutoPlus', undefined, 'user');
      store.triggerAction('airPerformerMode', undefined, 'user');
      store.triggerAction('airPerformerSpeed', 7, 'user');
      return ['airPerformerPower', 'airPerformerOscillation', 'airPerformerAutoPlus', 'airPerformerMode', 'airPerformerSpeed'].map(id => getSceneActionValue(id));
    });
    assert.deepEqual(localPurifier, [true, 45, false, 'circulation', 7], 'Unlinked simulation uses the same action defaults and explicit values');
    assert.equal((await read('lampCorridor')).on, false, 'Paused lights must simulate locally');
    const localCover = await page.evaluate(() => window.haTest.useSceneStore.getState().furniture.glassDoorV2ShutterPos);
    publish('light.entree_entree', 'on');
    publish('cover.volet', 'closed', { supported_features: 7, current_position: 0 });
    await page.waitForFunction(() => window.haTest.useHomeAssistant.getState().entities['cover.volet'].attributes.current_position === 0);
    assert.equal((await read('lampCorridor')).on, false, 'HA events must not overwrite the paused simulation');
    assert.equal(await page.evaluate(() => window.haTest.useSceneStore.getState().furniture.glassDoorV2ShutterPos), localCover);
    await page.evaluate(async () => {
      const api = await import('/src/features/home-assistant/connection.ts');
      await api.setHomeAssistantLight('lampCorridor', true);
      await api.requestHomeAssistantAction('tvOn', true);
    });
    assert.equal(calls.length, expectedCalls, 'All service entry points must block commands while paused');
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.evaluate(async () => { window.haTest = await import('/tests/fixtures/home-assistant-entry.tsx'); });
    await page.waitForFunction(() => window.haTest.useHomeAssistant.getState().status === 'connected');
    assert.equal(await page.evaluate(() => window.haTest.useHomeAssistant.getState().linked), false, 'Pause survives reload');
    assert.equal(authorizationExchanges, 1, 'Pause and reload retain OAuth authorization');
    assert.equal(refreshExchanges, 1);
    assert.equal(calls.length, expectedCalls);
    await toggleLink();
    await page.waitForFunction(() => window.haTest.useSceneStore.getState().furniture.glassDoorV2ShutterPos === 100);
    assert.equal((await read('lampCorridor')).on, true, 'Resume immediately uses the latest HA state');
    assert.equal(calls.length, expectedCalls, 'Resume must not replay simulated actions');
    accepting = false;
    for (const ws of server.clients) ws.terminate();
    await page.waitForFunction(() => window.haTest.useHomeAssistant.getState().status === 'reconnecting');
    for (const light of lights) await page.evaluate(key => window.haTest.useSceneStore.getState().toggleFurniture(key), light.key);
    assert.equal(calls.length, expectedCalls, 'Offline commands must not be queued');
    for (const light of lights) { entities[light.entity].state = 'off'; entities[light.entity].attributes = {}; }
    accepting = true;
    await page.waitForFunction(() => window.haTest.useHomeAssistant.getState().status === 'connected', { timeout: 30000 });
    for (const light of lights) assert.equal((await read(light.key)).on, false, 'Reconnect must refresh every light');
    assert.equal(calls.length, expectedCalls, 'Reconnect must not replay commands');
    await page.evaluate(() => [...document.querySelectorAll('button')].find(button => button.textContent.includes('Déconnecter Home Assistant')).click());
    await page.waitForFunction(() => !window.haTest.useHomeAssistant.getState().enabled);
    assert.equal(await page.evaluate(() => sessionStorage.getItem('room3d.ha.auth')), null);
    for (const light of lights) {
      await page.evaluate(key => window.haTest.useSceneStore.getState().toggleFurniture(key), light.key);
      assert.equal((await read(light.key)).on, true, 'Simulation must work after disconnect');
    }
    assert.equal(calls.length, expectedCalls);
    await page.evaluate(() => window.haTest.unmount());
    assert.deepEqual(errors, []);
    console.log('PASS: OAuth reload, four lights, HA names, purifier, shutter position, TV, pause/resume and reload without logout, user/NPC separation, reconnect without replay and simulation');
  } finally {
    if (browser) await browser.close();
    for (const ws of server.clients) ws.terminate();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
