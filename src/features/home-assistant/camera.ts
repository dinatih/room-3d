import type { HassEntity } from 'home-assistant-js-websocket';
import type { HomeAssistantRegistries } from './connection';

export interface CameraLookupResult {
  entity: HassEntity | null;
  needsRegistry: boolean;
  cameras: HassEntity[];
}

function normalizeCameraSearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function cameraStreamPriority(entity: HassEntity): number {
  const id = entity.entity_id.toLowerCase();
  let score = 0;
  if (id.includes('snapshot')) score += 100;
  if (entity.state === 'unavailable' || entity.state === 'unknown') score += 50;
  if (id.endsWith('_fluent') || id.endsWith('_sub')) score -= 10;
  else if (id.endsWith('_clear') || id.endsWith('_main')) score += 5;
  return score;
}

/**
 * Trouve l'entité Home Assistant correspondant à la caméra 360 du séjour.
 * Utilise en priorité l'identifiant et le friendly_name, puis le registre appareil/pièce si fourni.
 */
export function findLivingRoom360Camera(
  entities: Record<string, HassEntity>,
  registries?: HomeAssistantRegistries | null,
): CameraLookupResult {
  const cameras = Object.values(entities)
    .filter(entity => entity.entity_id.startsWith('camera.'))
    .sort((a, b) => a.entity_id.localeCompare(b.entity_id));

  if (cameras.length === 0) {
    return { entity: null, needsRegistry: false, cameras };
  }

  const matches = cameras.filter(entity => {
    const parts = [entity.entity_id, String(entity.attributes.friendly_name ?? '')];
    if (registries) {
      const regEntity = registries.entities.find(item => item.entity_id === entity.entity_id);
      const regDevice = regEntity?.device_id ? registries.devices.find(item => item.id === regEntity.device_id) : undefined;
      const areaId = regEntity?.area_id ?? regDevice?.area_id;
      const regArea = areaId ? registries.areas.find(item => item.area_id === areaId) : undefined;
      parts.push(
        regEntity?.name ?? '',
        regDevice?.name_by_user ?? '',
        regDevice?.name ?? '',
        regDevice?.model ?? '',
        regArea?.name ?? '',
      );
    }
    const text = normalizeCameraSearchText(parts.join(' '));
    const has360 = /\b(360|fisheye|fe w|few)\b/.test(text);
    const hasLivingRoom = /\b(sejour|salon)\b/.test(text);
    return has360 && hasLivingRoom;
  });

  if (matches.length > 0) {
    matches.sort((a, b) => cameraStreamPriority(a) - cameraStreamPriority(b) || a.entity_id.localeCompare(b.entity_id));
    return { entity: matches[0], needsRegistry: false, cameras };
  }

  return { entity: null, needsRegistry: !registries, cameras };
}

export function homeAssistantCameraStreamUrl(hassUrl: string | null, entity: HassEntity | null): string | null {
  if (!hassUrl || !entity) return null;
  const token = typeof entity.attributes.access_token === 'string' ? entity.attributes.access_token : null;
  if (!token) return null;
  return `${hassUrl.replace(/\/$/, '')}/api/camera_proxy_stream/${encodeURIComponent(entity.entity_id)}?token=${encodeURIComponent(token)}`;
}
