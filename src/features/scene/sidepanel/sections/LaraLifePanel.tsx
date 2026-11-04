import { LIFE_SETTINGS, LIFE_EVENT_LABELS, closestLifeFriend, favoriteLifeActivity, getLifeMood, isLifeCharacter, lifeClock, LIFE_CHARACTER_LABELS, LIFE_INITIAL_PREFERENCES, LIFE_PERSONALITY, LIFE_SPEEDS, LIFE_LABELS, LIFE_NEED_LABELS, type LifeActivity, type LifeNeeds, type LifeCharacterId } from '../../ai/laraLife';
import { useSceneStore } from '../../store/useSceneStore';
import { findCharacter } from '../../characterConfig';
import { resetLives, useLaraLifeStore } from '../../ai/laraLifeStore';
import { HOME_ROOMS, HOME_TASKS, roomDirt, type HomeTask } from '../../ai/lifeHousekeeping';

const NEED_LABELS: Record<keyof LifeNeeds, string> = { rest: 'Repos', work: 'Stimulation', walk: 'Bouger', meal: 'Faim', hygiene: 'Hygiène', toilet: 'Toilettes', company: 'Compagnie', environment: 'Environnement' };
const characterName = (id: string) => isLifeCharacter(id) ? LIFE_CHARACTER_LABELS[id] : findCharacter(id)!.name;
const minutes = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 });

export function LaraLifePanel({ characterId }: { characterId?: LifeCharacterId } = {}) {
  const { characters, speed, home, household, savedAt, saveError } = useLaraLifeStore();
  const activeCharacterId = useSceneStore(state => state.activeCharacterId);
  const selectedCharacterId = characterId ?? activeCharacterId;
  if (!isLifeCharacter(selectedCharacterId)) return <section className="p-2 small">Ce personnage ne participe pas au système de vie.</section>;
  const { needs: actorNeeds, memory, relationships, elapsedSeconds, activity, reason, room } = characters[selectedCharacterId];
  const needs = { ...actorNeeds, environment: roomDirt(home, room) };
  const cleanliness = `${HOME_ROOMS[room]} · 0 % = propre. ` + (Object.keys(HOME_TASKS) as HomeTask[])
    .filter(key => HOME_TASKS[key].room === room).map(key => `${HOME_TASKS[key].label} : ${Math.round(home[key])} %`).join(' · ');
  const mood = getLifeMood(needs);
  const clock = lifeClock(elapsedSeconds);
  const favorite = favoriteLifeActivity(memory);
  const initialTastes = LIFE_INITIAL_PREFERENCES[selectedCharacterId].map(activity => LIFE_LABELS[activity]).join(' · ');
  const tastes = favorite ? `Loisir favori découvert : ${LIFE_LABELS[favorite]}` : `Goûts initiaux : ${initialTastes}`;
  const friend = closestLifeFriend(relationships);
  const company = friend ? `Compagnie préférée : ${characterName(friend)}` : 'Aucune rencontre pour le moment';
  const relations = Object.entries(relationships).sort(([a, x], [b, y]) => (y.affinity ?? 0) - (x.affinity ?? 0) || y.seconds - x.seconds || a.localeCompare(b));
  return <section className="p-2 border-bottom small lh-sm" aria-label={`Vie de ${selectedCharacterId === 'native' ? 'Lara Native' : LIFE_CHARACTER_LABELS[selectedCharacterId]}`}>
    <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-1">
      <h4 className="fs-6 fw-bold mb-0 w-100"><span style={{ color: findCharacter(selectedCharacterId)!.color }}>{findCharacter(selectedCharacterId)!.emoji}</span> Vie de {characterName(selectedCharacterId)}</h4>
      <span className="text-nowrap" title={`Jour ${clock.day} · ${clock.period}`}>{clock.time}</span>
      <span className="text-primary" title={tastes} aria-label={tastes}><i className="bi bi-heart-fill" aria-hidden="true" /></span>
      <span className="text-primary" title={company} aria-label={company}><i className="bi bi-people-fill" aria-hidden="true" /></span>
      {!characterId && <button type="button" className="btn btn-sm btn-light text-dark border-secondary py-0 text-nowrap" aria-label="Vitesse de la colocation"
        title="Accélérer la vie de la colocation : ×1, ×3, ×10"
        onClick={() => useLaraLifeStore.setState({ speed: LIFE_SPEEDS[(LIFE_SPEEDS.indexOf(speed) + 1) % LIFE_SPEEDS.length] })}>
        <i className="bi bi-fast-forward-fill me-1" aria-hidden="true" />×{speed}
      </button>}
    </div>
    <div id={characterId ? undefined : 'life-character-panel'}>
      {(Object.keys(needs) as (keyof LifeNeeds)[]).map(key => <label key={key} className="row align-items-center gx-2 mb-0">
        <span className="col-4" title={key === 'environment' ? cleanliness : LIFE_NEED_LABELS[key]}>{NEED_LABELS[key]}</span>
        <span className="col-6"><progress className="d-block w-100" max={100} value={needs[key]} aria-label={LIFE_NEED_LABELS[key]} /></span>
        <span className="col-2 text-end text-nowrap">{Math.round(needs[key])}%</span>
      </label>)}
      <div className="d-flex align-items-center gap-2 mt-1">
        <span className={`badge ${mood.uncomfortable ? 'text-bg-warning' : 'text-bg-success'}`} title={mood.cause} aria-label={`Humeur : ${mood.label}. ${mood.cause}`}>{mood.label}</span>
        <span className="fw-semibold text-truncate" title={`${activity} — ${reason}`} data-lara-life-activity>{activity}</span>
      </div>
      <div className={characterId ? 'mt-1 text-break' : 'visually-hidden'}>{reason}</div>
      {!characterId && <details className="mt-1 text-break">
        <summary className="fw-semibold">Sauvegarde de la colocation</summary>
        <div>{savedAt ? `Sauvegardée à ${new Date(savedAt).toLocaleTimeString('fr-FR')}.` : 'Sauvegarde automatique pendant la simulation.'}</div>
        <button type="button" className="btn btn-sm btn-outline-danger mt-1" onClick={() => {
          if (window.confirm('Recommencer toute la colocation ? Les besoins, souvenirs, relations apprises, habitudes et la propreté seront réinitialisés pour tous les personnages.')) resetLives();
        }}>Nouvelle vie</button>
      </details>}
      {saveError && <div role="alert" className="text-bg-danger rounded p-1 mt-1 text-break">{saveError}</div>}
      <details className="mt-1 text-break" open={characterId ? true : undefined}>
        <summary className="fw-semibold">Goûts</summary>
        <div>Au départ : {initialTastes}.</div>
        {LIFE_PERSONALITY[selectedCharacterId] && <div>{LIFE_PERSONALITY[selectedCharacterId]}.</div>}
        <div>{favorite ? `Loisir favori découvert : ${LIFE_LABELS[favorite]}.` : 'Loisir favori encore à découvrir.'}</div>
        <div>Les expériences prennent progressivement le pas sur les goûts initiaux.</div>
      </details>
      <details className="mt-1" open={characterId ? true : undefined}>
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
      <details className="mt-1 text-break">
        <summary className="fw-semibold">Journée vécue</summary>
        <div>{household.meals.portions} portion(s) de repas disponible(s) dans la colocation.</div>
        {!household.journal[selectedCharacterId] ? <div>Le bilan se construit pendant la simulation.</div> : Object.entries(household.journal[selectedCharacterId]!).sort(([a], [b]) => Number(b) - Number(a)).map(([day, summary]) => <details key={day} className="border-top mt-1 pt-1">
          <summary>Jour {day}{Number(day) === clock.day ? ' · en cours' : ''}</summary>
          <div className="fw-semibold">Activités réellement vécues</div>
          {Object.entries(summary.activities).sort(([, a], [, b]) => b! - a!).map(([activity, duration]) => <div key={activity}>{LIFE_LABELS[activity as LifeActivity]} : {minutes.format(duration!)} min</div>)}
          <div className="fw-semibold mt-1">Moments partagés</div>
          {Object.keys(summary.partners).length ? Object.entries(summary.partners).map(([id, duration]) => <div key={id}>{characterName(id)} : {minutes.format(duration)} min</div>) : <div>Aucun moment partagé.</div>}
          <div className="fw-semibold mt-1">Besoins restés insatisfaits (≥ {LIFE_SETTINGS.priority} %)</div>
          {Object.keys(summary.unmet).length ? Object.entries(summary.unmet).map(([need, duration]) => <div key={need}>{NEED_LABELS[need as keyof LifeNeeds]} : {minutes.format(duration!)} min</div>) : <div>Aucun besoin au-dessus du seuil.</div>}
          {Object.entries(summary.events).map(([event, count]) => <div key={event}>{LIFE_EVENT_LABELS[event]} : {count}</div>)}
          <div className="text-muted mt-1">Durées en minutes simulées. Les trajets comptent comme marche ; les attentes ne comptent pas comme une activité accomplie.</div>
        </details>)}
      </details>
      {characterId && <details className="mt-1 text-break">
        <summary className="fw-semibold">Souvenirs et habitudes · {Object.keys(memory).length}</summary>
        {Object.keys(memory).length === 0 ? <div>Les habitudes se découvriront au fil des activités.</div> : <ul className="list-unstyled mb-0">
          {Object.entries(memory).map(([activity, experience]) => <li key={activity} className="border-top pt-1 mt-1">
            <div className="fw-semibold">{LIFE_LABELS[activity as LifeActivity]}</div>
            <div>Satisfaction apprise : {minutes.format(experience.satisfaction)} · Dernière fois : jour {lifeClock(experience.lastAt).day}, {lifeClock(experience.lastAt).time}</div>
            {experience.periods && <div>{Object.entries(experience.periods).map(([period, count]) => `${period} : ${count}`).join(' · ')}</div>}
          </li>)}
        </ul>}
      </details>}
    </div>
  </section>;
}
