const { it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { EventEmitter, once } = require('node:events');
const { load } = require('../support/load-ts.cjs');

it('conserve une session par document à travers HMR et sérialise erreurs, causes et références partagées', () => {
  const messages = [], callbacks = [];
  const fixture = { window: new EventTarget(), document: Object.assign(new EventTarget(), { visibilityState: 'visible' }),
    location: { href: 'http://localhost/log-test' }, navigator: { userAgent: 'test', hardwareConcurrency: 4 },
    performance: { timeOrigin: 1792886400000, now: () => 12, getEntriesByType: () => [] }, crypto: require('node:crypto'),
    innerWidth: 800, innerHeight: 600, devicePixelRatio: 1, console: { warn() {}, error() {} },
    setInterval: callback => callbacks.push(callback), hot: { on() {}, send: (event, payload) => { assert.equal(event, 'room:app-log'); messages.push(payload); } } };
  globalThis.__devLogFixture = fixture;
  const module = () => load('src/devLog.ts', {}, source =>
    'const { window, document, location, navigator, performance, crypto, innerWidth, innerHeight, devicePixelRatio, console, setInterval, hot } = globalThis.__devLogFixture;\n'
    + source.replaceAll('import.meta.hot', 'hot'));
  try {
    const first = module(), session = messages[0].session;
    const shared = { x: 1 }, error = new Error('funnel reproduction'); error.cause = { shared, self: error };
    first.devLog({ tag: 'error', action: 'test_error', data: { error, first: shared, second: shared, blockers: new Map([['sandra', shared]]) } });
    const data = messages.at(-1).entry.data;
    assert.equal(data.error.message, 'funnel reproduction'); assert.match(data.error.stack, /funnel reproduction/);
    assert.equal(data.error.cause.self, '[Circular]');
    assert.deepEqual(data.first, shared); assert.deepEqual(data.second, shared); assert.deepEqual(data.blockers, [['sandra', shared]]);
    module().devLog({ tag: 'system', action: 'after_hmr' });
    assert(messages.every(row => row.session === session));
    assert.equal(messages.filter(row => row.entry.action === 'page_load').length, 1);
    assert.equal(callbacks.length, 1); callbacks[0]();
    assert.equal(messages.at(-1).entry.action, 'page_heartbeat');
    fixture.window.dispatchEvent(Object.assign(new Event('error'), { error, message: error.message, filename: 'mesh.ts', lineno: 156, colno: 27 }));
    assert.equal(messages.at(-1).entry.action, 'browser_error');
    assert.equal(messages.at(-1).entry.data.error.cause.self, '[Circular]');
    fixture.console.error('native console', error);
    assert.equal(messages.at(-1).entry.action, 'console_error');
    assert.deepEqual(messages.map(row => row.sequence), messages.map((_, index) => index + 1));
    fixture.window = new EventTarget(); module();
    assert.notEqual(messages.at(-1).session, session);
  } finally { delete globalThis.__devLogFixture; }
});

it('écrit un fichier par chargement, conserve les événements tardifs et pointe latest vers la nouvelle page', async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'room-log-test-')), streams = [], httpServer = new EventEmitter(), errors = [];
  const { devLogPlugin } = load('scripts/dev-log-plugin.ts', {
    'node:fs': { ...fs, createWriteStream: (...args) => { const stream = fs.createWriteStream(...args); streams.push(stream); return stream; } },
    'node:path': { default: path }, 'node:child_process': { execFileSync: (_, args) => args[0] === 'rev-parse' ? 'test-commit' : '' },
  });
  let receive;
  devLogPlugin(directory).configureServer({ httpServer, config: { root: process.cwd(), logger: { info() {}, error: error => errors.push(error) } }, ws: { on: (name, handler) => { assert.equal(name, 'room:app-log'); receive = handler; } } });
  try {
    const send = (session, action, pageStartedAt = '2026-10-25T01:00:00.000Z') => receive({ session, pageStartedAt, entry: { tag: 'test', action } });
    send('first', 'page_load'); send('first', 'hmr_event'); send('second', 'page_load'); send('first', 'late_event');
    send('older-tab', 'page_heartbeat', '2026-10-24T01:00:00.000Z');
    receive({ session: '../invalid', entry: {} });
    const finished = streams.map(stream => once(stream, 'finish')); httpServer.emit('close'); await Promise.all(finished);
    const files = fs.readdirSync(directory).filter(file => file !== 'latest.jsonl');
    assert.equal(files.length, 3);
    const first = fs.readFileSync(path.join(directory, files.find(file => file.includes('_first'))), 'utf8').trim().split('\n').map(JSON.parse);
    assert.deepEqual(first.map(row => row.entry.action), ['server_session', 'page_load', 'hmr_event', 'late_event']);
    assert.match(fs.readlinkSync(path.join(directory, 'latest.jsonl')), /_second\.jsonl$/);
    assert.equal(errors.length, 1); assert.match(errors[0], /Invalid log session/);
    const { analyze } = require('../../scripts/analyze-navigation-logs.cjs');
    assert.equal((await analyze(path.join(directory, 'latest.jsonl'))).session, 'second');
  } finally { fs.rmSync(directory, { recursive: true, force: true }); }
});
