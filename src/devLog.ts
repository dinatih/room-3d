/** Development journal, independent of console visibility and rendering frames. */
export const DEV_LOG_ENABLED = Boolean(import.meta.hot);
type DevEntry = { tag: string; category?: string; action?: string; message?: string; data?: unknown };
const host = window as Window & { __roomDevLog?: { session: string; pageStartedAt: string; sequence: number } };
const firstLoad = DEV_LOG_ENABLED && !host.__roomDevLog;
const session = DEV_LOG_ENABLED ? host.__roomDevLog ??= {
  session: crypto.randomUUID(), pageStartedAt: new Date(performance.timeOrigin).toISOString(), sequence: 0,
} : undefined;

function sanitizeForLog(
  value: unknown,
  ancestors: Set<object>,
  normalized: WeakMap<object, object>,
): unknown {
  if (value === null) return null;
  const type = typeof value;
  if (type === 'string' || type === 'number' || type === 'boolean') return value;
  if (type === 'bigint') return (value as bigint).toString();
  if (type !== 'object') return undefined;

  const obj = value as object;
  let target = normalized.get(obj);
  if (!target) {
    if (obj instanceof Error) {
      target = { ...obj, name: obj.name, message: obj.message, stack: obj.stack, cause: (obj as Error & { cause?: unknown }).cause };
      normalized.set(obj, target);
    } else if (obj instanceof Map || obj instanceof Set) {
      target = [...obj];
      normalized.set(obj, target);
    } else {
      target = obj;
    }
  }
  if (ancestors.has(target)) return '[Circular]';
  ancestors.add(target);
  try {
    if (Array.isArray(target)) {
      const out = new Array(target.length);
      for (let i = 0; i < target.length; i++) {
        const sanitized = sanitizeForLog(target[i], ancestors, normalized);
        out[i] = sanitized === undefined ? null : sanitized;
      }
      return out;
    }
    const maybeToJSON = target as { toJSON?: () => unknown };
    if (typeof maybeToJSON.toJSON === 'function') {
      const jsonVal = maybeToJSON.toJSON();
      if (jsonVal !== target) return sanitizeForLog(jsonVal, ancestors, normalized);
    }
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(target)) {
      const sanitized = sanitizeForLog(v, ancestors, normalized);
      if (sanitized !== undefined) out[k] = sanitized;
    }
    return out;
  } finally {
    ancestors.delete(target);
  }
}

export function devLog(entry: DevEntry): void {
  if (!session) return;
  const started = performance.now();
  const serializable = sanitizeForLog(entry, new Set<object>(), new WeakMap<object, object>()) as Record<string, unknown>;
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
