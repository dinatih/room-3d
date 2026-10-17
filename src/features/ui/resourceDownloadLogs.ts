import { appLog } from './AppConsole';

function formatBytes(bytes: number): string {
  if (bytes < 1000) return `${bytes} octets`;
  if (bytes < 1_000_000) return `${(bytes / 1000).toFixed(1)} Ko`;
  return `${(bytes / 1_000_000).toFixed(2)} Mo`;
}

// Resource Timing also covers loaders using their own Three.js LoadingManager.
// Observe existing entries too: module-level preloads can start before main runs.
const loggedUrls = new Set<string>();
const observer = new PerformanceObserver(list => {
  for (const entry of list.getEntries() as PerformanceResourceTiming[]) {
    const url = new URL(entry.name);
    if (!['http:', 'https:'].includes(url.protocol) || loggedUrls.has(url.href)) continue;
    loggedUrls.add(url.href);

    const name = url.origin === location.origin ? url.pathname + url.search : url.href;
    const size = entry.decodedBodySize > 0
      ? formatBytes(entry.decodedBodySize)
      : 'taille indisponible';
    const source = entry.transferSize > 0 ? 'réseau'
      : entry.decodedBodySize > 0 ? 'cache navigateur' : 'origine indisponible';
    const transferred = entry.transferSize > 0 ? ` · transféré : ${formatBytes(entry.transferSize)}` : '';
    appLog('download', `📥 Premier chargement : "${name}" · fichier : ${size}${transferred} · ${entry.duration.toFixed(0)} ms (${source})`);
  }
});

observer.observe({ type: 'resource', buffered: true });
if (import.meta.hot) import.meta.hot.dispose(() => observer.disconnect());
