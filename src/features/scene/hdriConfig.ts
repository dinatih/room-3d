export interface HdriItem {
  id: string;
  name: string;
  url: string;
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
    type: 'hdr',
  },

  { id: 'dikhololo_night', name: 'Nuit étoilée & Camp 🌌', url: '/environment/hdri/dikhololo_night_8k.hdr', type: 'hdr' },
  { id: 'ferndale_studio_10_4k', name: 'ferndale studio 10 4k', url: '/environment/hdri/ferndale_studio_10_4k.hdr', type: 'hdr' },
  { id: 'misty_pines_4k', name: 'misty pines 8k', url: '/environment/hdri/misty_pines_8k.hdr', type: 'hdr' },
  { id: 'pool_4k', name: 'pool 8k', url: '/environment/hdri/pool_8k.hdr', type: 'hdr' },
  { id: 'rogland_clear_night_4k', name: 'rogland clear night 8k', url: '/environment/hdri/rogland_clear_night_8k.hdr', type: 'hdr' },
  { id: 'rogland_moonlit_night_4k', name: 'rogland moonlit night 8k', url: '/environment/hdri/rogland_moonlit_night_8k.hdr', type: 'hdr' },
  { id: 'kloofendal_48d_partly_cloudy_puresky_4k', name: 'Partly cloudy puresky 8k', url: '/environment/hdri/kloofendal_48d_partly_cloudy_puresky_8k.hdr', type: 'hdr' },
  { id: 'industrial_sunset_02_puresky_4k', name: 'Sunset puresky', url: '/environment/hdri/industrial_sunset_02_puresky_4k.hdr', type: 'hdr' },
  { id: 'sandsloot_4k', name: 'sandsloot 8k', url: '/environment/hdri/sandsloot_8k.hdr', type: 'hdr' },
  { id: 'satara_night_4k', name: 'satara night 4k', url: '/environment/hdri/satara_night_4k.hdr', type: 'hdr' },
  { id: 'spiaggia_di_mondello_4k', name: 'spiaggia di mondello 8k', url: '/environment/hdri/spiaggia_di_mondello_8k.hdr', type: 'hdr' },
  { id: 'tcom_colorfulalley_colorful_alley_8k_hdri_sphere_paris', name: 'Colorful alley 8k', url: '/environment/hdri/TCom_ColorfulAlley_colorful_alley_8K_hdri_sphere.hdr', type: 'hdr' },
  { id: 'tcom_norwayforest_8k_hdri_sphere', name: 'Norway Forest', url: '/environment/hdri/TCom_NorwayForest_8K_hdri_sphere.hdr', type: 'hdr' },
  { id: 'tropical_beachstairs_8k', name: 'Tropical BeachStairs 8k', url: '/environment/hdri/Tropical_BeachStairs_8k.hdr', type: 'hdr' },
  { id: 'ferndale_studio_06_8k', name: 'ferndale studio 06 8k', url: '/environment/hdri/ferndale_studio_06_8k.hdr', type: 'hdr' },
  { id: 'shanghai_bund_8k', name: 'shanghai bund 8k', url: '/environment/hdri/shanghai_bund_8k.hdr', type: 'hdr' },
  { id: 'qwantani_moonrise_8k', name: 'qwantani moonrise 8k', url: '/environment/hdri/qwantani_moonrise_8k.hdr', type: 'hdr' },
  { id: 'qwantani_night_8k', name: 'qwantani night 8k', url: '/environment/hdri/qwantani_night_8k.hdr', type: 'hdr' },
  { id: 'pond_8k', name: 'pond 8k', url: '/environment/hdri/pond_8k.hdr', type: 'hdr' },
  { id: 'lakeside_8k', name: 'lakeside 8k', url: '/environment/hdri/lakeside_8k.hdr', type: 'hdr' },
  { id: 'lakeside_night_8k', name: 'lakeside night 8k', url: '/environment/hdri/lakeside_night_8k.hdr', type: 'hdr' },
  { id: 'garden_nook_8k', name: 'garden nook 8k', url: '/environment/hdri/garden_nook_8k.hdr', type: 'hdr' },
  { id: 'crystal_falls_8k', name: 'crystal falls 8k', url: '/environment/hdri/crystal_falls_8k.hdr', type: 'hdr' },
  { id: 'muddy_autumn_forest_8k', name: 'muddy autumn forest 8k', url: '/environment/hdri/muddy_autumn_forest_8k.hdr', type: 'hdr' },
  { id: 'horn-koppe_spring_8k', name: 'horn-koppe spring 8k', url: '/environment/hdri/horn-koppe_spring_8k.hdr', type: 'hdr' },
  { id: 'meadow_2_8k', name: 'meadow 2 8k', url: '/environment/hdri/meadow_2_8k.hdr', type: 'hdr' },
  { id: 'spaichingen_hill_8k', name: 'spaichingen hill 8k', url: '/environment/hdri/spaichingen_hill_8k.hdr', type: 'hdr' },
  { id: 'hilly_terrain_01_8k', name: 'hilly terrain 01 8k', url: '/environment/hdri/hilly_terrain_01_8k.hdr', type: 'hdr' },
  { id: 'qwantani_night_puresky_8k', name: 'qwantani night puresky 8k', url: '/environment/hdri/qwantani_night_puresky_8k.hdr', type: 'hdr' },
  { id: 'qwantani_moonrise_puresky_8k', name: 'qwantani moonrise puresky 8k', url: '/environment/hdri/qwantani_moonrise_puresky_8k.hdr', type: 'hdr' },
  { id: 'qwantani_moon_noon_puresky_8k', name: 'qwantani moon noon puresky 8k', url: '/environment/hdri/qwantani_moon_noon_puresky_8k.hdr', type: 'hdr' },
  { id: 'kloppenheim_06_puresky_8k', name: 'kloppenheim 06 puresky 8k', url: '/environment/hdri/kloppenheim_06_puresky_8k.hdr', type: 'hdr' },
  { id: 'mud_road_puresky_8k', name: 'mud road puresky 8k', url: '/environment/hdri/mud_road_puresky_8k.hdr', type: 'hdr' },
  { id: 'overcast_soil_puresky_8k', name: 'overcast soil puresky 8k', url: '/environment/hdri/overcast_soil_puresky_8k.hdr', type: 'hdr' },
  { id: 'adobestock_162298157', name: 'Tropical Cemetery B', url: '/environment/hdri/Tropical_Cemetery_B_8k.hdr', type: 'hdr' },
  { id: 'adobestock_162297115', name: 'Concrete Bowl', url: '/environment/hdri/Concrete_Bowl_8k.hdr', type: 'hdr' },
  { id: 'adobestock_162297233', name: 'Halle Skyline', url: '/environment/hdri/Halle_Skyline.hdr', type: 'hdr' },
];

export const DEFAULT_HDRI_ID = 'default';

export function getRandomHdriId(): string {
  const index = Math.floor(Math.random() * HDRI_LIST.length);
  return HDRI_LIST[index].id;
}

export function getHdriById(id: string): HdriItem {
  return HDRI_LIST.find(h => h.id === id) || HDRI_LIST[0];
}
