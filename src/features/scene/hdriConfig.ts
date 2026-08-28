export interface HdriItem {
  id: string;
  name: string;
  url: string;
  type: 'hdr' | 'jpg';
}

export const HDRI_LIST: HdriItem[] = [
  { id: 'default', name: 'Ciel nuageux (Défaut) ⛅', url: '/environment/HDR_029_Sky_Cloudy_Bg.jpg', type: 'jpg' },

  // --- Nature, Forêts & Jardins ---
  { id: 'park_001', name: 'Allée d\'arbres & Parc arboré 🌳', url: '/environment/hdri/001_hdrmaps_com_free_10K.hdr', type: 'hdr' },
  { id: 'forest_clearing_034', name: 'Clairière sablonneuse en forêt 🌲', url: '/environment/hdri/034_hdrmaps_com_free_10K.hdr', type: 'hdr' },
  { id: 'waterfall_041', name: 'Cascade & Ruisseau en forêt 🏞️', url: '/environment/hdri/041_hdrmaps_com_free_10K.hdr', type: 'hdr' },
  { id: 'autumn_pond_043', name: 'Bord d\'étang & Couleurs d\'automne 🍂', url: '/environment/hdri/043_hdrmaps_com_free_10K.hdr', type: 'hdr' },
  { id: 'forest_path_045', name: 'Sentier de forêt ensoleillé 🌲☀️', url: '/environment/hdri/045_hdrmaps_com_free_10K.hdr', type: 'hdr' },
  { id: 'forest_slope', name: 'Sous-bois & Versant forestier 🌲', url: '/environment/hdri/forest_slope_1k.hdr', type: 'hdr' },
  { id: 'rooitou_park', name: 'Parc Rooitou sous le soleil 🌳', url: '/environment/hdri/rooitou_park_1k.hdr', type: 'hdr' },
  { id: 'canopy_lookout_173', name: 'Belvédère & Canopée forestière 🌲🔭', url: '/environment/hdri/173_hdrmaps_com_free_10K.hdr', type: 'hdr' },
  { id: 'park_lawn_192', name: 'Vallon herbeux & Transats en sous-bois 🌳', url: '/environment/hdri/192_hdrmaps_com_free_10K.hdr', type: 'hdr' },
  { id: 'forest_meadow_197', name: 'Prairie champêtre bordée de forêt 🌲🌾', url: '/environment/hdri/197_hdrmaps_com_free_10K.hdr', type: 'hdr' },

  // --- Campagne, Champs & Prairies ---
  { id: 'green_hills_111', name: 'Collines verdoyantes & Plein ciel ⛰️', url: '/environment/hdri/111_hdrmaps_com_free_10K.hdr', type: 'hdr' },
  { id: 'riverbed_127', name: 'Lit de rivière caillouteux & Montagnes 🏞️', url: '/environment/hdri/127_hdrmaps_com_free_10K.hdr', type: 'hdr' },
  { id: 'meadow_sunrise_151', name: 'Colline herbeuse & Prairie au lever du jour 🌾', url: '/environment/hdri/151_hdrmaps_com_free_10K.hdr', type: 'hdr' },
  { id: 'meadow_dusk_189', name: 'Grand pré verdoyant au crépuscule 🌾', url: '/environment/hdri/189_hdrmaps_com_free_10K.hdr', type: 'hdr' },
  { id: 'field_cloudy_194', name: 'Grand champ vert & Ciel nuageux 🌾☁️', url: '/environment/hdri/194_hdrmaps_com_free_10K.hdr', type: 'hdr' },
  { id: 'countryside_cumulus_196', name: 'Campagne estivale & Grands cumulus 🌾☀️', url: '/environment/hdri/196_hdrmaps_com_free_10K.hdr', type: 'hdr' },
  { id: 'lebombo', name: 'Savane & Prairie Lebombo 🌾', url: '/environment/hdri/lebombo_1k.hdr', type: 'hdr' },

  // --- Montagne & Hiver Enneigé ---
  { id: 'canyon_road_025', name: 'Route de montagne & Canyon 🏜️', url: '/environment/hdri/025_hdrmaps_com_free_10K.hdr', type: 'hdr' },
  { id: 'snow_cliff_044', name: 'Falaise côtière sous la neige ❄️🌊', url: '/environment/hdri/044_hdrmaps_com_free_10K.hdr', type: 'hdr' },
  { id: 'alpine_peaks_107', name: 'Pics alpins enneigés au coucher du soleil 🏔️', url: '/environment/hdri/107_hdrmaps_com_free_10K.hdr', type: 'hdr' },
  { id: 'frozen_lake_108', name: 'Lac gelé & Pont en hiver ❄️', url: '/environment/hdri/108_hdrmaps_com_free_10K.hdr', type: 'hdr' },
  { id: 'ski_slope_128', name: 'Piste de ski & Sommets enneigés ⛷️❄️', url: '/environment/hdri/128_hdrmaps_com_free_10K.hdr', type: 'hdr' },

  // --- Mer, Plage, Lacs & Horizons Marins ---
  { id: 'beach_pavilion_011', name: 'Esplanade & Pavillon de plage 🏖️', url: '/environment/hdri/011_hdrmaps_com_free_10K.hdr', type: 'hdr' },
  { id: 'sand_dunes_099', name: 'Dunes de sable au crépuscule 🌅', url: '/environment/hdri/099_hdrmaps_com_free_10K.hdr', type: 'hdr' },
  { id: 'ocean_mirror_140', name: 'Horizon marin & Miroir d\'eau calme 🌊🪞', url: '/environment/hdri/140_hdrmaps_com_free_10K.hdr', type: 'hdr' },
  { id: 'ocean_sunbeams_146', name: 'Océan miroir & Rayons de soleil 🌊✨', url: '/environment/hdri/146_hdrmaps_com_free_10K.hdr', type: 'hdr' },
  { id: 'jetty_waves_172', name: 'Digue rocheuse & Vagues marines 🌊🪨', url: '/environment/hdri/172_hdrmaps_com_free_10K.hdr', type: 'hdr' },
  { id: 'lake_pier_180', name: 'Ponton de bois sur lac paisible 🌉', url: '/environment/hdri/180_hdrmaps_com_free_10K.hdr', type: 'hdr' },
  { id: 'jetty_sun_181', name: 'Jetée côtière rocheuse & Eau scintillante 🌊☀️', url: '/environment/hdri/181_hdrmaps_com_free_10K.hdr', type: 'hdr' },
  { id: 'jetty_sunset_182', name: 'Jetée en bord de mer au coucher de soleil 🌊🌇', url: '/environment/hdri/182_hdrmaps_com_free_10K.hdr', type: 'hdr' },
  { id: 'jetty_twilight_183', name: 'Crépuscule marin depuis la digue 🌊🌌', url: '/environment/hdri/183_hdrmaps_com_free_10K.hdr', type: 'hdr' },
  { id: 'ocean_cloud_reflection_185', name: 'Ciel nuageux & Reflet océanique ☁️🌊', url: '/environment/hdri/185_hdrmaps_com_free_10K.hdr', type: 'hdr' },
  { id: 'venice_sunset', name: 'Coucher de soleil à Venise 🌇', url: '/environment/hdri/venice_sunset_1k.hdr', type: 'hdr' },

  // --- Ciel, Altitude & Nuages ---
  { id: 'blue_sky_sun_051', name: 'Dôme de ciel bleu & Plein soleil ☀️', url: '/environment/hdri/051_hdrmaps_com_free_10K.hdr', type: 'hdr' },
  { id: 'horizon_dawn_101', name: 'Horizon dégagé & Aube rosée 🌅', url: '/environment/hdri/101_hdrmaps_com_free_10K.hdr', type: 'hdr' },
  { id: 'above_clouds_flight_117', name: 'Vol au-dessus des nuages & Reliefs ☁️✈️', url: '/environment/hdri/117_hdrmaps_com_free_10K.hdr', type: 'hdr' },
  { id: 'cloud_sea_high_121', name: 'Mer de nuages & Haute altitude ☁️', url: '/environment/hdri/121_hdrmaps_com_free_10K.hdr', type: 'hdr' },
  { id: 'kiara_dawn', name: 'Aube dorée Kiara 🌅', url: '/environment/hdri/kiara_1_dawn_1k.hdr', type: 'hdr' },

  // --- Ville, Places, Nuit, Architecture & Studios ---
  { id: 'monument_snow_night_050', name: 'Monument & Ville sous la neige de nuit ❄️🌃', url: '/environment/hdri/050_hdrmaps_com_free_10K.hdr', type: 'hdr' },
  { id: 'village_night_158', name: 'Place de village méditerranéen de nuit 🌙🏮', url: '/environment/hdri/158_hdrmaps_com_free_10K.hdr', type: 'hdr' },
  { id: 'dikhololo_night', name: 'Dikhololo - Nuit étoilée & Camp 🌌', url: '/environment/hdri/dikhololo_night_1k.hdr', type: 'hdr' },
  { id: 'potsdamer_platz', name: 'Potsdamer Platz (Berlin) 🏙️', url: '/environment/hdri/potsdamer_platz_1k.hdr', type: 'hdr' },
  { id: 'ruins_overgrown_109', name: 'Ruines anciennes & Végétation 🏛️🌿', url: '/environment/hdri/109_hdrmaps_com_free_10K.hdr', type: 'hdr' },
  { id: 'empty_warehouse', name: 'Entrepôt industriel désaffecté 🏭', url: '/environment/hdri/empty_warehouse_01_1k.hdr', type: 'hdr' },
  { id: 'st_fagans_interior', name: 'Intérieur historique St Fagans 🏛️', url: '/environment/hdri/st_fagans_interior_1k.hdr', type: 'hdr' },
  { id: 'studio_small', name: 'Studio photo & Lumières douces 💡', url: '/environment/hdri/studio_small_03_1k.hdr', type: 'hdr' },
];

export function getRandomHdriId(): string {
  const index = Math.floor(Math.random() * HDRI_LIST.length);
  return HDRI_LIST[index].id;
}

export function getHdriById(id: string): HdriItem {
  return HDRI_LIST.find(h => h.id === id) || HDRI_LIST[0];
}
