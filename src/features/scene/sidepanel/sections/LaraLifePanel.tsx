import { favoriteLifeActivity, getLifeMood, lifeClock, LIFE_LABELS, LIFE_NEED_LABELS, type LifeNeeds } from '../../ai/laraLife';
import { LIFE_SPEEDS, useLaraLifeStore } from '../../ai/laraLifeStore';

const NEED_LABELS: Record<keyof LifeNeeds, string> = { rest: 'Repos', work: 'Stimulation', walk: 'Bouger', meal: 'Faim', hygiene: 'Hygiène', toilet: 'Toilettes' };

export function LaraLifePanel() {
  const { needs, memory, elapsedSeconds, activity, reason, speed } = useLaraLifeStore();
  const mood = getLifeMood(needs);
  const clock = lifeClock(elapsedSeconds);
  const favorite = favoriteLifeActivity(memory);
  const tastes = favorite ? `Loisir favori : ${LIFE_LABELS[favorite]}` : 'Goûts encore à découvrir';
  return <section className="p-2 border-bottom small lh-sm" aria-label="Vie de Lara Native">
    <div className="d-flex align-items-center justify-content-between gap-2 mb-1">
      <span className="fw-semibold" title={`Jour ${clock.day} · ${clock.period}`}>Lara · {clock.time}</span>
      <span className="text-primary" title={tastes} aria-label={tastes}><i className="bi bi-heart-fill" aria-hidden="true" /></span>
      <button type="button" className="btn btn-sm btn-outline-secondary py-0 text-nowrap" aria-label="Vitesse de la vie de Lara"
        title="Accélérer la vie de Lara : ×1, ×3, ×10"
        onClick={() => useLaraLifeStore.setState({ speed: LIFE_SPEEDS[(LIFE_SPEEDS.indexOf(speed) + 1) % LIFE_SPEEDS.length] })}>
        <i className="bi bi-fast-forward-fill me-1" aria-hidden="true" />×{speed}
      </button>
    </div>
    {(Object.keys(needs) as (keyof LifeNeeds)[]).map(key => <label key={key} className="row align-items-center gx-2 mb-0">
      <span className="col-4" title={LIFE_NEED_LABELS[key]}>{NEED_LABELS[key]}</span>
      <span className="col-6"><progress className="d-block w-100" max={100} value={needs[key]} aria-label={LIFE_NEED_LABELS[key]} /></span>
      <span className="col-2 text-end text-nowrap">{Math.round(needs[key])}%</span>
    </label>)}
    <div className="d-flex align-items-center gap-2 mt-1">
      <span className={`badge ${mood.uncomfortable ? 'text-bg-warning' : 'text-bg-success'}`} title={mood.cause} aria-label={`Humeur : ${mood.label}. ${mood.cause}`}>{mood.label}</span>
      <span className="fw-semibold text-truncate" title={`${activity} — ${reason}`} data-lara-life-activity>{activity}</span>
    </div>
    <div className="visually-hidden">{reason}</div>
  </section>;
}
