import { useState } from 'react';
import { loadTuyaNameComparison, useHomeAssistant } from './connection';

export function NameComparison() {
  const status = useHomeAssistant(state => state.status);
  const [rows, setRows] = useState<Awaited<ReturnType<typeof loadTuyaNameComparison>>>([]);
  const [checkedAt, setCheckedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [onlyDifferences, setOnlyDifferences] = useState(true);
  const refresh = async () => {
    setLoading(true); setError(null);
    try {
      setRows(await loadTuyaNameComparison());
      setCheckedAt(new Date().toLocaleString('fr-FR'));
    } catch (error) { setError(error instanceof Error ? error.message : 'Comparaison impossible.'); }
    finally { setLoading(false); }
  };
  return <details className="my-2" onToggle={event => {
    if (event.currentTarget.open && !checkedAt && !loading) void refresh();
  }}>
    <summary>Comparer les noms Smart Life / HA</summary>
    <p className="text-muted my-1">Nom Tuya : dernier nom reçu par HA, sans lecture directe de Smart Life. Après une modification dans Smart Life, attendre sa remontée dans HA. Aucune modification automatique.</p>
    <div className="d-flex flex-wrap align-items-center gap-2 my-2">
      <button className="btn btn-sm btn-outline-secondary" disabled={loading || status !== 'connected'} onClick={() => void refresh()}>Actualiser les noms</button>
      <label><input type="checkbox" checked={onlyDifferences} onChange={event => setOnlyDifferences(event.target.checked)} /> Écarts uniquement</label>
    </div>
    {loading && <div role="status">Lecture des noms…</div>}
    {error && <div role="alert" className="text-danger">{error}</div>}
    {checkedAt && <>
      <div>{rows.filter(row => row.different).length} écart(s) sur {rows.length} appareils / scènes · relevé du {checkedAt}{status !== 'connected' && ' · état périmé'}</div>
      <div className="table-responsive"><table className="table table-sm small">
        <thead><tr><th>Pièce / appareil</th><th>Nom Tuya reçu</th><th>Nom HA à reporter dans Smart Life</th></tr></thead>
        <tbody>{rows.filter(row => !onlyDifferences || row.different).map(row => <tr key={row.id}>
          <td>{row.area}<div className="text-muted">{row.model}</div><a href={`https://ha.dinatih.org/config/devices/device/${row.id}`} target="_blank" rel="noreferrer">Ouvrir dans HA</a></td>
          <td><pre className="mb-0 text-wrap">{row.tuyaName ?? 'Nom absent'}</pre></td>
          <td><pre className="mb-0 text-wrap">{row.haName ?? 'Nom absent'}</pre>
            {row.entities.map(entity => <div key={entity.entity_id} className="text-muted">Entité personnalisée : {entity.name} ({entity.entity_id})</div>)}
          </td>
        </tr>)}</tbody>
      </table></div>
      {onlyDifferences && !rows.some(row => row.different) && <div>Aucun écart dans le dernier relevé HA.</div>}
    </>}
  </details>;
}
