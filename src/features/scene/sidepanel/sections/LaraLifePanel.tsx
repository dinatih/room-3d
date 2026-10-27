import { LIFE_NEED_LABELS, type LifeNeeds } from '../../ai/laraLife';
import { useLaraLifeStore } from '../../ai/laraLifeStore';

export function LaraLifePanel() {
  const { needs, activity, reason } = useLaraLifeStore();
  return <section className="p-2 border-bottom small" aria-label="Vie de Lara Native">
    <div className="fw-semibold mb-1">Vie de Lara Native</div>
    {(Object.keys(needs) as (keyof LifeNeeds)[]).map(key => <label key={key} className="d-flex align-items-center gap-2 mb-1">
      <span className="flex-grow-1">{LIFE_NEED_LABELS[key]}</span>
      <progress max={100} value={needs[key]} aria-label={LIFE_NEED_LABELS[key]} />
      <span>{Math.round(needs[key])}%</span>
    </label>)}
    <div className="fw-semibold" data-lara-life-activity>{activity}</div>
    <div className="text-muted">{reason}</div>
  </section>;
}
