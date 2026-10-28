import type { HassEntity } from 'home-assistant-js-websocket';
import { AIR_PERFORMER_CONTROLS, AIR_PERFORMER_SENSORS, isAirPerformerAction } from './airPerformer';

export const APPLIANCES = {
  ...AIR_PERFORMER_CONTROLS,
  glassDoorV2ShutterPos: { entity: 'cover.volet', label: 'Volet' },
  shutterStop: { entity: 'cover.volet', label: 'Arrêt du volet' },
  tvOn: { entity: 'media_player.tele', label: 'Télévision' },
} as const;
export type ApplianceAction = keyof typeof APPLIANCES;
export const isApplianceAction = (key: string): key is ApplianceAction => Object.prototype.hasOwnProperty.call(APPLIANCES, key);
export const APPLIANCE_ENTITIES = [...new Set([
  ...Object.values(APPLIANCES).map(device => device.entity),
  ...Object.keys(AIR_PERFORMER_SENSORS),
])];
export const entityAvailable = (entity?: HassEntity) => !!entity && entity.state !== 'unavailable' && entity.state !== 'unknown';
const supports = (entity: HassEntity, feature: number) => ((entity.attributes.supported_features ?? 0) & feature) !== 0;

export function applianceAvailable(action: ApplianceAction, entity?: HassEntity) {
  if (!entityAvailable(entity)) return false;
  if (isAirPerformerAction(action)) {
    if (action === 'airPerformerPower') return supports(entity!, entity!.state === 'off' ? 16 : 32);
    if (action === 'airPerformerSpeed') return supports(entity!, 1);
    if (action === 'airPerformerPreset') return supports(entity!, 8) && !!entity!.attributes.preset_modes?.length;
    if (APPLIANCES[action].entity.startsWith('select.')) return !!entity!.attributes.options?.length;
    return true;
  }
  switch (action) {
    case 'glassDoorV2ShutterPos': return supports(entity!, 4) && typeof entity!.attributes.current_position === 'number';
    case 'shutterStop': return supports(entity!, 8);
    case 'tvOn': return supports(entity!, entity!.state === 'off' || entity!.state === 'standby' ? 128 : 256);
  }
}

export function applianceCommand(action: ApplianceAction, entity: HassEntity, value?: boolean | number | string) {
  if (!applianceAvailable(action, entity)) throw new Error(`${APPLIANCES[action].label} indisponible ou commande non prise en charge.`);
  let domain: string, service: string;
  let data: Record<string, unknown> = {};
  if (isAirPerformerAction(action) && action !== 'airPerformerPower' && action !== 'airPerformerSpeed') {
    return airPerformerCommand(action, entity, value);
  }
  switch (action) {
    case 'airPerformerPower':
    case 'tvOn': {
      domain = action === 'tvOn' ? 'media_player' : 'fan';
      if (value !== undefined && typeof value !== 'boolean') throw new Error('Commande marche / arrêt invalide.');
      const off = entity.state === 'off' || entity.state === 'standby';
      service = (value === undefined ? off : value) ? 'turn_on' : 'turn_off';
      break;
    }
    case 'airPerformerSpeed': {
      domain = 'fan'; service = 'set_percentage';
      const step = entity.attributes.percentage_step;
      if (typeof step !== 'number' || step <= 0) throw new Error('Pas de vitesse du purificateur absent ou invalide.');
      const next = (entity.attributes.percentage ?? 0) + step;
      if (value !== undefined && typeof value !== 'number') throw new Error('Vitesse invalide.');
      const percentage = value === undefined ? (next > 100 ? step : next) : Number(value) * 10;
      if (!Number.isFinite(percentage) || percentage < step || percentage > 100 || Math.abs(percentage / step - Math.round(percentage / step)) > Number.EPSILON * 100) throw new Error('Vitesse invalide.');
      data = { percentage };
      break;
    }
    case 'glassDoorV2ShutterPos':
      domain = 'cover'; service = 'set_cover_position';
      if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 100) throw new Error('Position du volet invalide.');
      // HA reports percent open; the scene uses percent closed.
      data = { position: 100 - value };
      break;
    case 'shutterStop': domain = 'cover'; service = 'stop_cover'; break;
  }
  return { domain, service, data: { entity_id: APPLIANCES[action].entity, ...data } };
}

/** Scene speed is 1–10; HA reports percentages. Missing values stay unknown. */
export function applianceValue(action: ApplianceAction, entity?: HassEntity): string | number | boolean | undefined {
  if (!entityAvailable(entity)) return undefined;
  if (action === 'airPerformerSpeed') return typeof entity!.attributes.percentage === 'number' ? entity!.attributes.percentage / 10 : undefined;
  if (action === 'airPerformerPreset') return entity!.attributes.preset_mode ?? undefined;
  if (action === 'airPerformerDisplay') return entity!.state === 'off' ? 0 : typeof entity!.attributes.brightness === 'number' ? Math.round(entity!.attributes.brightness * 100 / 255) : undefined;
  const domain = APPLIANCES[action].entity.split('.')[0];
  if (domain === 'number') return Number.isFinite(Number(entity!.state)) ? Number(entity!.state) : undefined;
  if (domain === 'select') return entity!.state;
  return entity!.state === 'on';
}

function airPerformerCommand(action: keyof typeof AIR_PERFORMER_CONTROLS, entity: HassEntity, value?: boolean | number | string) {
  const config = AIR_PERFORMER_CONTROLS[action];
  const domain = config.entity.split('.')[0];
  const current = applianceValue(action, entity);
  let service: string;
  let data: Record<string, unknown>;
  if (domain === 'select' || action === 'airPerformerPreset') {
    const options: string[] = action === 'airPerformerPreset' ? entity.attributes.preset_modes : entity.attributes.options;
    const option = value ?? options[(options.indexOf(String(current)) + 1) % options.length];
    if (typeof option !== 'string' || !options.includes(option)) throw new Error(`${config.label} : option invalide.`);
    service = domain === 'fan' ? 'set_preset_mode' : 'select_option';
    data = { [domain === 'fan' ? 'preset_mode' : 'option']: option };
  } else if (domain === 'number' || domain === 'light') {
    const min = domain === 'light' ? 0 : entity.attributes.min;
    const max = domain === 'light' ? 100 : entity.attributes.max;
    const step = domain === 'light' ? 1 : entity.attributes.step;
    if (![min, max, step].every(n => typeof n === 'number' && Number.isFinite(n)) || step <= 0) throw new Error(`${config.label} : limites HA invalides.`);
    const values = 'values' in config ? config.values.filter(v => typeof v === 'number' && v >= min && v <= max) as number[] : [];
    const next = value ?? values.find(v => v > Number(current)) ?? values[0];
    if (typeof next !== 'number' || !Number.isFinite(next) || next < min || next > max || Math.abs((next - min) / step - Math.round((next - min) / step)) > 1e-8) throw new Error(`${config.label} : valeur invalide.`);
    service = domain === 'number' ? 'set_value' : next === 0 ? 'turn_off' : 'turn_on';
    data = domain === 'number' ? { value: next } : next === 0 ? {} : { brightness_pct: next };
  } else {
    if (value !== undefined && typeof value !== 'boolean') throw new Error(`${config.label} : état invalide.`);
    service = (value ?? !current) ? 'turn_on' : 'turn_off';
    data = {};
  }
  return { domain, service, data: { entity_id: config.entity, ...data } };
}
