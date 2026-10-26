import { create } from 'zustand';
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

export interface LightState {
  on: boolean | null;
  available: boolean;
  pending: boolean;
  error: string | null;
  brightness: number;
  rgb: [number, number, number] | null;
}
interface HomeAssistantState {
  enabled: boolean;
  status: 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error';
  lights: Record<LightKey, LightState>;
  error: string | null;
}
const emptyLights = () => Object.fromEntries(LIGHT_KEYS.map(key => [key, {
  on: null, brightness: 1, rgb: null, available: false, pending: false, error: null,
}])) as Record<LightKey, LightState>;
export const useHomeAssistant = create<HomeAssistantState>(() => ({
  enabled: false, status: 'disconnected', lights: emptyLights(), error: null,
}));
export function isLightControlDisabled(key: string, state: HomeAssistantState) {
  return isHomeAssistantLight(key) && state.enabled &&
    (state.status !== 'connected' || !state.lights[key].available || state.lights[key].pending);
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
    on: entity.state === 'on', available: true, error: null,
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
        useHomeAssistant.setState({ status: 'connected', error: null });
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
  useHomeAssistant.setState({ enabled: false, status: 'disconnected', lights: emptyLights(), error: null });
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

if (import.meta.hot) import.meta.hot.dispose(stopHomeAssistant);
