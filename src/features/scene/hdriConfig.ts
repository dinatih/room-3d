export type HdriResolution = '2k' | '4k' | '8k';

export interface HdriItem {
  id: string;
  name: string;
  url: string;
  /** Panorama HDR 2048 × 1024 chargé sur mobile. */
  mobileUrl: string;
  /** Panorama HDR 4096 × 2048. */
  url4k: string;
  type: 'hdr' | 'jpg';
  /** Intensité de l'environnement IBL (Three.js scene.environmentIntensity).
   * Les JPGs (LDR 8-bit) nécessitent un multiplicateur plus élevé (~2.5 à 3.2) pour égaler la luminosité diffuse des HDRIs. */
  environmentIntensity?: number;
  /** Intensité de la lumière ambiante associée à cette ambiance (défaut : 0.6). */
  ambientIntensity?: number;
  /** Couleur de la lumière ambiante (défaut : 0x8899bb). */
  ambientColor?: number | string;
  /** Couleur de la lumière directionnelle principale (défaut : 0xfff5e0). */
  directionalColor?: number | string;
  /** Intensité de la lumière directionnelle principale (défaut : 1.8). */
  directionalIntensity?: number;
  /** Position de la lumière directionnelle principale (défaut : [500, 700, 400]). */
  directionalPosition?: [number, number, number];
}

export const HDRI_LIST: HdriItem[] = [
  {
    id: 'default',
    name: 'Ciel Paris 🌤️',
    url: '/environment/hdri/ciel_paris_8k.hdr',
    mobileUrl: '/environment/hdri/2k/ciel_paris_8k.hdr', url4k: '/environment/hdri/4k/ciel_paris_8k.hdr',
    type: 'hdr',
  },

  { id: 'dikhololo_night', name: 'Nuit étoilée & Camp 🌌', url: '/environment/hdri/dikhololo_night_8k.hdr', mobileUrl: '/environment/hdri/2k/dikhololo_night_8k.hdr', url4k: '/environment/hdri/4k/dikhololo_night_8k.hdr', type: 'hdr' },
  { id: 'rogland_clear_night_4k', name: 'rogland clear night', url: '/environment/hdri/rogland_clear_night_8k.hdr', mobileUrl: '/environment/hdri/2k/rogland_clear_night_8k.hdr', url4k: '/environment/hdri/4k/rogland_clear_night_8k.hdr', type: 'hdr' },
  { id: 'kloofendal_48d_partly_cloudy_puresky_4k', name: 'Partly cloudy puresky', url: '/environment/hdri/kloofendal_48d_partly_cloudy_puresky_8k.hdr', mobileUrl: '/environment/hdri/2k/kloofendal_48d_partly_cloudy_puresky_8k.hdr', url4k: '/environment/hdri/4k/kloofendal_48d_partly_cloudy_puresky_8k.hdr', type: 'hdr' },
  { id: 'sandsloot_4k', name: 'sandsloot', url: '/environment/hdri/sandsloot_8k.hdr', mobileUrl: '/environment/hdri/2k/sandsloot_8k.hdr', url4k: '/environment/hdri/4k/sandsloot_8k.hdr', type: 'hdr' },
  { id: 'spiaggia_di_mondello_4k', name: 'spiaggia di mondello', url: '/environment/hdri/spiaggia_di_mondello_8k.hdr', mobileUrl: '/environment/hdri/2k/spiaggia_di_mondello_8k.hdr', url4k: '/environment/hdri/4k/spiaggia_di_mondello_8k.hdr', type: 'hdr' },
  { id: 'tcom_colorfulalley_colorful_alley_8k_hdri_sphere_paris', name: 'Colorful alley', url: '/environment/hdri/TCom_ColorfulAlley_colorful_alley_8K_hdri_sphere.hdr', mobileUrl: '/environment/hdri/2k/TCom_ColorfulAlley_colorful_alley_8K_hdri_sphere.hdr', url4k: '/environment/hdri/4k/TCom_ColorfulAlley_colorful_alley_8K_hdri_sphere.hdr', type: 'hdr' },
  { id: 'tcom_norwayforest_8k_hdri_sphere', name: 'Norway Forest', url: '/environment/hdri/TCom_NorwayForest_8K_hdri_sphere.hdr', mobileUrl: '/environment/hdri/2k/TCom_NorwayForest_8K_hdri_sphere.hdr', url4k: '/environment/hdri/4k/TCom_NorwayForest_8K_hdri_sphere.hdr', type: 'hdr' },
];

export const DEFAULT_HDRI_ID = 'default';

export function getRandomHdriId(): string {
  const index = Math.floor(Math.random() * HDRI_LIST.length);
  return HDRI_LIST[index].id;
}

export function getHdriById(id: string): HdriItem {
  return HDRI_LIST.find(h => h.id === id) || HDRI_LIST[0];
}

export function getHdriUrl(hdri: HdriItem, resolution: HdriResolution): string {
  switch (resolution) {
    case '2k': return hdri.mobileUrl;
    case '4k': return hdri.url4k;
    case '8k': return hdri.url;
  }
}
