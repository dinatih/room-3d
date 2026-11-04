import { closestLifeFriend, favoriteLifeActivity, getLifeMood, isLifeCharacter, lifeClock, LIFE_CHARACTER_IDS, LIFE_CHARACTER_LABELS, LIFE_LABELS, LIFE_NEED_LABELS, type LifeActivity, type LifeNeeds } from '../../ai/laraLife';
import { findCharacter } from '../../characterConfig';
import { LIFE_SPEEDS, useLaraLifeStore } from '../../ai/laraLifeStore';
import { HOME_ROOMS, HOME_TASKS, roomDirt, type HomeTask } from '../../ai/lifeHousekeeping';

const NEED_LABELS: Record<keyof LifeNeeds, string> = { rest: 'Repos', work: 'Stimulation', walk: 'Bouger', meal: 'Faim', hygiene: 'Hygiène', toilet: 'Toilettes', company: 'Compagnie', environment: 'Environnement' };
const characterName = (id: string) => isLifeCharacter(id) ? LIFE_CHARACTER_LABELS[id] : findCharacter(id)!.name;
const minutes = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 });

export function LaraLifePanel() {
  const { characters, selectedCharacterId, speed, home } = useLaraLifeStore();
  const { needs: actorNeeds, memory, relationships, elapsedSeconds, activity, reason, room } = characters[selectedCharacterId];
  const needs = { ...actorNeeds, environment: roomDirt(home, room) };
  const cleanliness = `${HOME_ROOMS[room]} · 0 % = propre. ` + (Object.keys(HOME_TASKS) as HomeTask[])
    .filter(key => HOME_TASKS[key].room === room).map(key => `${HOME_TASKS[key].label} : ${Math.round(home[key])} %`).join(' · ');
  const mood = getLifeMood(needs);
  const clock = lifeClock(elapsedSeconds);
  const favorite = favoriteLifeActivity(memory);
  const tastes = favorite ? `Loisir favori : ${LIFE_LABELS[favorite]}` : 'Goûts encore à découvrir';
  const friend = closestLifeFriend(relationships);
  const company = friend ? `Compagnie préférée : ${characterName(friend)}` : 'Aucune rencontre pour le moment';
  const relations = Object.entries(relationships).sort(([a, x], [b, y]) => (y.affinity ?? 0) - (x.affinity ?? 0) || y.seconds - x.seconds || a.localeCompare(b));
  return <section className="p-2 border-bottom small lh-sm" aria-label={`Vie de ${selectedCharacterId === 'native' ? 'Lara Native' : LIFE_CHARACTER_LABELS[selectedCharacterId]}`}>
    <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-1">
      <div className="d-flex flex-wrap gap-1 w-100" role="tablist" aria-label="Personnage du panneau de vie"
        onKeyDown={event => {
          if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
          event.preventDefault();
          const index = event.key === 'Home' ? 0 : event.key === 'End' ? LIFE_CHARACTER_IDS.length - 1
            : (LIFE_CHARACTER_IDS.indexOf(selectedCharacterId) + (event.key === 'ArrowRight' ? 1 : -1) + LIFE_CHARACTER_IDS.length) % LIFE_CHARACTER_IDS.length;
          const id = LIFE_CHARACTER_IDS[index];
          useLaraLifeStore.setState({ selectedCharacterId: id });
          document.getElementById(`life-tab-${id}`)!.focus();
        }}>
        {LIFE_CHARACTER_IDS.map(id => {
          const character = findCharacter(id)!;
          const selected = id === selectedCharacterId;
          return <button key={id} id={`life-tab-${id}`} type="button" role="tab"
            className={`btn btn-sm py-0 px-1 text-dark ${selected ? 'active fw-bold text-decoration-underline' : 'fw-medium'}`}
            style={{ backgroundColor: selected ? character.color : 'var(--bs-body-bg)', borderColor: character.color }}
            aria-selected={selected} aria-controls="life-character-panel" tabIndex={selected ? 0 : -1}
            onClick={() => useLaraLifeStore.setState({ selectedCharacterId: id })}>
            <span aria-hidden="true">{character.emoji}</span> {LIFE_CHARACTER_LABELS[id]}
          </button>;
        })}
      </div>
      <span className="text-nowrap" title={`Jour ${clock.day} · ${clock.period}`}>{clock.time}</span>
      <span className="text-primary" title={tastes} aria-label={tastes}><i className="bi bi-heart-fill" aria-hidden="true" /></span>
      <span className="text-primary" title={company} aria-label={company}><i className="bi bi-people-fill" aria-hidden="true" /></span>
      <button type="button" className="btn btn-sm btn-light text-dark border-secondary py-0 text-nowrap" aria-label="Vitesse de la colocation"
        title="Accélérer la vie de la colocation : ×1, ×3, ×10"
        onClick={() => useLaraLifeStore.setState({ speed: LIFE_SPEEDS[(LIFE_SPEEDS.indexOf(speed) + 1) % LIFE_SPEEDS.length] })}>
        <i className="bi bi-fast-forward-fill me-1" aria-hidden="true" />×{speed}
      </button>
    </div>
    <div id="life-character-panel" role="tabpanel" aria-labelledby={`life-tab-${selectedCharacterId}`}>
      {(Object.keys(needs) as (keyof LifeNeeds)[]).map(key => <label key={key} className="row align-items-center gx-2 mb-0">
        <span className="col-4" title={key === 'environment' ? cleanliness : LIFE_NEED_LABELS[key]}>{NEED_LABELS[key]}</span>
        <span className="col-6"><progress className="d-block w-100" max={100} value={needs[key]} aria-label={LIFE_NEED_LABELS[key]} /></span>
        <span className="col-2 text-end text-nowrap">{Math.round(needs[key])}%</span>
      </label>)}
      <div className="d-flex align-items-center gap-2 mt-1">
        <span className={`badge ${mood.uncomfortable ? 'text-bg-warning' : 'text-bg-success'}`} title={mood.cause} aria-label={`Humeur : ${mood.label}. ${mood.cause}`}>{mood.label}</span>
        <span className="fw-semibold text-truncate" title={`${activity} — ${reason}`} data-lara-life-activity>{activity}</span>
      </div>
      <div className="visually-hidden">{reason}</div>
      <details className="mt-1">
        <summary className="fw-semibold">Relations · {relations.length}</summary>
        {relations.length === 0 ? <div className="mt-1">Aucune rencontre pour le moment.</div> : <ul className="list-unstyled mb-0">
          {relations.map(([id, relation]) => {
            const affinity = relation.affinity ?? 0;
            const label = affinity < 0 ? 'Tensions' : affinity > 1 ? 'Meilleure amie' : affinity > 0 ? 'Amie' : 'Connaissance';
            return <li key={id} className="border-top pt-1 mt-1 text-break">
              <div className="d-flex flex-wrap align-items-center gap-1">
                <span className="fw-semibold">{characterName(id)}</span>
                <span className={`badge ${affinity < 0 ? 'text-bg-danger' : affinity > 0 ? 'text-bg-success' : 'text-bg-secondary'}`}>{label}</span>
                {id === friend && <i className="bi bi-star-fill text-primary" title="Compagnie préférée" aria-label="Compagnie préférée" />}
              </div>
              <div>{relation.seconds > 0 ? `${minutes.format(relation.seconds)} min ensemble` : 'Aucun moment partagé'}</div>
              {relation.seconds > 0 && <div title="Minutes simulées, issues des animations réellement jouées.">
                {Object.entries(relation.activities ?? {}).map(([activity, seconds]) => `${LIFE_LABELS[activity as LifeActivity]} : ${minutes.format(seconds)} min`).join(' · ')}
              </div>}
            </li>;
          })}
        </ul>}
        <div className="mt-1">Temps en minutes simulées.</div>
      </details>
    </div>
  </section>;
}
