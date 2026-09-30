export interface HdriItem {
  id: string;
  name: string;
  url: string;
  type: 'hdr' | 'jpg';
}

export const HDRI_LIST: HdriItem[] = [
  { id: 'default', name: 'Ciel nuageux (Défaut) ⛅', url: '/environment/HDR_029_Sky_Cloudy_Bg.jpg', type: 'jpg' },

  // --- Nature, Forêts, Sentiers & Jardins ---


  // --- Campagne, Champs, Prairies & Sports extérieurs ---

  // --- Montagne & Hiver Enneigé ---

  // --- Mer, Plage, Lacs & Horizons Marins ---

  // --- Ciel, Altitude, Dômes & HDRI-Skies ---
  { id: 'sky_cloudy_029', name: 'Ciel nuageux panoramique ⛅', url: '/environment/hdri/HDR_029_Sky_Cloudy.hdr', type: 'hdr' },

  // --- Ville, Rues, Architecture & Nuit ---
  { id: 'dikhololo_night', name: 'Dikhololo - Nuit étoilée & Camp 🌌', url: '/environment/hdri/dikhololo_night_1k.hdr', type: 'hdr' },

  // --- Studios photo & Intérieurs Design ---
  { id: 'fly_studio_05', name: 'Studio Fly à contraste élevé 5 💡🎥', url: '/environment/hdri/fly-studio-05_4K.hdr', type: 'hdr' },

  // --- Auto-generated city/environment HDRIs ---
  { id: 'adams_place_bridge_4k', name: 'adams place bridge 4k', url: '/environment/hdri/adams_place_bridge_4k.hdr', type: 'hdr' },
  { id: 'aristea_wreck_4k', name: 'aristea wreck 4k', url: '/environment/hdri/aristea_wreck_4k.hdr', type: 'hdr' },
  { id: 'autumn_field_4k', name: 'autumn field 4k', url: '/environment/hdri/autumn_field_4k.hdr', type: 'hdr' },
  { id: 'ballawley_park_4k', name: 'ballawley park 4k', url: '/environment/hdri/ballawley_park_4k.hdr', type: 'hdr' },
  { id: 'bethnal_green_entrance_4k', name: 'bethnal green entrance 4k', url: '/environment/hdri/bethnal_green_entrance_4k.hdr', type: 'hdr' },
  { id: 'blouberg_sunrise_1_4k', name: 'blouberg sunrise 1 4k', url: '/environment/hdri/blouberg_sunrise_1_4k.hdr', type: 'hdr' },
  { id: 'blouberg_sunrise_2_4k', name: 'blouberg sunrise 2 4k', url: '/environment/hdri/blouberg_sunrise_2_4k.hdr', type: 'hdr' },
  { id: 'cambridge_4k', name: 'cambridge 4k', url: '/environment/hdri/cambridge_4k.hdr', type: 'hdr' },
  { id: 'cave_wall_4k', name: 'cave wall 4k', url: '/environment/hdri/cave_wall_4k.hdr', type: 'hdr' },
  { id: 'cayley_interior_4k', name: 'cayley interior 4k', url: '/environment/hdri/cayley_interior_4k.hdr', type: 'hdr' },
  { id: 'christmas_photo_studio_03_4k', name: 'christmas photo studio 03 4k', url: '/environment/hdri/christmas_photo_studio_03_4k.hdr', type: 'hdr' },
  { id: 'circus_maximus_1_4k', name: 'circus maximus 1 4k', url: '/environment/hdri/circus_maximus_1_4k.hdr', type: 'hdr' },
  { id: 'docklands_02_4k', name: 'docklands 02 4k', url: '/environment/hdri/docklands_02_4k.hdr', type: 'hdr' },
  { id: 'dresden_moat_4k', name: 'dresden moat 4k', url: '/environment/hdri/dresden_moat_4k.hdr', type: 'hdr' },
  { id: 'dusseldorf_bridge_4k', name: 'dusseldorf bridge 4k', url: '/environment/hdri/dusseldorf_bridge_4k.hdr', type: 'hdr' },
  { id: 'emmarentia_4k', name: 'emmarentia 4k', url: '/environment/hdri/emmarentia_4k.hdr', type: 'hdr' },
  { id: 'epping_forest_01_4k', name: 'epping forest 01 4k', url: '/environment/hdri/epping_forest_01_4k.hdr', type: 'hdr' },
  { id: 'evening_meadow_4k', name: 'evening meadow 4k', url: '/environment/hdri/evening_meadow_4k.hdr', type: 'hdr' },
  { id: 'ferndale_studio_02_4k', name: 'ferndale studio 02 4k', url: '/environment/hdri/ferndale_studio_02_4k.hdr', type: 'hdr' },
  { id: 'ferndale_studio_10_4k', name: 'ferndale studio 10 4k', url: '/environment/hdri/ferndale_studio_10_4k.hdr', type: 'hdr' },
  { id: 'ferndale_studio_12_4k', name: 'ferndale studio 12 4k', url: '/environment/hdri/ferndale_studio_12_4k.hdr', type: 'hdr' },
  { id: 'green_sanctuary_4k', name: 'green sanctuary 4k', url: '/environment/hdri/green_sanctuary_4k.hdr', type: 'hdr' },

  { id: 'gym_entrance_4k', name: 'gym entrance 4k', url: '/environment/hdri/gym_entrance_4k.hdr', type: 'hdr' },
  { id: 'harties_4k', name: 'harties 4k', url: '/environment/hdri/harties_4k.hdr', type: 'hdr' },
  { id: 'homecoming_center_rooftop_4k', name: 'homecoming center rooftop 4k', url: '/environment/hdri/homecoming_center_rooftop_4k.hdr', type: 'hdr' },
  { id: 'horn_koppe_snow_4k', name: 'horn koppe snow 4k', url: '/environment/hdri/horn-koppe_snow_4k.hdr', type: 'hdr' },
  { id: 'lakeside_4k', name: 'lakeside 4k', url: '/environment/hdri/lakeside_4k.hdr', type: 'hdr' },
  { id: 'laufenurg_church_4k', name: 'laufenurg church 4k', url: '/environment/hdri/laufenurg_church_4k.hdr', type: 'hdr' },
  { id: 'lebombo_4k', name: 'lebombo 4k', url: '/environment/hdri/lebombo_4k.hdr', type: 'hdr' },
  { id: 'lilienstein_4k', name: 'lilienstein 4k', url: '/environment/hdri/lilienstein_4k.hdr', type: 'hdr' },
  { id: 'little_paris_eiffel_tower_4k', name: 'little paris eiffel tower 4k', url: '/environment/hdri/little_paris_eiffel_tower_4k.hdr', type: 'hdr' },
  { id: 'misty_pines_4k', name: 'misty pines 4k', url: '/environment/hdri/misty_pines_4k.hdr', type: 'hdr' },
  { id: 'modern_buildings_2_4k', name: 'modern buildings 2 4k', url: '/environment/hdri/modern_buildings_2_4k.hdr', type: 'hdr' },
  { id: 'modern_buildings_4k', name: 'modern buildings 4k', url: '/environment/hdri/modern_buildings_4k.hdr', type: 'hdr' },
  { id: 'modern_buildings_night_4k', name: 'modern buildings night 4k', url: '/environment/hdri/modern_buildings_night_4k.hdr', type: 'hdr' },
  { id: 'museumplein_4k', name: 'museumplein 4k', url: '/environment/hdri/museumplein_4k.hdr', type: 'hdr' },
  { id: 'noon_grass_4k', name: 'noon grass 4k', url: '/environment/hdri/noon_grass_4k.hdr', type: 'hdr' },
  { id: 'passendorf_snow_4k', name: 'passendorf snow 4k', url: '/environment/hdri/passendorf_snow_4k.hdr', type: 'hdr' },
  { id: 'pav_studio_02_4k', name: 'pav studio 02 4k', url: '/environment/hdri/pav_studio_02_4k.hdr', type: 'hdr' },
  { id: 'pergola_walkway_4k', name: 'pergola walkway 4k', url: '/environment/hdri/pergola_walkway_4k.hdr', type: 'hdr' },

  { id: 'pool_4k', name: 'pool 4k', url: '/environment/hdri/pool_4k.hdr', type: 'hdr' },
  { id: 'preller_drive_4k', name: 'preller drive 4k', url: '/environment/hdri/preller_drive_4k.hdr', type: 'hdr' },
  { id: 'qwantani_dusk_2_4k', name: 'qwantani dusk 2 4k', url: '/environment/hdri/qwantani_dusk_2_4k.hdr', type: 'hdr' },
  { id: 'qwantani_night_4k', name: 'qwantani night 4k', url: '/environment/hdri/qwantani_night_4k.hdr', type: 'hdr' },
  { id: 'qwantani_noon_4k', name: 'qwantani noon 4k', url: '/environment/hdri/qwantani_noon_4k.hdr', type: 'hdr' },
  { id: 'qwantani_sunset_4k', name: 'qwantani sunset 4k', url: '/environment/hdri/qwantani_sunset_4k.hdr', type: 'hdr' },
  { id: 'radkow_lake_4k', name: 'radkow lake 4k', url: '/environment/hdri/radkow_lake_4k.hdr', type: 'hdr' },

  { id: 'rathaus_4k', name: 'rathaus 4k', url: '/environment/hdri/rathaus_4k.hdr', type: 'hdr' },
  { id: 'red_hill_curve_4k', name: 'red hill curve 4k', url: '/environment/hdri/red_hill_curve_4k.hdr', type: 'hdr' },
  { id: 'red_hill_straight_4k', name: 'red hill straight 4k', url: '/environment/hdri/red_hill_straight_4k.hdr', type: 'hdr' },
  { id: 'red_wall_4k', name: 'red wall 4k', url: '/environment/hdri/red_wall_4k.hdr', type: 'hdr' },
  { id: 'river_alcove_4k', name: 'river alcove 4k', url: '/environment/hdri/river_alcove_4k.hdr', type: 'hdr' },
  { id: 'rogland_clear_night_4k', name: 'rogland clear night 4k', url: '/environment/hdri/rogland_clear_night_4k.hdr', type: 'hdr' },
  { id: 'roof_garden_4k', name: 'roof garden 4k', url: '/environment/hdri/roof_garden_4k.hdr', type: 'hdr' },
  { id: 'rooftop_night_4k', name: 'rooftop night 4k', url: '/environment/hdri/rooftop_night_4k.hdr', type: 'hdr' },
  { id: 'rosendal_plains_1_4k', name: 'rosendal plains 1 4k', url: '/environment/hdri/rosendal_plains_1_4k.hdr', type: 'hdr' },
  { id: 'sandflat_sunset', name: 'Sandflat Sunset', url: '/environment/hdri/Sandflat_Sunset.hdr', type: 'hdr' },
  { id: 'sandsloot_4k', name: 'sandsloot 4k', url: '/environment/hdri/sandsloot_4k.hdr', type: 'hdr' },
  { id: 'san_giuseppe_bridge_4k', name: 'san giuseppe bridge 4k', url: '/environment/hdri/san_giuseppe_bridge_4k.hdr', type: 'hdr' },
  { id: 'satara_night_4k', name: 'satara night 4k', url: '/environment/hdri/satara_night_4k.hdr', type: 'hdr' },
  { id: 'shanghai_bund_4k', name: 'shanghai bund 4k', url: '/environment/hdri/shanghai_bund_4k.hdr', type: 'hdr' },
  { id: 'simons_town_rocks_4k', name: 'simons town rocks 4k', url: '/environment/hdri/simons_town_rocks_4k.hdr', type: 'hdr' },
  { id: 'snowy_field_4k', name: 'snowy field 4k', url: '/environment/hdri/snowy_field_4k.hdr', type: 'hdr' },
  { id: 'solitude_night_4k', name: 'solitude night 4k', url: '/environment/hdri/solitude_night_4k.hdr', type: 'hdr' },
  { id: 'spaichingen_hill_4k', name: 'spaichingen hill 4k', url: '/environment/hdri/spaichingen_hill_4k.hdr', type: 'hdr' },
  { id: 'spiaggia_di_mondello_4k', name: 'spiaggia di mondello 4k', url: '/environment/hdri/spiaggia_di_mondello_4k.hdr', type: 'hdr' },
  { id: 'spruit_sunrise_4k', name: 'spruit sunrise 4k', url: '/environment/hdri/spruit_sunrise_4k.hdr', type: 'hdr' },
  { id: 'sundowner_overlook_4k', name: 'sundowner overlook 4k', url: '/environment/hdri/sundowner_overlook_4k.hdr', type: 'hdr' },

  { id: 'sunset_in_the_chalk_quarry_4k', name: 'sunset in the chalk quarry 4k', url: '/environment/hdri/sunset_in_the_chalk_quarry_4k.hdr', type: 'hdr' },
  { id: 'symmetrical_garden_02_4k', name: 'symmetrical garden 02 4k', url: '/environment/hdri/symmetrical_garden_02_4k.hdr', type: 'hdr' },
  { id: 'symmetrical_garden_4k', name: 'symmetrical garden 4k', url: '/environment/hdri/symmetrical_garden_4k.hdr', type: 'hdr' },
  { id: 'tcom_colorfulalley_colorful_alley_8k_hdri_sphere_paris', name: 'TCom ColorfulAlley colorful alley 8K hdri sphere PARIS', url: '/environment/hdri/TCom_ColorfulAlley_colorful_alley_8K_hdri_sphere-PARIS.hdr', type: 'hdr' },
  { id: 'tcom_norwayforest_8k_hdri_sphere', name: 'TCom NorwayForest 8K hdri sphere', url: '/environment/hdri/TCom_NorwayForest_8K_hdri_sphere.hdr', type: 'hdr' },
  { id: 'the_sky_is_on_fire_4k', name: 'the sky is on fire 4k', url: '/environment/hdri/the_sky_is_on_fire_4k.hdr', type: 'hdr' },
  { id: 'tiber_2_4k', name: 'tiber 2 4k', url: '/environment/hdri/tiber_2_4k.hdr', type: 'hdr' },
  { id: 'tiber_island_4k', name: 'tiber island 4k', url: '/environment/hdri/tiber_island_4k.hdr', type: 'hdr' },
  { id: 'tropical_beachstairs_8k', name: 'Tropical BeachStairs 8k', url: '/environment/hdri/Tropical_BeachStairs_8k.hdr', type: 'hdr' },
  { id: 'umhlanga_sunrise_4k', name: 'umhlanga sunrise 4k', url: '/environment/hdri/umhlanga_sunrise_4k.hdr', type: 'hdr' },
  { id: 'valley_of_desolation_4k', name: 'valley of desolation 4k', url: '/environment/hdri/valley_of_desolation_4k.hdr', type: 'hdr' },
  { id: 'viale_giuseppe_garibaldi_4k', name: 'viale giuseppe garibaldi 4k', url: '/environment/hdri/viale_giuseppe_garibaldi_4k.hdr', type: 'hdr' },
  { id: 'white_cliff_top_4k', name: 'white cliff top 4k', url: '/environment/hdri/white_cliff_top_4k.hdr', type: 'hdr' },
  { id: 'winter_evening_4k', name: 'winter evening 4k', url: '/environment/hdri/winter_evening_4k.hdr', type: 'hdr' },
  { id: 'wobbly_bridge_4k', name: 'wobbly bridge 4k', url: '/environment/hdri/wobbly_bridge_4k.hdr', type: 'hdr' },
  { id: 'wooden_lounge_4k', name: 'wooden lounge 4k', url: '/environment/hdri/wooden_lounge_4k.hdr', type: 'hdr' },
  { id: 'wooden_studio_07_4k', name: 'wooden studio 07 4k', url: '/environment/hdri/wooden_studio_07_4k.hdr', type: 'hdr' },
  { id: 'wooden_studio_11_4k', name: 'wooden studio 11 4k', url: '/environment/hdri/wooden_studio_11_4k.hdr', type: 'hdr' },
];

export function getRandomHdriId(): string {
  const index = Math.floor(Math.random() * HDRI_LIST.length);
  return HDRI_LIST[index].id;
}

export function getHdriById(id: string): HdriItem {
  return HDRI_LIST.find(h => h.id === id) || HDRI_LIST[0];
}
