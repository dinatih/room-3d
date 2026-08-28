export interface HdriItem {
  id: string;
  name: string;
  url: string;
  type: 'hdr' | 'jpg';
}

export const HDRI_LIST: HdriItem[] = [
  { id: 'default', name: 'Ciel nuageux (Défaut) ⛅', url: '/environment/HDR_029_Sky_Cloudy_Bg.jpg', type: 'jpg' },
  { id: 'dikhololo_night', name: 'Dikhololo Night 🌌', url: '/environment/hdri/dikhololo_night_1k.hdr', type: 'hdr' },
  { id: 'empty_warehouse', name: 'Entrepôt vide 🏭', url: '/environment/hdri/empty_warehouse_01_1k.hdr', type: 'hdr' },
  { id: 'forest_slope', name: 'Forêt en pente 🌲', url: '/environment/hdri/forest_slope_1k.hdr', type: 'hdr' },
  { id: 'kiara_dawn', name: 'Aube Kiara 🌅', url: '/environment/hdri/kiara_1_dawn_1k.hdr', type: 'hdr' },
  { id: 'lebombo', name: 'Lebombo 🌾', url: '/environment/hdri/lebombo_1k.hdr', type: 'hdr' },
  { id: 'potsdamer_platz', name: 'Potsdamer Platz (Ville) 🏙️', url: '/environment/hdri/potsdamer_platz_1k.hdr', type: 'hdr' },
  { id: 'rooitou_park', name: 'Parc Rooitou 🌳', url: '/environment/hdri/rooitou_park_1k.hdr', type: 'hdr' },
  { id: 'st_fagans_interior', name: 'Intérieur St Fagans 🏛️', url: '/environment/hdri/st_fagans_interior_1k.hdr', type: 'hdr' },
  { id: 'studio_small', name: 'Petit Studio 💡', url: '/environment/hdri/studio_small_03_1k.hdr', type: 'hdr' },
  { id: 'venice_sunset', name: 'Coucher de soleil Venise 🌇', url: '/environment/hdri/venice_sunset_1k.hdr', type: 'hdr' },
];

export function getRandomHdriId(): string {
  const index = Math.floor(Math.random() * HDRI_LIST.length);
  return HDRI_LIST[index].id;
}

export function getHdriById(id: string): HdriItem {
  return HDRI_LIST.find(h => h.id === id) || HDRI_LIST[0];
}
