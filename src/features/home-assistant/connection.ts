import { create } from 'zustand';
import { compareTuyaNames, type NameDevice, type NameEntity, type NameArea } from './nameComparison';
import { APPLIANCES, APPLIANCE_ENTITIES, applianceAvailable, applianceCommand, isApplianceAction, type ApplianceAction } from './appliances';
import { callService, createConnection, getAuth, getStates, ERR_INVALID_AUTH } from 'home-assistant-js-websocket';
import type { Connection, HassEntity, AuthData, StateChangedEvent } from 'home-assistant-js-websocket';

export const LIGHTS = {
  lampCorridor: { entity: 'light.entree_entree', label: 'Entrée' },
  lampBath: { entity: 'light.douche_douche', label: 'Salle de bain' },
  lampOn: { entity: 'light.porte', label: 'Lumière Séjour' },
  lampKitchen: { entity: 'light.cuisine_barre', label: 'Barre · Cuisine' },
} as const;
export type LightKey = keyof typeof LIGHTS;
export const LIGHT_KEYS = Object.keys(LIGHTS) as LightKey[];
export const isHomeAssistantLight = (key: string): key is LightKey => Object.prototype.hasOwnProperty.call(LIGHTS, key);
const TOKEN_KEY = 'room3d.ha.auth';
const ENABLED_KEY = 'room3d.ha.enabled';
const LINKED_KEY = 'room3d.ha.linked';

export interface LightState {
  name: string | null;
  on: boolean | null;
  available: boolean;
  pending: boolean;
  error: string | null;
  brightness: number;
  rgb: [number, number, number] | null;
}
interface HomeAssistantState {
  enabled: boolean;
  linked: boolean;
  status: 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error';
  lights: Record<LightKey, LightState>;
  entities: Record<string, HassEntity>;
  applianceCommands: Partial<Record<ApplianceAction, { pending: boolean; error: string | null }>>;
  error: string | null;
}
const emptyLights = () => Object.fromEntries(LIGHT_KEYS.map(key => [key, {
  name: null, on: null, brightness: 1, rgb: null, available: false, pending: false, error: null,
}])) as Record<LightKey, LightState>;
export const useHomeAssistant = create<HomeAssistantState>(() => ({
  enabled: false, linked: sessionStorage.getItem(LINKED_KEY) !== '0', status: 'disconnected', lights: emptyLights(), entities: {}, applianceCommands: {}, error: null,
}));
export const isHomeAssistantLinked = (state: HomeAssistantState) => state.enabled && state.linked;
export function setHomeAssistantLinked(linked: boolean) {
  sessionStorage.setItem(LINKED_KEY, linked ? '1' : '0');
  useHomeAssistant.setState({ linked });
}
export const isHomeAssistantAction = (key: string): key is LightKey | ApplianceAction => isHomeAssistantLight(key) || isApplianceAction(key);
export function isHomeAssistantControlDisabled(key: string, state: HomeAssistantState) {
  if (!isHomeAssistantLinked(state)) return false;
  if (isHomeAssistantLight(key)) return state.status !== 'connected' || !state.lights[key].available || state.lights[key].pending;
  if (isApplianceAction(key)) return state.status !== 'connected' || !!state.applianceCommands[key]?.pending || !applianceAvailable(key, state.entities[APPLIANCES[key].entity]);
  return false;
}
function updateLight(key: LightKey, patch: Partial<LightState>) {
  useHomeAssistant.setState(state => ({ lights: { ...state.lights, [key]: { ...state.lights[key], ...patch } } }));
}
let connection: Connection | undefined;
let dispose: (() => void) | undefined;
let generation = 0;

function clearAuthCallback() {
  const url = new URL(window.location.href);
  if (!url.searchParams.has('auth_callback')) return;
  for (const key of ['auth_callback', 'code', 'state']) url.searchParams.delete(key);
  window.history.replaceState(window.history.state, '', url);
}

function receiveLight(key: LightKey, entity: HassEntity | undefined) {
  if (entity?.state !== 'on' && entity?.state !== 'off') {
    updateLight(key, { available: false, error: `${LIGHTS[key].label} : ${entity?.state ?? 'entité absente'}.` });
    return;
  }
  const previous = useHomeAssistant.getState().lights[key];
  const light: LightState = { ...previous,
    on: entity.state === 'on', name: entity.attributes.friendly_name ?? null, available: true, error: null,
    brightness: entity.attributes.brightness == null ? 1 : entity.attributes.brightness / 255,
    rgb: entity.attributes.rgb_color ?? null,
  };
  if (JSON.stringify(previous) !== JSON.stringify(light)) updateLight(key, light);
}

export async function connectHomeAssistant(url?: string) {
  if (useHomeAssistant.getState().enabled) return;
  const run = ++generation;
  useHomeAssistant.setState({ enabled: true, status: 'connecting', error: null });
  sessionStorage.setItem(ENABLED_KEY, '1');
  try {
    if (sessionStorage.getItem(TOKEN_KEY)) clearAuthCallback();
    const auth = await getAuth({
      hassUrl: url,
      loadTokens: async () => JSON.parse(sessionStorage.getItem(TOKEN_KEY) ?? 'null') as AuthData | null,
      saveTokens: data => {
        if (run !== generation) return;
        if (data) sessionStorage.setItem(TOKEN_KEY, JSON.stringify(data));
        else sessionStorage.removeItem(TOKEN_KEY);
      },
    });
    clearAuthCallback();
    const next = await createConnection({ auth });
    if (run !== generation) { next.close(); return; }
    connection = next;
    let synchronized = false;
    let synchronization = 0;
    const ready = async () => {
      const snapshot = ++synchronization;
      synchronized = false;
      try {
        const entities = await getStates(next);
        if (run !== generation || snapshot !== synchronization || !next.connected) return;
        synchronized = true;
        for (const key of LIGHT_KEYS) receiveLight(key, entities.find(entity => entity.entity_id === LIGHTS[key].entity));
        useHomeAssistant.setState({ status: 'connected', error: null, entities: Object.fromEntries(entities.filter(entity => APPLIANCE_ENTITIES.includes(entity.entity_id)).map(entity => [entity.entity_id, entity])) });
      } catch {
        if (run === generation && snapshot === synchronization) useHomeAssistant.setState({ status: 'error', error: 'Lecture des états Home Assistant impossible.' });
      }
    };
    const disconnected = () => {
      ++synchronization;
      synchronized = false;
      useHomeAssistant.setState({ status: 'reconnecting', error: 'Connexion perdue : dernier état périmé.' });
    };
    const reconnectError = () => {
      sessionStorage.removeItem(TOKEN_KEY);
      useHomeAssistant.setState({ status: 'error', error: 'Autorisation expirée. Déconnecte puis reconnecte Home Assistant.' });
    };
    next.addEventListener('ready', ready);
    next.addEventListener('disconnected', disconnected);
    next.addEventListener('reconnect-error', reconnectError);
    dispose = () => {
      next.removeEventListener('ready', ready);
      next.removeEventListener('disconnected', disconnected);
      next.removeEventListener('reconnect-error', reconnectError);
    };
    await next.subscribeEvents<StateChangedEvent>(event => {
      if (run !== generation || !synchronized || !next.connected) return;
      const key = LIGHT_KEYS.find(key => LIGHTS[key].entity === event.data.entity_id);
      if (key) receiveLight(key, event.data.new_state ?? undefined);
      if (APPLIANCE_ENTITIES.includes(event.data.entity_id)) {
        useHomeAssistant.setState(state => {
          const entities = { ...state.entities };
          if (event.data.new_state) entities[event.data.entity_id] = event.data.new_state;
          else delete entities[event.data.entity_id];
          return { entities };
        });
      }
    }, 'state_changed');
    if (run !== generation) return;
    await ready();
  } catch (error) {
    if (run !== generation) return;
    clearAuthCallback();
    dispose?.();
    dispose = undefined;
    connection?.close();
    connection = undefined;
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(ENABLED_KEY);
    useHomeAssistant.setState({ status: 'error',
      error: error === ERR_INVALID_AUTH ? 'Autorisation Home Assistant refusée ou expirée.' : 'Connexion Home Assistant impossible. Vérifie l’adresse et son accès depuis ce navigateur.' });
  }
}

export function stopHomeAssistant() {
  ++generation;
  dispose?.();
  dispose = undefined;
  // HA cancels the socket's subscriptions when it closes.
  connection?.close();
  connection = undefined;
  useHomeAssistant.setState({ enabled: false, status: 'disconnected', lights: emptyLights(), entities: {}, applianceCommands: {}, error: null });
}

export function disconnectHomeAssistant() {
  stopHomeAssistant();
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(ENABLED_KEY);
}

export function resumeHomeAssistant() {
  if (sessionStorage.getItem(ENABLED_KEY)) void connectHomeAssistant();
}

export async function setHomeAssistantLight(key: LightKey, on?: boolean) {
  const state = useHomeAssistant.getState();
  if (!isHomeAssistantLinked(state)) return;
  const light = state.lights[key];
  if (light.pending) return;
  if (!connection?.connected || state.status !== 'connected' || !light.available || light.on === null) {
    updateLight(key, { error: `${LIGHTS[key].label} indisponible : aucune commande envoyée.` });
    return;
  }
  const run = generation;
  updateLight(key, { pending: true, error: null });
  try {
    await callService(connection, 'light', (on ?? !light.on) ? 'turn_on' : 'turn_off', { entity_id: LIGHTS[key].entity });
  } catch {
    if (run === generation) updateLight(key, { error: `La commande de ${LIGHTS[key].label} a échoué.` });
  } finally {
    if (run === generation) updateLight(key, { pending: false });
  }
}

export async function requestHomeAssistantAction(key: LightKey | ApplianceAction, value?: boolean | number | string) {
  if (!isHomeAssistantLinked(useHomeAssistant.getState())) return;
  if (isHomeAssistantLight(key)) {
    if (value !== undefined && typeof value !== 'boolean') throw new Error('Commande de lumière invalide.');
    return setHomeAssistantLight(key, value);
  }
  const state = useHomeAssistant.getState();
  const update = (pending: boolean, error: string | null) => useHomeAssistant.setState(state => ({
    applianceCommands: { ...state.applianceCommands, [key]: { pending, error } },
  }));
  if (state.applianceCommands[key]?.pending) return;
  const run = generation;
  try {
    if (!connection?.connected || state.status !== 'connected') throw new Error('Connexion Home Assistant indisponible : aucune commande envoyée.');
    const entity = state.entities[APPLIANCES[key].entity];
    if (!entity) throw new Error(`${APPLIANCES[key].label} : entité absente.`);
    const command = applianceCommand(key, entity, value);
    update(true, null);
    await callService(connection, command.domain, command.service, command.data);
    if (run === generation) update(false, null);
  } catch (error) {
    if (run === generation) update(false, error instanceof Error ? error.message : `La commande de ${APPLIANCES[key].label} a échoué.`);
  }
}

export async function loadTuyaNameComparison() {
  const current = connection;
  if (!current?.connected || useHomeAssistant.getState().status !== 'connected') throw new Error('Connexion HA requise pour lire les noms.');
  const [devices, entities, areas] = await Promise.all([
    current.sendMessagePromise<NameDevice[]>({ type: 'config/device_registry/list' }),
    current.sendMessagePromise<NameEntity[]>({ type: 'config/entity_registry/list' }),
    current.sendMessagePromise<NameArea[]>({ type: 'config/area_registry/list' }),
  ]);
  if (current !== connection || !current.connected) throw new Error('Connexion HA interrompue pendant la lecture des noms.');
  return compareTuyaNames(devices, entities, areas);
}

if (import.meta.hot) import.meta.hot.dispose(stopHomeAssistant);
