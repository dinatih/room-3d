import { useEffect, useState } from 'react';
import { sceneModelPath } from '../scene/sceneModelPaths';

type FileStats = { fileBytes: number; triangles: number; primitives: number; animations: number; animationBytes: number } | { error: string };
let request: Promise<Record<string, FileStats>> | undefined;
const formatSize = (bytes: number) => bytes >= 1024 ** 2 ? `${(bytes / 1024 ** 2).toFixed(2)} Mio` : `${(bytes / 1024).toFixed(1)} Kio`;

/** File metadata includes hidden geometry and all clips, unlike live preview counters. */
export function ModelFileStats({ path }: { path: string }) {
  const [state, setState] = useState<{ files?: Record<string, FileStats>; error?: string }>({});
  useEffect(() => {
    let active = true;
    request ??= fetch('/model-file-stats.json').then(response => {
      if (!response.ok) throw new Error(`Statistiques GLB : HTTP ${response.status}`);
      return response.json();
    });
    void request.then(files => { if (active) setState({ files }); }, error => { if (active) setState({ error: String(error) }); });
    return () => { active = false; };
  }, []);
  const original = '/' + path.replace(/^\/+/, '');
  const scene = sceneModelPath(original);
  if (state.error) return <div className="text-danger small">{state.error}</div>;
  if (!state.files) return <div className="text-muted small">Lecture des statistiques…</div>;
  return <div className="small mt-1">
    {(scene === original ? [['Aperçu et scène — fichier unique', original]] : [['Aperçu / original', original], ['Scène — variante allégée', scene]]).map(([label, url]) => {
      const stats = state.files![url];
      return <div key={url} className="border-top pt-1 mt-1">
        <div className="fw-semibold">{label}</div>
        <a href={url} target="_blank" rel="noreferrer" className="text-break">{url.split('/').pop()}</a>
        {!stats || 'error' in stats ? <div className="text-danger">{stats && 'error' in stats ? stats.error : 'Statistiques absentes : régénérer le catalogue des fichiers.'}</div> : <>
          <div>Fichier : {formatSize(stats.fileBytes)}</div>
          <div>{stats.triangles.toLocaleString('fr-FR')} triangles · {stats.primitives} primitives</div>
          <div>{stats.animations} animations · données : {formatSize(stats.animationBytes)}</div>
        </>}
      </div>;
    })}
    <div className="text-muted mt-1">Poids sur disque, pas la mémoire RSS. Géométrie complète du fichier, y compris les parties masquées.</div>
  </div>;
}
