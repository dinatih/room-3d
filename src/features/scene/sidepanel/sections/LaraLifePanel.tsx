import { LIFE_SETTINGS, LIFE_EVENT_LABELS, getLifeMood, isLifeCharacter, lifeClock, LIFE_CHARACTER_LABELS, LIFE_INITIAL_PREFERENCES, LIFE_PERSONALITY, LIFE_LABELS, LIFE_NEED_LABELS, type LifeActivity, type LifeNeeds, type LifeCharacterId } from '../../ai/laraLife';
import { useSceneStore } from '../../store/useSceneStore';
import { findCharacter } from '../../characterConfig';
import { useLaraLifeStore } from '../../ai/laraLifeStore';
import { HOME_ROOMS, HOME_TASKS, roomDirt, type HomeTask } from '../../ai/lifeHousekeeping';
import { openInventoryTarget, type OpenInventoryTargetDetail } from '@features/ui/AppConsole';
import { INVENTORY, STORAGE_SPACES } from '@features/inventory/inventoryData';
import { getInventorySmartObjects } from '@features/inventory/InventorySmartActions';
import { getSmartObject } from '../../ai/smartObjectRegistry';
import { duoSessionManager } from '../../ai/duoSessionManager';
import { getAnimationDef } from '../../animations/animationResolver';
import { getDuoAnimationForClip } from '../../animations/duoAnimations';
import { LifeSpeedButton } from '../../EnvironmentButton';

const NEED_LABELS: Record<keyof LifeNeeds, string> = { rest: 'Repos', work: 'Stimulation', walk: 'Bouger', meal: 'Faim', hygiene: 'Hygiène', toilet: 'Toilettes', company: 'Compagnie', environment: 'Environnement' };
const characterName = (id: string) => isLifeCharacter(id) ? LIFE_CHARACTER_LABELS[id] : findCharacter(id)!.name;
const minutes = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 });

function InventoryShortcut({ label, target }: { label: string; target?: OpenInventoryTargetDetail }) {
  return target && <button type="button" className="btn btn-sm btn-outline-dark py-0 px-1 ms-1 lh-1" title={`Ouvrir dans l’inventaire : ${label}`} aria-label={`Ouvrir dans l’inventaire : ${label}`} onClick={() => openInventoryTarget(target)}>
    <i className={`bi ${target.type === 'animation' ? 'bi-film' : 'bi-box-arrow-up-right'}`} aria-hidden="true" />
  </button>;
}

export function LaraLifePanel({ characterId }: { characterId?: LifeCharacterId } = {}) {
  const { characters, home, household } = useLaraLifeStore();
  const activeCharacterId = useSceneStore(state => state.activeCharacterId);
  const selectedCharacterId = characterId ?? activeCharacterId;
  if (!isLifeCharacter(selectedCharacterId)) return <section className="p-2 small">Ce personnage ne participe pas au système de vie.</section>;
  const { needs: actorNeeds, elapsedSeconds, activity, reason, room, current } = characters[selectedCharacterId];
  const object = current?.smartObjectId ? getSmartObject(current.smartObjectId) : undefined;
  const slot = object?.slots.find(slot => slot.slotId === current?.slotId?.split(':')[0]);
  const duo = duoSessionManager.getSessionFor(selectedCharacterId);
  const partner = [duo?.participantA?.characterId, duo?.participantB?.characterId].find(id => id && id !== selectedCharacterId);
  const duoAnimation = duo?.playlist[duo.currentAnimIndex];
  const animation = current?.animation ? getAnimationDef(current.animation) : undefined;
  const duoClip = getDuoAnimationForClip(current?.animation);
  const inventoryObject = object && (INVENTORY.find(item => item.id === object.id || getInventorySmartObjects(item.id).some(smartObject => smartObject.id === object.id))
    ?? STORAGE_SPACES.find(item => item.id === object.id));
  const objectTarget: OpenInventoryTargetDetail | undefined = inventoryObject ? { type: 'object', object: { id: object.id, inventoryId: inventoryObject.id, slotId: current?.slotId, actorId: selectedCharacterId, animationId: current?.animation } } : undefined;
  const animationTarget: OpenInventoryTargetDetail | undefined = duoClip || animation ? { type: 'animation', animation: { id: (duoClip ?? animation)!.id, mode: duoClip ? 'duo' : 'solo', actorId: selectedCharacterId, partnerId: partner } } : undefined;
  const needs = { ...actorNeeds, environment: roomDirt(home, room) };
  const cleanliness = `${HOME_ROOMS[room]} · 0 % = propre. ` + (Object.keys(HOME_TASKS) as HomeTask[])
    .filter(key => HOME_TASKS[key].room === room).map(key => `${HOME_TASKS[key].label} : ${Math.round(home[key])} %`).join(' · ');
  const mood = getLifeMood(needs);
  const clock = lifeClock(elapsedSeconds);
  const initialTastes = LIFE_INITIAL_PREFERENCES[selectedCharacterId].map(activity => LIFE_LABELS[activity]).join(' · ');
  return <section className="p-2 border-bottom small lh-sm" aria-label={`Vie de ${selectedCharacterId === 'native' ? 'Lara Native' : LIFE_CHARACTER_LABELS[selectedCharacterId]}`}>
    <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-1">
      <h4 className="fs-6 fw-bold mb-0 w-100"><span style={{ color: findCharacter(selectedCharacterId)!.color }}>{findCharacter(selectedCharacterId)!.emoji}</span> Vie de {characterName(selectedCharacterId)}</h4>
      <span className="text-nowrap" title={`Jour ${clock.day} · ${clock.period}`}>{clock.time}</span>
      <span className="text-primary" title={initialTastes} aria-label={initialTastes}><i className="bi bi-heart-fill" aria-hidden="true" /></span>
      {!characterId && <button type="button" className="btn btn-sm btn-outline-dark py-0" title="Ouvrir ce PNJ dans l’inventaire" aria-label={`Ouvrir ${characterName(selectedCharacterId)} dans l’inventaire`}
        onClick={() => openInventoryTarget({ type: 'object', object: { id: selectedCharacterId } })}>
        <i className="bi bi-box-seam" aria-hidden="true" />
      </button>}
      {!characterId && <LifeSpeedButton />}
    </div>
    {selectedCharacterId === 'marissa' && (
      <div className="d-flex align-items-center justify-content-between gap-2 mb-1 p-1 rounded bg-danger-subtle border border-danger-subtle">
        <span className="small fw-semibold text-danger"><i className="bi bi-scissors me-1" aria-hidden="true" />Coiffeuse</span>
        <a
          href="/lucia-styles/"
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-sm btn-danger py-0 px-2 d-inline-flex align-items-center gap-1"
          title="Ouvrir le catalogue GTA 6 — Lucia Styles"
        >
          <span>Lucia Styles</span>
          <i className="bi bi-box-arrow-up-right" aria-hidden="true" />
        </a>
      </div>
    )}
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
      <div className="mt-1 text-break" aria-label="Action et animation actuelles">
        {current?.smartObjectId && <div title={current.smartObjectId}><strong>Smart Object :</strong> {object?.name ?? current.smartObjectId}<InventoryShortcut label="Objet" target={objectTarget} /></div>}
        {current?.slotId && <div title={`${current.slotId} · ${current.status}`}><strong>Action :</strong> {slot?.name ?? current.slotId}</div>}
        {duo && <div><strong>Duo :</strong> {partner ? characterName(partner) : 'En attente du partenaire'}{duoAnimation && ` · ${duoAnimation.id}`}</div>}
        {current?.animation && <div title={`État : ${current.status}${current.animationRequest ? ` · Animation demandée : ${current.animationRequest}` : ''}`}><strong>Animation :</strong> {animation?.id ?? current.animation}{animation?.duration !== undefined && <span className="text-nowrap"> · {minutes.format(animation.duration)} s</span>}<InventoryShortcut label="Animation" target={animationTarget} /></div>}
        {slot?.animationsRandom && <div><strong>Tags / groupe :</strong> {Array.isArray(slot.animationsRandom) ? slot.animationsRandom.join(', ') : slot.animationsRandom}</div>}
        {slot?.duoPool && <div><strong>Groupe duo :</strong> {slot.slotId} · {slot.duoPool.length} animations</div>}
      </div>
      <details className="mt-1 text-break" open={characterId ? true : undefined}>
        <summary className="fw-semibold">Goûts</summary>
        <div>Au départ : {initialTastes}.</div>
        {LIFE_PERSONALITY[selectedCharacterId] && <div>{LIFE_PERSONALITY[selectedCharacterId]}.</div>}
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
    </div>
  </section>;
}
