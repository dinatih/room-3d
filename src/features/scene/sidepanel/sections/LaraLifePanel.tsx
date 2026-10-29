import { LIFE_NEED_LABELS, type LifeNeeds } from '../../ai/laraLife';
import { LIFE_SPEEDS, useLaraLifeStore } from '../../ai/laraLifeStore';

export function LaraLifePanel() {
  const { needs, activity, reason, speed } = useLaraLifeStore();
  return <section className="p-2 border-bottom small" aria-label="Vie de Lara Native">
    <div className="d-flex align-items-center justify-content-between gap-2 mb-1">
      <span className="fw-semibold">Vie de Lara Native</span>
      <button type="button" className="btn btn-sm btn-outline-secondary py-0 text-nowrap" aria-label="Vitesse de la vie de Lara"
        title="Accélérer la vie de Lara : ×1, ×3, ×10"
        onClick={() => useLaraLifeStore.setState({ speed: LIFE_SPEEDS[(LIFE_SPEEDS.indexOf(speed) + 1) % LIFE_SPEEDS.length] })}>
        <i className="bi bi-fast-forward-fill me-1" aria-hidden="true" />×{speed}
      </button>
    </div>
    {(Object.keys(needs) as (keyof LifeNeeds)[]).map(key => <label key={key} className="row align-items-center gx-2 mb-1">
      <span className="col-5">{LIFE_NEED_LABELS[key]}</span>
      <span className="col-5"><progress className="d-block w-100" max={100} value={needs[key]} aria-label={LIFE_NEED_LABELS[key]} /></span>
      <span className="col-2 text-end text-nowrap">{Math.round(needs[key])}%</span>
    </label>)}
    <div className="fw-semibold" data-lara-life-activity>{activity}</div>
    <div className="text-muted">{reason}</div>
  </section>;
}
