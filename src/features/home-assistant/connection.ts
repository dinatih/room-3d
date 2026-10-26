import { create } from 'zustand';
import { callService, createConnection, getAuth, getStates, ERR_INVALID_AUTH } from 'home-assistant-js-websocket';
import type { Connection, HassEntity, AuthData, StateChangedEvent } from 'home-assistant-js-websocket';

export const ENTRY_LIGHT = { action: 'lampCorridor', entity: 'light.entree_entree' } as const;
const TOKEN_KEY = 'room3d.ha.auth';
const ENABLED_KEY = 'room3d.ha.enabled';

export interface EntryLightState {
  on: boolean;
  brightness: number;
  rgb: [number, number, number] | null;
}
interface HomeAssistantState {
  enabled: boolean;
  status: 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error';
  available: boolean;
  lamp: EntryLightState | null;
  pending: boolean;
  error: string | null;
}
export const useHomeAssistant = create<HomeAssistantState>(() => ({
  enabled: false, status: 'disconnected', available: false, lamp: null, pending: false, error: null,
}));
let connection: Connection | undefined;
let dispose: (() => void) | undefined;
let generation = 0;

export function receiveEntryLight(entity: HassEntity | undefined) {
  const valid = entity?.state === 'on' || entity?.state === 'off';
  if (!valid) {
    useHomeAssistant.setState({ available: false, error: `Lampe Entrée : ${entity?.state ?? 'entité absente'}.` });
    return;
  }
  const lamp: EntryLightState = {
    on: entity.state === 'on',
    brightness: entity.attributes.brightness == null ? 1 : entity.attributes.brightness / 255,
    rgb: entity.attributes.rgb_color ?? null,
  };
  const previous = useHomeAssistant.getState();
  if (previous.available && JSON.stringify(previous.lamp) === JSON.stringify(lamp)) return;
  useHomeAssistant.setState({ lamp, available: true, error: null });
}

export async function connectHomeAssistant(url?: string) {
  if (useHomeAssistant.getState().enabled) return;
  const run = ++generation;
  useHomeAssistant.setState({ enabled: true, status: 'connecting', available: false, error: null });
  sessionStorage.setItem(ENABLED_KEY, '1');
  try {
    const auth = await getAuth({
      hassUrl: url,
      loadTokens: async () => JSON.parse(sessionStorage.getItem(TOKEN_KEY) ?? 'null') as AuthData | null,
      saveTokens: data => {
        if (run !== generation) return;
        if (data) sessionStorage.setItem(TOKEN_KEY, JSON.stringify(data));
        else sessionStorage.removeItem(TOKEN_KEY);
      },
    });
    const next = await createConnection({ auth });
    if (run !== generation) { next.close(); return; }
    connection = next;
    let synchronized = false;
    let synchronization = 0;
    const ready = async () => {
      const snapshot = ++synchronization;
      synchronized = false;
      useHomeAssistant.setState({ available: false });
      try {
        const entities = await getStates(next);
        if (run !== generation || snapshot !== synchronization || !next.connected) return;
        synchronized = true;
        useHomeAssistant.setState({ status: 'connected' });
        receiveEntryLight(entities.find(entity => entity.entity_id === ENTRY_LIGHT.entity));
      } catch {
        if (run === generation && snapshot === synchronization) useHomeAssistant.setState({ status: 'error', available: false, error: 'Lecture des états Home Assistant impossible.' });
      }
    };
    const disconnected = () => {
      ++synchronization;
      synchronized = false;
      useHomeAssistant.setState({ status: 'reconnecting', available: false, error: 'Connexion perdue : dernier état périmé.' });
    };
    const reconnectError = () => {
      sessionStorage.removeItem(TOKEN_KEY);
      useHomeAssistant.setState({ status: 'error', available: false, error: 'Autorisation expirée. Déconnecte puis reconnecte Home Assistant.' });
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
      if (run === generation && synchronized && next.connected && event.data.entity_id === ENTRY_LIGHT.entity) {
        receiveEntryLight(event.data.new_state ?? undefined);
      }
    }, 'state_changed');
    if (run !== generation) return;
    await ready();
  } catch (error) {
    if (run !== generation) return;
    dispose?.();
    dispose = undefined;
    connection?.close();
    connection = undefined;
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(ENABLED_KEY);
    useHomeAssistant.setState({ status: 'error', available: false,
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
  useHomeAssistant.setState({ enabled: false, status: 'disconnected', available: false, lamp: null, pending: false, error: null });
}

export function disconnectHomeAssistant() {
  stopHomeAssistant();
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(ENABLED_KEY);
}

export function resumeHomeAssistant() {
  if (sessionStorage.getItem(ENABLED_KEY)) void connectHomeAssistant();
}

export async function setEntryLight(on?: boolean) {
  const state = useHomeAssistant.getState();
  if (state.pending) return;
  if (!connection?.connected || state.status !== 'connected' || !state.available || !state.lamp) {
    useHomeAssistant.setState({ error: 'Lampe Entrée indisponible : aucune commande envoyée.' });
    return;
  }
  const run = generation;
  useHomeAssistant.setState({ pending: true, error: null });
  try {
    await callService(connection, 'light', (on ?? !state.lamp.on) ? 'turn_on' : 'turn_off', { entity_id: ENTRY_LIGHT.entity });
  } catch {
    if (run === generation) useHomeAssistant.setState({ error: 'La commande de la lampe Entrée a échoué.' });
  } finally {
    if (run === generation) useHomeAssistant.setState({ pending: false });
  }
}

if (import.meta.hot) import.meta.hot.dispose(stopHomeAssistant);
