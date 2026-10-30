import { closestLifeFriend, favoriteLifeActivity, getLifeMood, isLifeCharacter, lifeClock, LIFE_CHARACTER_IDS, LIFE_CHARACTER_LABELS, LIFE_LABELS, LIFE_NEED_LABELS, type LifeNeeds } from '../../ai/laraLife';
import { findCharacter } from '../../characterConfig';
import { LIFE_SPEEDS, useLaraLifeStore } from '../../ai/laraLifeStore';

const NEED_LABELS: Record<keyof LifeNeeds, string> = { rest: 'Repos', work: 'Stimulation', walk: 'Bouger', meal: 'Faim', hygiene: 'Hygiène', toilet: 'Toilettes', company: 'Compagnie' };

export function LaraLifePanel() {
  const { characters, selectedCharacterId, speed } = useLaraLifeStore();
  const { needs, memory, relationships, elapsedSeconds, activity, reason } = characters[selectedCharacterId];
  const mood = getLifeMood(needs);
  const clock = lifeClock(elapsedSeconds);
  const favorite = favoriteLifeActivity(memory);
  const tastes = favorite ? `Loisir favori : ${LIFE_LABELS[favorite]}` : 'Goûts encore à découvrir';
  const friend = closestLifeFriend(relationships);
  const company = friend ? `Compagnie préférée : ${isLifeCharacter(friend) ? LIFE_CHARACTER_LABELS[friend] : findCharacter(friend)!.name}` : 'Aucune rencontre pour le moment';
  return <section className="p-2 border-bottom small lh-sm" aria-label={`Vie de ${selectedCharacterId === 'native' ? 'Lara Native' : 'Cha'}`}>
    <div className="d-flex align-items-center justify-content-between gap-2 mb-1">
      <div className="d-flex gap-1" role="tablist" aria-label="Personnage du panneau de vie"
        onKeyDown={event => {
          if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
          event.preventDefault();
          const id = event.key === 'Home' ? 'native' : event.key === 'End' ? 'cha' : selectedCharacterId === 'native' ? 'cha' : 'native';
          useLaraLifeStore.setState({ selectedCharacterId: id });
          document.getElementById(`life-tab-${id}`)!.focus();
        }}>
        {LIFE_CHARACTER_IDS.map(id => <button key={id} id={`life-tab-${id}`} type="button" role="tab"
          className={`btn btn-sm py-0 px-1 ${id === selectedCharacterId ? 'btn-primary active fw-semibold' : 'btn-outline-secondary'}`}
          aria-selected={id === selectedCharacterId} aria-controls="life-character-panel" tabIndex={id === selectedCharacterId ? 0 : -1}
          onClick={() => useLaraLifeStore.setState({ selectedCharacterId: id })}>{LIFE_CHARACTER_LABELS[id]}</button>)}
      </div>
      <span className="text-nowrap" title={`Jour ${clock.day} · ${clock.period}`}>{clock.time}</span>
      <span className="text-primary" title={tastes} aria-label={tastes}><i className="bi bi-heart-fill" aria-hidden="true" /></span>
      <span className="text-primary" title={company} aria-label={company}><i className="bi bi-people-fill" aria-hidden="true" /></span>
      <button type="button" className="btn btn-sm btn-outline-secondary py-0 text-nowrap" aria-label="Vitesse de la colocation"
        title="Accélérer la vie de Lara et Cha : ×1, ×3, ×10"
        onClick={() => useLaraLifeStore.setState({ speed: LIFE_SPEEDS[(LIFE_SPEEDS.indexOf(speed) + 1) % LIFE_SPEEDS.length] })}>
        <i className="bi bi-fast-forward-fill me-1" aria-hidden="true" />×{speed}
      </button>
    </div>
    <div id="life-character-panel" role="tabpanel" aria-labelledby={`life-tab-${selectedCharacterId}`}>
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
    </div>
  </section>;
}
