export interface NameDevice {
  id: string;
  name: string | null;
  name_by_user: string | null;
  identifiers: [string, string][];
  area_id: string | null;
  model: string | null;
}
export interface NameEntity { device_id: string | null; platform: string; entity_id: string; name: string | null }
export interface NameArea { area_id: string; name: string }

export function compareTuyaNames(devices: NameDevice[], entities: NameEntity[], areas: NameArea[]) {
  return devices.filter(device => device.identifiers.some(([domain]) => domain === 'tuya')).map(device => {
    const tuyaName = device.name;
    const haName = device.name_by_user ?? tuyaName;
    return {
      id: device.id, tuyaName, haName, different: tuyaName !== haName,
      area: areas.find(area => area.area_id === device.area_id)?.name ?? 'Sans pièce',
      model: device.model,
      entities: entities.filter(entity => entity.device_id === device.id && entity.platform === 'tuya' && entity.name),
    };
  }).sort((a, b) => Number(b.different) - Number(a.different) || (a.haName ?? '').localeCompare(b.haName ?? '', 'fr'));
}
