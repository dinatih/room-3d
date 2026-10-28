import { cameraState } from './cameraState';
import { useDroneControlStore } from './droneControls';
import { useSceneStore } from './store/useSceneStore';
import { selectAnimalCameraTarget } from './camera/cameraSubjects';
import { getActionLabel } from './objectActionRegistry';
import { TOOLBAR_BUTTON_CLASS } from './toolbarStyles';
import './HornetControls.css';

export function HornetMenuButton() {
  const open = useDroneControlStore(state => state.panelOpen);
  return <button type="button" className={`${TOOLBAR_BUTTON_CLASS} btn-outline-secondary d-flex align-items-center gap-2 text-start w-100`} title="Afficher les commandes du Hornet" aria-pressed={open} onClick={() => useDroneControlStore.setState({ panelOpen: !open })}>
    <i className="bi bi-controller" aria-hidden="true" /><span className="fw-semibold">Hornet</span>
  </button>;
}

export function HornetControls({ hidden = false }: { hidden?: boolean }) {
  const { available, piloting, speed, pitch, panelOpen, setPiloting, setSpeed } = useDroneControlStore();
  const target = useSceneStore(selectAnimalCameraTarget);
  if (hidden || !panelOpen) return null;
  const command = (key: string) => document.dispatchEvent(new CustomEvent('furniture-toggle', { detail: { key, userInitiated: true } }));
  const degrees = Math.round(pitch * 180 / Math.PI * 10) / 10;
  const viewing = target === 'drone';
  const button = 'btn btn-sm';
  return (
    <section className="hornet-controls position-fixed bottom-0 start-0 m-2 p-3 rounded-3 border shadow bg-body text-body d-flex flex-wrap align-items-center gap-2" aria-label="Commandes du Hornet">
      <strong className="w-100">Hornet <span className="small fw-normal text-body-secondary">· {piloting ? 'Pilotage manuel' : viewing ? 'Caméra embarquée' : 'Commandes'}</span></strong>
      <button type="button" className={`${button} ${viewing ? 'btn-outline-primary' : 'btn-outline-secondary'}`} disabled={!available || cameraState.isXR} aria-pressed={viewing} aria-label={getActionLabel('animal-drone-fpv')} onClick={() => command('animal-drone-fpv')} title="Observer la scène depuis la caméra du Hornet"><i className="bi bi-camera-video me-1" aria-hidden="true" />Vue embarquée</button>
      <button type="button" className={`${button} ${piloting ? 'btn-outline-success' : 'btn-outline-secondary'}`} disabled={!available || cameraState.isXR} aria-pressed={piloting} aria-label={getActionLabel('drone-pilot')} onClick={() => piloting ? setPiloting(false) : command('drone-pilot')} title={getActionLabel('drone-pilot')}><i className="bi bi-controller me-1" aria-hidden="true" />{piloting ? 'Arrêter le pilotage' : 'Piloter'}</button>
      {viewing && <>
        <button type="button" className={`${button} btn-outline-danger`} onClick={() => document.dispatchEvent(new CustomEvent('camera-mode', { detail: 'orbit' }))} title="Quitter la vue embarquée" aria-label="Quitter la vue embarquée"><i className="bi bi-box-arrow-right me-1" aria-hidden="true" />Quitter la vue</button>
        <svg width="32" height="24" viewBox="-40 -28 80 56" aria-hidden="true">
          <path d="M-36 0H36" fill="none" stroke="currentColor" strokeDasharray="3 3" opacity="0.4" />
          <path d="M-30 0H30l-7 -5m7 5l-7 5" fill="none" stroke="var(--bs-primary)" strokeWidth="3" transform={`rotate(${-degrees})`} />
          <circle r="3" fill="currentColor" />
        </svg>
        <output aria-label="Inclinaison du Hornet" className="small fw-bold font-monospace">Inclinaison : {degrees > 0 ? '+' : ''}{degrees.toFixed(1)}°</output>
        <button type="button" className={`${button} btn-outline-primary`} title={getActionLabel('drone-level')} onClick={() => command('drone-level')}>Remettre à plat</button>
        <select className="form-select form-select-sm w-auto" aria-label="Vitesse du Hornet" title="Vitesse du Hornet" value={speed} onChange={event => setSpeed(Number(event.target.value))}>
          <option value={40}>0,4 m/s</option><option value={160}>1,6 m/s</option><option value={480}>4,8 m/s</option>
        </select>
        <button type="button" className={`${button} btn-outline-secondary`} title={getActionLabel('drone-patrol-all')} aria-label={getActionLabel('drone-patrol-all')} onClick={() => command('drone-patrol-all')}><i className="bi bi-arrow-repeat me-1" aria-hidden="true" />Patrouille</button>
        <details className="small w-100"><summary className={`${button} btn-outline-secondary`} title="Commandes clavier et souris" aria-label="Commandes clavier et souris">Clavier et souris</summary>ZQSD / WASD / flèches : déplacer · Alt + flèches / glisser : regarder · Espace ↑ · C ↓ · Maj + déplacement : vitesse ×3 · Échap : quitter</details>
      </>}
      <button type="button" className={`${button} position-absolute top-0 end-0 m-1 border-0`} title="Masquer les commandes du Hornet" aria-label="Masquer les commandes du Hornet" onClick={() => useDroneControlStore.setState({ panelOpen: false })}><i className="bi bi-x" aria-hidden="true" /></button>
    </section>
  );
}
