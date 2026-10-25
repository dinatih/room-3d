/** Development journal, independent of console visibility and rendering frames. */
export const DEV_LOG_ENABLED = Boolean(import.meta.hot);
type DevEntry = { tag: string; category?: string; action?: string; message?: string; data?: unknown };
const host = window as Window & { __roomDevLog?: { session: string; pageStartedAt: string; sequence: number } };
const firstLoad = DEV_LOG_ENABLED && !host.__roomDevLog;
const session = DEV_LOG_ENABLED ? host.__roomDevLog ??= {
  session: crypto.randomUUID(), pageStartedAt: new Date(performance.timeOrigin).toISOString(), sequence: 0,
} : undefined;

export function devLog(entry: DevEntry): void {
  if (!session) return;
  const started = performance.now();
  const ancestors: object[] = [], normalized = new WeakMap<object, object>();
  const serializable = JSON.parse(JSON.stringify(entry, function (_key, value) {
    if (typeof value === 'bigint') return value.toString();
    if (value instanceof Error || value instanceof Map || value instanceof Set) {
      let replacement = normalized.get(value);
      if (!replacement) {
        replacement = value instanceof Error
          ? { ...value, name: value.name, message: value.message, stack: value.stack, cause: (value as Error & { cause?: unknown }).cause }
          : [...value];
        normalized.set(value, replacement);
      }
      value = replacement;
    }
    if (value && typeof value === 'object') {
      while (ancestors.length && ancestors[ancestors.length - 1] !== this) ancestors.pop();
      if (ancestors.includes(value)) return '[Circular]';
      ancestors.push(value);
    }
    return value;
  }));
  import.meta.hot!.send('room:app-log', {
    session: session.session, pageStartedAt: session.pageStartedAt, sequence: ++session.sequence,
    elapsedMs: performance.now(), url: location.href, userAgent: navigator.userAgent,
    serializationMs: performance.now() - started,
    entry: { timestamp: Date.now(), ...serializable },
  });
}

if (firstLoad) {
  import.meta.hot!.on('vite:afterUpdate', updates => devLog({ tag: 'system', action: 'hmr_update', data: updates }));
  devLog({ tag: 'system', category: 'system', action: 'page_load', data: {
    timeOrigin: performance.timeOrigin, viewport: [innerWidth, innerHeight, devicePixelRatio],
    hardwareConcurrency: navigator.hardwareConcurrency, navigation: performance.getEntriesByType('navigation'),
  } });
  window.addEventListener('error', event => devLog({ tag: 'error', action: 'browser_error', data: {
    error: event.error, message: event.message, file: event.filename, line: event.lineno, column: event.colno,
  } }));
  window.addEventListener('unhandledrejection', event => devLog({ tag: 'error', action: 'unhandled_rejection', data: event.reason }));
  for (const level of ['warn', 'error'] as const) {
    const original = console[level].bind(console);
    console[level] = (...args: unknown[]) => { devLog({ tag: 'error', action: `console_${level}`, data: args }); original(...args); };
  }
  document.addEventListener('visibilitychange', () => devLog({ tag: 'system', action: 'page_visibility', data: document.visibilityState }));
  window.addEventListener('pagehide', () => devLog({ tag: 'system', action: 'page_hide' }));
  setInterval(() => devLog({ tag: 'system', action: 'page_heartbeat', data: { visibility: document.visibilityState } }), 1000);
}
