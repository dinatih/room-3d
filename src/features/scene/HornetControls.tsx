import { useEffect, useState } from 'react';
import { cameraState } from './cameraState';
import { useDroneControlStore } from './droneControls';
import { getActionLabel } from './objectActionRegistry';
import './HornetControls.css';

export function HornetControls({ hidden = false }: { hidden?: boolean }) {
  const { available, piloting, speed, pitch, setPiloting, setSpeed } = useDroneControlStore();
  const [target, setTarget] = useState(cameraState.animalTarget);
  const [open, setOpen] = useState(target === 'drone');
  useEffect(() => {
    const update = () => {
      setTarget(cameraState.animalTarget);
      if (cameraState.animalTarget === 'drone') setOpen(true);
    };
    document.addEventListener('animal-camera-mode', update);
    return () => document.removeEventListener('animal-camera-mode', update);
  }, []);
  if (hidden) return null;
  const command = (key: string) => document.dispatchEvent(new CustomEvent('furniture-toggle', { detail: { key, userInitiated: true } }));
  const degrees = Math.round(pitch * 180 / Math.PI * 10) / 10;
  const viewing = target === 'drone';
  return (
    <section className="hornet-controls position-fixed top-0 start-50 translate-middle-x mt-2 card shadow-sm p-2 gap-2 text-dark" aria-label="Commandes du Hornet">
      <button type="button" className="btn btn-sm btn-light d-flex align-items-center justify-content-between gap-3" title="Afficher les commandes du Hornet" aria-expanded={open} onClick={() => setOpen(value => !value)}>
        <strong>🛸 Hornet</strong><i className={`bi bi-chevron-${open ? 'up' : 'down'}`} aria-hidden="true" />
      </button>
      {open && <>
        <div className="d-flex flex-wrap align-items-center gap-1">
          <button type="button" className={`btn btn-sm ${viewing ? 'btn-primary' : 'btn-outline-secondary'}`} disabled={!available || cameraState.isXR} aria-pressed={viewing} onClick={() => command('animal-drone-fpv')} title="Observer la scène depuis la caméra du Hornet">{getActionLabel('animal-drone-fpv')}</button>
          <button type="button" className={`btn btn-sm ${piloting ? 'btn-success' : 'btn-outline-secondary'}`} disabled={!available || cameraState.isXR} aria-pressed={piloting} onClick={() => piloting ? setPiloting(false) : command('drone-pilot')} title={getActionLabel('drone-pilot')}>Piloter</button>
          {viewing && <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => document.dispatchEvent(new CustomEvent('camera-mode', { detail: 'orbit' }))} title="Quitter la vue embarquée">Quitter</button>}
        </div>
        {viewing && <>
          <div className="d-flex align-items-center gap-2 border rounded p-2">
            <svg width="80" height="56" viewBox="-40 -28 80 56" aria-hidden="true">
              <path d="M-36 0H36" fill="none" stroke="currentColor" strokeDasharray="3 3" opacity="0.4" />
              <path d="M-30 0H30l-7 -5m7 5l-7 5" fill="none" stroke="var(--bs-primary)" strokeWidth="3" transform={`rotate(${-degrees})`} />
              <circle r="3" fill="currentColor" />
            </svg>
            <div className="small">
              <div>Inclinaison <output aria-label="Inclinaison du Hornet" className="fw-bold font-monospace">{degrees > 0 ? '+' : ''}{degrees.toFixed(1)}°</output></div>
              <div className="text-muted">{degrees === 0 ? 'Parallèle au sol' : degrees > 0 ? 'Avancer fait monter' : 'Avancer fait descendre'}</div>
            </div>
            <button type="button" className="btn btn-sm btn-outline-primary ms-auto" title={getActionLabel('drone-level')} onClick={() => command('drone-level')}>0°</button>
          </div>
          <label className="d-flex align-items-center gap-2 small">Vitesse
            <select className="form-select form-select-sm w-auto" value={speed} onChange={event => setSpeed(Number(event.target.value))}>
              <option value={40}>Précise · 0,4 m/s</option><option value={160}>Normale · 1,6 m/s</option><option value={480}>Rapide · 4,8 m/s</option>
            </select>
          </label>
          <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => command('drone-patrol-all')}>Reprendre la patrouille</button>
          <details className="small"><summary>Commandes clavier et souris</summary>ZQSD / WASD / flèches : déplacer · Alt + flèches / glisser : regarder · Espace ↑ · C ↓ · Maj + déplacement : vitesse ×3 · Échap : quitter</details>
        </>}
      </>}
    </section>
  );
}
