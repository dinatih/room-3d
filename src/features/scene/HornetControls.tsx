import { useDroneControlStore } from './droneControls';
import { useSceneStore } from './store/useSceneStore';
import { selectAnimalCameraTarget } from './camera/cameraSubjects';
import { getActionLabel } from './objectActionRegistry';
import './HornetControls.css';

export function HornetControls({ hidden = false }: { hidden?: boolean }) {
  const { speed, pitch, panelOpen, setSpeed } = useDroneControlStore();
  const target = useSceneStore(selectAnimalCameraTarget);
  if (hidden || !panelOpen) return null;
  const command = (key: string) => document.dispatchEvent(new CustomEvent('furniture-toggle', { detail: { key, userInitiated: true } }));
  const degrees = Math.round(pitch * 180 / Math.PI * 10) / 10;
  const viewing = target === 'drone';
  const button = 'btn btn-sm py-0 px-1';
  return (
    <section className="hornet-controls position-fixed bottom-0 start-0 m-2 p-1 rounded-2 border shadow bg-body d-flex flex-wrap align-items-center justify-content-center gap-1 text-body" aria-label="Commandes du Hornet">
      <strong className="small">Hornet</strong>
      {viewing && <>
        <svg width="32" height="24" viewBox="-40 -28 80 56" aria-hidden="true">
          <path d="M-36 0H36" fill="none" stroke="currentColor" strokeDasharray="3 3" opacity="0.4" />
          <path d="M-30 0H30l-7 -5m7 5l-7 5" fill="none" stroke="var(--bs-primary)" strokeWidth="3" transform={`rotate(${-degrees})`} />
          <circle r="3" fill="currentColor" />
        </svg>
        <output aria-label="Inclinaison du Hornet" className="small fw-bold font-monospace">{degrees > 0 ? '+' : ''}{degrees.toFixed(1)}°</output>
        <button type="button" className={`${button} btn-outline-primary`} title={getActionLabel('drone-level')} onClick={() => command('drone-level')}>0°</button>
        <select className="form-select form-select-sm w-auto py-0 ps-1 pe-4" aria-label="Vitesse du Hornet" title="Vitesse du Hornet" value={speed} onChange={event => setSpeed(Number(event.target.value))}>
          <option value={40}>0,4 m/s</option><option value={160}>1,6 m/s</option><option value={480}>4,8 m/s</option>
        </select>
        <button type="button" className={`${button} btn-outline-secondary`} title={getActionLabel('drone-patrol-all')} aria-label={getActionLabel('drone-patrol-all')} onClick={() => command('drone-patrol-all')}><i className="bi bi-arrow-repeat" aria-hidden="true" /></button>
        <details className="small"><summary className={`${button} btn-outline-secondary`} title="Commandes clavier et souris" aria-label="Commandes clavier et souris">?</summary>ZQSD / WASD / flèches : déplacer · Alt + flèches / glisser : regarder · Espace ↑ · C ↓ · Maj + déplacement : vitesse ×3 · Échap : quitter</details>
      </>}
      <button type="button" className={`${button} border-0`} title="Masquer les commandes du Hornet" aria-label="Masquer les commandes du Hornet" onClick={() => useDroneControlStore.setState({ panelOpen: false })}><i className="bi bi-x" aria-hidden="true" /></button>
    </section>
  );
}
