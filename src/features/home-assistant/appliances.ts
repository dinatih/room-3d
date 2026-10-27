import type { HassEntity } from 'home-assistant-js-websocket';

export const APPLIANCES = {
  airPerformerPower: { entity: 'fan.living_room', label: 'Purificateur' },
  airPerformerMode: { entity: 'select.living_room_function', label: 'Fonction du purificateur' },
  airPerformerSpeed: { entity: 'fan.living_room', label: 'Vitesse du purificateur' },
  glassDoorV2ShutterPos: { entity: 'cover.volet', label: 'Volet' },
  shutterStop: { entity: 'cover.volet', label: 'Arrêt du volet' },
  tvOn: { entity: 'media_player.tele', label: 'Télévision' },
} as const;
export type ApplianceAction = keyof typeof APPLIANCES;
export const isApplianceAction = (key: string): key is ApplianceAction => Object.prototype.hasOwnProperty.call(APPLIANCES, key);
export const APPLIANCE_ENTITIES = [...new Set([
  ...Object.values(APPLIANCES).map(device => device.entity),
  'sensor.living_room_pm2_5', 'number.living_room_temperature',
])];
export const entityAvailable = (entity?: HassEntity) => !!entity && entity.state !== 'unavailable' && entity.state !== 'unknown';
const supports = (entity: HassEntity, feature: number) => ((entity.attributes.supported_features ?? 0) & feature) !== 0;

export function applianceAvailable(action: ApplianceAction, entity?: HassEntity) {
  if (!entityAvailable(entity)) return false;
  switch (action) {
    case 'airPerformerPower': return supports(entity!, entity!.state === 'off' ? 16 : 32);
    case 'airPerformerMode': return Array.isArray(entity!.attributes.options) && entity!.attributes.options.length > 0;
    case 'airPerformerSpeed': return supports(entity!, 1);
    case 'glassDoorV2ShutterPos': return supports(entity!, 4) && typeof entity!.attributes.current_position === 'number';
    case 'shutterStop': return supports(entity!, 8);
    case 'tvOn': return supports(entity!, entity!.state === 'off' || entity!.state === 'standby' ? 128 : 256);
  }
}

export function applianceCommand(action: ApplianceAction, entity: HassEntity, value?: boolean | number | string) {
  if (!applianceAvailable(action, entity)) throw new Error(`${APPLIANCES[action].label} indisponible ou commande non prise en charge.`);
  let domain: string, service: string;
  let data: Record<string, unknown> = {};
  switch (action) {
    case 'airPerformerPower':
    case 'tvOn': {
      domain = action === 'tvOn' ? 'media_player' : 'fan';
      if (value !== undefined && typeof value !== 'boolean') throw new Error('Commande marche / arrêt invalide.');
      const off = entity.state === 'off' || entity.state === 'standby';
      service = (value === undefined ? off : value) ? 'turn_on' : 'turn_off';
      break;
    }
    case 'airPerformerMode': {
      domain = 'select'; service = 'select_option';
      const options = entity.attributes.options as string[];
      const option = value ?? options[(options.indexOf(entity.state) + 1) % options.length];
      if (typeof option !== 'string' || !options.includes(option)) throw new Error('Fonction de purification invalide.');
      data = { option };
      break;
    }
    case 'airPerformerSpeed': {
      domain = 'fan'; service = 'set_percentage';
      const step = entity.attributes.percentage_step;
      if (typeof step !== 'number' || step <= 0) throw new Error('Pas de vitesse du purificateur absent ou invalide.');
      const next = (entity.attributes.percentage ?? 0) + step;
      const percentage = value ?? (next > 100 ? step : next);
      if (typeof percentage !== 'number' || !Number.isFinite(percentage) || percentage < 0 || percentage > 100) throw new Error('Vitesse invalide.');
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
