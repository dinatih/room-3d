const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { load } = require('../support/load-ts.cjs');

const CONNECTION_PATH = path.resolve(__dirname, '../../src/features/home-assistant/connection.ts');
const AIR_PERFORMER_PATH = path.resolve(__dirname, '../../src/features/home-assistant/airPerformer.ts');
const APPLIANCES_PATH = path.resolve(__dirname, '../../src/features/home-assistant/appliances.ts');
const NAME_COMPARISON_PATH = path.resolve(__dirname, '../../src/features/home-assistant/nameComparison.ts');

function createStorage() {
  const store = new Map();
  return {
    getItem: key => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: key => store.delete(key),
    clear: () => store.clear(),
  };
}

function createFakeStore(initializer) {
  let state;
  const listeners = new Set();
  const setState = partial => {
    const patch = typeof partial === 'function' ? partial(state) : partial;
    state = { ...state, ...patch };
    for (const listener of listeners) listener(state);
  };
  const getState = () => state;
  state = initializer(setState, getState);
  const hook = selector => (selector ? selector(state) : state);
  hook.getState = getState;
  hook.setState = setState;
  hook.subscribe = listener => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };
  return hook;
}

function setupBrowserEnv({ href = 'https://dinatih.org/?ha=1', topSame = true, opener = null } = {}) {
  const listeners = new Map();
  const storage = createStorage();
  let currentHref = href;
  const mockWindow = {
    location: null,
    self: null,
    top: topSame ? null : {},
    opener,
    history: {
      state: null,
      replaceState: (_state, _title, nextUrl) => {
        currentHref = typeof nextUrl === 'string' ? nextUrl : nextUrl.toString();
        mockWindow.location = new URL(currentHref);
      },
    },
    closed: false,
    close: () => { mockWindow.closed = true; },
    addEventListener: (type, fn) => {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type).add(fn);
    },
    removeEventListener: (type, fn) => {
      listeners.get(type)?.delete(fn);
    },
    dispatchEvent: event => {
      for (const fn of listeners.get(event.type) ?? []) fn(event);
    },
    setInterval: globalThis.setInterval.bind(globalThis),
    clearInterval: globalThis.clearInterval.bind(globalThis),
    open: () => null,
    crypto: globalThis.crypto,
  };
  mockWindow.self = mockWindow;
  if (topSame) mockWindow.top = mockWindow;
  mockWindow.location = new URL(currentHref);

  globalThis.window = mockWindow;
  globalThis.location = mockWindow.location;
  globalThis.sessionStorage = storage;
  return { mockWindow, storage };
}

async function loadConnectionModule(haOverrides = {}) {
  const ha = await import('home-assistant-js-websocket');
  const airPerformer = load(AIR_PERFORMER_PATH, {});
  const appliances = load(APPLIANCES_PATH, { './airPerformer': airPerformer });
  const nameComparison = load(NAME_COMPARISON_PATH, {});
  return load(
    CONNECTION_PATH,
    {
      zustand: { create: createFakeStore },
      './nameComparison': nameComparison,
      './appliances': appliances,
      'home-assistant-js-websocket': { ...ha, ...haOverrides },
    },
    source => source.replace(/if \(import\.meta\.hot\).*$/m, ''),
  );
}

test('completeHomeAssistantPopupCallback relays auth code to opener with exact origin and closes popup', async () => {
  const posted = [];
  const { mockWindow } = setupBrowserEnv({
    href: 'https://dinatih.org/?ha=1&auth_callback=1&code=abc123&state=xyz789',
    opener: { postMessage: (msg, targetOrigin) => posted.push({ msg, targetOrigin }) },
  });
  const { completeHomeAssistantPopupCallback } = await loadConnectionModule();
  assert.equal(completeHomeAssistantPopupCallback(), true);
  assert.deepEqual(posted, [{
    msg: { type: 'room3d:ha-oauth-callback', code: 'abc123', state: 'xyz789' },
    targetOrigin: 'https://dinatih.org',
  }]);
  assert.equal(mockWindow.closed, true);

  setupBrowserEnv({ href: 'https://dinatih.org/?ha=1' });
  assert.equal(completeHomeAssistantPopupCallback(), false);
});

test('resumeHomeAssistant clears stale enabled flag instead of erroring when no token or callback exists', async () => {
  const { storage } = setupBrowserEnv({ href: 'http://localhost:5173/' });
  storage.setItem('room3d.ha.enabled', '1');
  const { resumeHomeAssistant, useHomeAssistant } = await loadConnectionModule();

  resumeHomeAssistant();
  assert.equal(storage.getItem('room3d.ha.enabled'), null);
  assert.equal(useHomeAssistant.getState().enabled, false);
  assert.equal(useHomeAssistant.getState().status, 'disconnected');
});

test('embedded iframe connects via OAuth popup without navigating the iframe', async () => {
  const { mockWindow, storage } = setupBrowserEnv({
    href: 'https://dinatih.org/?ha=1&projection=ortho',
    topSame: false,
  });
  const ha = await import('home-assistant-js-websocket');
  let createdConnection = false;
  const connMod = await loadConnectionModule({
    getAuth: async opts => {
      const query = new URLSearchParams(mockWindow.location.search);
      assert.equal(query.get('auth_callback'), '1');
      assert.equal(query.get('code'), 'popup-code');
      const decodedState = JSON.parse(Buffer.from(query.get('state'), 'base64').toString('utf8'));
      const storedState = JSON.parse(storage.getItem(`hass_oauth_state_${decodedState.nonce}`));
      assert.equal(storedState.state, query.get('state'));
      assert.ok(storedState.codeVerifier);
      const data = {
        hassUrl: opts.hassUrl,
        clientId: 'https://dinatih.org/',
        access_token: 'tok',
        refresh_token: 'ref',
        expires_in: 1800,
        expires: Date.now() + 1800_000,
      };
      opts.saveTokens(data);
      return new ha.Auth(data, opts.saveTokens);
    },
    createConnection: async () => {
      createdConnection = true;
      return {
        connected: true,
        close: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        subscribeEvents: async () => () => {},
      };
    },
  });

  // Case 1: browser blocks popup -> immediate clear error
  mockWindow.open = () => null;
  await connMod.connectHomeAssistant('https://ha.dinatih.org');
  assert.equal(connMod.useHomeAssistant.getState().status, 'error');
  assert.match(connMod.useHomeAssistant.getState().error, /Autorise les popups/);
  connMod.disconnectHomeAssistant();

  // Case 2: popup opens, receives authorize URL, and posts back code/state to iframe
  let navigatedUrl = '';
  const popup = {
    closed: false,
    location: {
      set href(value) {
        navigatedUrl = value;
        const parsed = new URL(value);
        queueMicrotask(() => {
          mockWindow.dispatchEvent({
            type: 'message',
            origin: 'https://dinatih.org',
            source: popup,
            data: {
              type: 'room3d:ha-oauth-callback',
              code: 'popup-code',
              state: parsed.searchParams.get('state'),
            },
          });
        });
      },
      get href() { return navigatedUrl; },
    },
    close: () => { popup.closed = true; },
  };
  mockWindow.open = () => popup;
  const origFetch = globalThis.fetch;
  globalThis.fetch = async url => {
    if (String(url).endsWith('/.well-known/oauth-authorization-server')) {
      return { ok: true, json: async () => ({ code_challenge_methods_supported: ['S256'] }) };
    }
    throw new Error(`Unexpected fetch: ${url}`);
  };
  try {
    await connMod.connectHomeAssistant('https://ha.dinatih.org');
  } finally {
    globalThis.fetch = origFetch;
  }

  assert.equal(createdConnection, true);
  assert.match(navigatedUrl, /^https:\/\/ha\.dinatih\.org\/auth\/authorize\?/);
  const authUrl = new URL(navigatedUrl);
  assert.equal(authUrl.searchParams.get('client_id'), 'https://dinatih.org/');
  assert.equal(authUrl.searchParams.get('redirect_uri'), 'https://dinatih.org/?ha=1&projection=ortho&auth_callback=1');
  assert.equal(authUrl.searchParams.get('code_challenge_method'), 'S256');
  const saved = JSON.parse(storage.getItem('room3d.ha.auth'));
  assert.equal(saved.access_token, 'tok');
  assert.equal(saved.hassUrl, 'https://ha.dinatih.org');
  assert.equal(mockWindow.location.search, '?ha=1&projection=ortho');
  connMod.disconnectHomeAssistant();
});
