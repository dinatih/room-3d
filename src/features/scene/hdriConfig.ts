export interface HdriItem {
  id: string;
  name: string;
  url: string;
  type: 'hdr' | 'jpg';
}

export const HDRI_LIST: HdriItem[] = [
  { id: 'default', name: 'Ciel nuageux (Défaut) ⛅', url: '/environment/HDR_029_Sky_Cloudy_Bg.jpg', type: 'jpg' },

  // --- Nature, Forêts, Sentiers & Jardins ---
  { id: 'park_001', name: 'Allée d\'arbres & Parc arboré 🌳', url: '/environment/hdri/001_hdrmaps_com_free_10K.hdr', type: 'hdr' },
  { id: 'forest_clearing_034', name: 'Clairière sablonneuse en forêt 🌲', url: '/environment/hdri/034_hdrmaps_com_free_10K.hdr', type: 'hdr' },
  { id: 'waterfall_041', name: 'Cascade & Ruisseau en forêt 🏞️', url: '/environment/hdri/041_hdrmaps_com_free_10K.hdr', type: 'hdr' },
  { id: 'autumn_pond_043', name: 'Bord d\'étang & Couleurs d\'automne 🍂', url: '/environment/hdri/043_hdrmaps_com_free_10K.hdr', type: 'hdr' },
  { id: 'forest_path_045', name: 'Sentier de forêt ensoleillé 🌲☀️', url: '/environment/hdri/045_hdrmaps_com_free_10K.hdr', type: 'hdr' },
  { id: 'path_041', name: 'Sentier de terre arboré 🌲🚶', url: '/environment/hdri/HDR_041_Path.hdr', type: 'hdr' },
  { id: 'forest_slope', name: 'Sous-bois & Versant forestier 🌲', url: '/environment/hdri/forest_slope_1k.hdr', type: 'hdr' },
  { id: 'rooitou_park', name: 'Parc Rooitou sous le soleil 🌳', url: '/environment/hdri/rooitou_park_1k.hdr', type: 'hdr' },
  { id: 'canopy_lookout_173', name: 'Belvédère & Canopée forestière 🌲🔭', url: '/environment/hdri/173_hdrmaps_com_free_10K.hdr', type: 'hdr' },
  { id: 'park_lawn_192', name: 'Vallon herbeux & Transats en sous-bois 🌳', url: '/environment/hdri/192_hdrmaps_com_free_10K.hdr', type: 'hdr' },
  { id: 'forest_meadow_197', name: 'Prairie champêtre bordée de forêt 🌲🌾', url: '/environment/hdri/197_hdrmaps_com_free_10K.hdr', type: 'hdr' },
  { id: 'autumn_bridge_arch', name: 'Pont d\'automne & Arche de pierre 🍂🌉', url: '/environment/hdri/autumn-bridge-arch_4K.hdr', type: 'hdr' },
  { id: 'egg_hill_valley', name: 'Colline Egg Hill & Vue sur la vallée 🌄🌲', url: '/environment/hdri/egg-hill-distant-valley-glow_4K.hdr', type: 'hdr' },
  { id: 'gruntowa_golden_hour', name: 'Chemin Gruntowa à l\'heure dorée 🌅🌾', url: '/environment/hdri/gruntowa-april-golden-hour_4K.hdr', type: 'hdr' },
  { id: 'gruntowa_pre_sunset', name: 'Chemin Gruntowa avant le crépuscule 🌇🌾', url: '/environment/hdri/gruntowa-april-pre-sunset_4K.hdr', type: 'hdr' },
  { id: 'gruntowa_may_cumulus', name: 'Chemin Gruntowa & Cumulus de mai 🌾☁️', url: '/environment/hdri/gruntowa-may-cumulus_4K.hdr', type: 'hdr' },
  { id: 'jugow_glowna_overcast', name: 'Jugów Główna sous ciel couvert 🌲🌥️', url: '/environment/hdri/jugow-glowna-overcast_4K.hdr', type: 'hdr' },
  { id: 'jugow_jana_overcast', name: 'Jugów Jana & Forêt brumeuse 🌲☁️', url: '/environment/hdri/jugow-jana-overcast_4K.hdr', type: 'hdr' },
  { id: 'molke_sunny_road', name: 'Route ensoleillée de Molke 🌲☀️', url: '/environment/hdri/molke-sunny-road_4K.hdr', type: 'hdr' },
  { id: 'naroznik_autumn_haze', name: 'Narożnik & Brume automnale 🍂🌫️', url: '/environment/hdri/naroznik-autumn-haze_4K.hdr', type: 'hdr' },
  { id: 'pilgrim_farmland', name: 'Terres de pèlerinage au soleil d\'octobre 🌾☀️', url: '/environment/hdri/pilgrim-farmland-october-sun_4K.hdr', type: 'hdr' },
  { id: 'polanica_bandshell', name: 'Kiosque de Polanica au matin 🌳🏛️', url: '/environment/hdri/polanica-bandshell-morning_4K.hdr', type: 'hdr' },
  { id: 'polanica_fountain_square', name: 'Place de la fontaine à Polanica ⛲🌳', url: '/environment/hdri/polanica-fountain-square_4K.hdr', type: 'hdr' },
  { id: 'polanica_fountain_terrace', name: 'Terrasse fleurie & Fontaine Polanica ⛲🌺', url: '/environment/hdri/polanica-fountain-terrace_4K.hdr', type: 'hdr' },
  { id: 'rock_theatre_viewpoint', name: 'Belvédère du théâtre de roche 🪨🌲', url: '/environment/hdri/rock-theatre-viewpoint_4K.hdr', type: 'hdr' },
  { id: 'skarpa_winter_forest', name: 'Forêt d\'hiver Skarpa ❄️🌲', url: '/environment/hdri/skarpa-winter-forest_4K.hdr', type: 'hdr' },
  { id: 'sunlit_castle_fountain', name: 'Fontaine de château baignée de soleil 🏰⛲', url: '/environment/hdri/sunlit-castle-fountain_4K.hdr', type: 'hdr' },
  { id: 'zum_bergkeller_ruins', name: 'Ruines de Zum Bergkeller en forêt 🏛️🌿', url: '/environment/hdri/zum-bergkeller-ruins_4K.hdr', type: 'hdr' },

  // --- Campagne, Champs, Prairies & Sports extérieurs ---
  { id: 'field_040', name: 'Vaste champ champêtre 🌾☀️', url: '/environment/hdri/HDR_040_Field.hdr', type: 'hdr' },
  { id: 'green_hills_111', name: 'Collines verdoyantes & Plein ciel ⛰️', url: '/environment/hdri/111_hdrmaps_com_free_10K.hdr', type: 'hdr' },
  { id: 'riverbed_127', name: 'Lit de rivière caillouteux & Montagnes 🏞️', url: '/environment/hdri/127_hdrmaps_com_free_10K.hdr', type: 'hdr' },
  { id: 'meadow_sunrise_151', name: 'Colline herbeuse & Prairie au lever du jour 🌾', url: '/environment/hdri/151_hdrmaps_com_free_10K.hdr', type: 'hdr' },
  { id: 'meadow_dusk_189', name: 'Grand pré verdoyant au crépuscule 🌾', url: '/environment/hdri/189_hdrmaps_com_free_10K.hdr', type: 'hdr' },
  { id: 'field_cloudy_194', name: 'Grand champ vert & Ciel nuageux 🌾☁️', url: '/environment/hdri/194_hdrmaps_com_free_10K.hdr', type: 'hdr' },
  { id: 'countryside_cumulus_196', name: 'Campagne estivale & Grands cumulus 🌾☀️', url: '/environment/hdri/196_hdrmaps_com_free_10K.hdr', type: 'hdr' },
  { id: 'lebombo', name: 'Savane & Prairie Lebombo 🌾', url: '/environment/hdri/lebombo_1k.hdr', type: 'hdr' },
  { id: 'baseball_field_day', name: 'Terrain de baseball sous ciel clair ⚾🏟️', url: '/environment/hdri/HdrOutdoorFieldBaseballDayClear001_8k.hdr', type: 'hdr' },
  { id: 'sports_field_overcast', name: 'Grand terrain de sport sous ciel couvert 🏟️☁️', url: '/environment/hdri/HdrOutdoorFieldDayOvercast004_8k.hdr', type: 'hdr' },
  { id: 'soccer_field_winter', name: 'Terrain de football en hiver ⚽❄️', url: '/environment/hdri/HdrOutdoorSoccerFieldWinterDayClear001_8k.hdr', type: 'hdr' },
  { id: 'rafalonka_winter_meadow', name: 'Prairie d\'hiver Rafałonka ❄️🌾', url: '/environment/hdri/rafalonka-winter-meadow_4K.hdr', type: 'hdr' },
  { id: 'rubinkowo_sandbox', name: 'Espace sableux Rubinkowo 🏖️🌥️', url: '/environment/hdri/rubinkowo-sandbox-overcast_4K.hdr', type: 'hdr' },

  // --- Montagne & Hiver Enneigé ---
  { id: 'canyon_road_025', name: 'Route de montagne & Canyon 🏜️', url: '/environment/hdri/025_hdrmaps_com_free_10K.hdr', type: 'hdr' },
  { id: 'snow_cliff_044', name: 'Falaise côtière sous la neige ❄️🌊', url: '/environment/hdri/044_hdrmaps_com_free_10K.hdr', type: 'hdr' },
  { id: 'alpine_peaks_107', name: 'Pics alpins enneigés au coucher du soleil 🏔️', url: '/environment/hdri/107_hdrmaps_com_free_10K.hdr', type: 'hdr' },
  { id: 'frozen_lake_108', name: 'Lac gelé & Pont en hiver ❄️', url: '/environment/hdri/108_hdrmaps_com_free_10K.hdr', type: 'hdr' },
  { id: 'ski_slope_128', name: 'Piste de ski & Sommets enneigés ⛷️❄️', url: '/environment/hdri/128_hdrmaps_com_free_10K.hdr', type: 'hdr' },
  { id: 'snow_mountains_evening', name: 'Montagnes enneigées au crépuscule 🏔️❄️', url: '/environment/hdri/HdrOutdoorSnowMountainsEveningClear001_8k.hdr', type: 'hdr' },
  { id: 'frozen_river_overcast', name: 'Rivière gelée sous ciel couvert ❄️🌊', url: '/environment/hdri/overcast-frozen-river_4K.hdr', type: 'hdr' },

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
  { id: 'river_road_112', name: 'Route côtière le long du fleuve 🌊🛣️', url: '/environment/hdri/HDR_112_River_Road_2.hdr', type: 'hdr' },
  { id: 'harbor_3', name: 'Port maritime & Quais ⛵⚓', url: '/environment/hdri/Harbor_3_Free.hdr', type: 'hdr' },

  // --- Ciel, Altitude, Dômes & HDRI-Skies ---
  { id: 'blue_sky_sun_051', name: 'Dôme de ciel bleu & Plein soleil ☀️', url: '/environment/hdri/051_hdrmaps_com_free_10K.hdr', type: 'hdr' },
  { id: 'horizon_dawn_101', name: 'Horizon dégagé & Aube rosée 🌅', url: '/environment/hdri/101_hdrmaps_com_free_10K.hdr', type: 'hdr' },
  { id: 'above_clouds_flight_117', name: 'Vol au-dessus des nuages & Reliefs ☁️✈️', url: '/environment/hdri/117_hdrmaps_com_free_10K.hdr', type: 'hdr' },
  { id: 'cloud_sea_high_121', name: 'Mer de nuages & Haute altitude ☁️', url: '/environment/hdri/121_hdrmaps_com_free_10K.hdr', type: 'hdr' },
  { id: 'kiara_dawn', name: 'Aube dorée Kiara 🌅', url: '/environment/hdri/kiara_1_dawn_1k.hdr', type: 'hdr' },
  { id: 'sky_cloudy_029', name: 'Ciel nuageux panoramique ⛅', url: '/environment/hdri/HDR_029_Sky_Cloudy.hdr', type: 'hdr' },
  { id: 'sky_749', name: 'Ciel d\'azur & Nuages légers 749 ☀️', url: '/environment/hdri/749-hdri-skies-com.hdr', type: 'hdr' },
  { id: 'sky_750', name: 'Ciel d\'été limpide 750 🌤️', url: '/environment/hdri/750-hdri-skies-com.hdr', type: 'hdr' },
  { id: 'sky_751', name: 'Ciel d\'après-midi ensoleillé 751 ☀️', url: '/environment/hdri/751-hdri-skies-com.hdr', type: 'hdr' },
  { id: 'sky_752', name: 'Ciel doux & Voile nuageux 752 ⛅', url: '/environment/hdri/752-hdri-skies-com.hdr', type: 'hdr' },
  { id: 'sky_753', name: 'Horizon dégagé & Cirrus 753 🌤️', url: '/environment/hdri/753-hdri-skies-com.hdr', type: 'hdr' },
  { id: 'sky_754', name: 'Ciel bleu éclatant 754 ☀️', url: '/environment/hdri/754-hdri-skies-com.hdr', type: 'hdr' },
  { id: 'sky_755', name: 'Dôme céleste immaculé 755 🌤️', url: '/environment/hdri/755-hdri-skies-com.hdr', type: 'hdr' },
  { id: 'sky_756', name: 'Ciel lumineux & Légère brume 756 ☀️', url: '/environment/hdri/756-hdri-skies-com.hdr', type: 'hdr' },
  { id: 'sky_758', name: 'Ciel d\'été & Cumulus épars 758 ⛅', url: '/environment/hdri/758-hdri-skies-com.hdr', type: 'hdr' },
  { id: 'sky_759', name: 'Ciel radieux & Horizon vaste 759 🌤️', url: '/environment/hdri/759-hdri-skies-com.hdr', type: 'hdr' },
  { id: 'sky_763', name: 'Ciel chaud de mi-journée 763 ☀️', url: '/environment/hdri/763-hdri-skies-com.hdr', type: 'hdr' },
  { id: 'sky_764', name: 'Ciel clair & Ambiance solaire 764 🌤️', url: '/environment/hdri/764-hdri-skies-com.hdr', type: 'hdr' },
  { id: 'sky_765', name: 'Dôme azuréen & Nuages fins 765 ⛅', url: '/environment/hdri/765-hdri-skies-com.hdr', type: 'hdr' },
  { id: 'sky_789', name: 'Ciel doré de fin d\'après-midi 789 🌅', url: '/environment/hdri/789-hdri-skies-com.hdr', type: 'hdr' },
  { id: 'sky_790', name: 'Ciel dramatique & Nuages denses 790 🌥️', url: '/environment/hdri/790-hdri-skies-com.hdr', type: 'hdr' },
  { id: 'sky_791', name: 'Ciel couvert & Lumière diffuse 791 ☁️', url: '/environment/hdri/791-hdri-skies-com.hdr', type: 'hdr' },
  { id: 'sky_802', name: 'Coucher de soleil ardent 802 🌇', url: '/environment/hdri/802-hdri-skies-com.hdr', type: 'hdr' },
  { id: 'sky_803', name: 'Ciel crépusculaire flamboyant 803 🌅', url: '/environment/hdri/803-hdri-skies-com.hdr', type: 'hdr' },
  { id: 'sky_804', name: 'Lueur vespérale & Horizon rougeoyant 804 🌇', url: '/environment/hdri/804-hdri-skies-com.hdr', type: 'hdr' },
  { id: 'sky_809', name: 'Ciel matinal limpide 809 🌤️', url: '/environment/hdri/809-hdri-skies-com.hdr', type: 'hdr' },
  { id: 'sky_812', name: 'Ciel d\'or & Soleil rasant 812 🌅', url: '/environment/hdri/812-hdri-skies-com.hdr', type: 'hdr' },
  { id: 'sky_818', name: 'Ciel bleu profond & Grands nuages 818 ⛅', url: '/environment/hdri/818-hdri-skies-com.hdr', type: 'hdr' },

  // --- Ville, Rues, Architecture & Nuit ---
  { id: 'monument_snow_night_050', name: 'Monument & Ville sous la neige de nuit ❄️🌃', url: '/environment/hdri/050_hdrmaps_com_free_10K.hdr', type: 'hdr' },
  { id: 'village_night_158', name: 'Place de village méditerranéen de nuit 🌙🏮', url: '/environment/hdri/158_hdrmaps_com_free_10K.hdr', type: 'hdr' },
  { id: 'dikhololo_night', name: 'Dikhololo - Nuit étoilée & Camp 🌌', url: '/environment/hdri/dikhololo_night_1k.hdr', type: 'hdr' },
  { id: 'potsdamer_platz', name: 'Potsdamer Platz (Berlin) 🏙️', url: '/environment/hdri/potsdamer_platz_1k.hdr', type: 'hdr' },
  { id: 'ruins_overgrown_109', name: 'Ruines anciennes & Végétation 🏛️🌿', url: '/environment/hdri/109_hdrmaps_com_free_10K.hdr', type: 'hdr' },
  { id: 'empty_warehouse', name: 'Entrepôt industriel désaffecté 🏭', url: '/environment/hdri/empty_warehouse_01_1k.hdr', type: 'hdr' },
  { id: 'st_fagans_interior', name: 'Intérieur historique St Fagans 🏛️', url: '/environment/hdri/st_fagans_interior_1k.hdr', type: 'hdr' },
  { id: 'tunnel_110', name: 'Tunnel urbain illuminé 🚇💡', url: '/environment/hdri/HDR_110_Tunnel.hdr', type: 'hdr' },
  { id: 'parking_lot_111', name: 'Parking urbain en plein jour 🚗🏢', url: '/environment/hdri/HDR_111_Parking_Lot_2.hdr', type: 'hdr' },
  { id: 'city_night_lights', name: 'Panorama urbain nocturne & Lumières 🌃✨', url: '/environment/hdri/HDR_Free_City_Night_Lights.hdr', type: 'hdr' },
  { id: 'night_free', name: 'Ciel nocturne étoilé & Ambiance 🌌🌙', url: '/environment/hdri/night_free.hdr', type: 'hdr' },
  { id: 'stonewall', name: 'Allée pavée & Mur de pierre historique 🧱🏛️', url: '/environment/hdri/Stonewall.hdr', type: 'hdr' },
  { id: 'broumov_runway', name: 'Piste d\'aérodrome Broumov 🛫🛣️', url: '/environment/hdri/broumov-airport-runway_4K.hdr', type: 'hdr' },
  { id: 'calvary_chapels', name: 'Chapelles du Mont Calvaire ⛪⛰️', url: '/environment/hdri/calvary-hill-chapels_4K.hdr', type: 'hdr' },
  { id: 'chapel_interior', name: 'Intérieur solennel de chapelle ⛪🕯️', url: '/environment/hdri/chapel-interior_4K.hdr', type: 'hdr' },
  { id: 'container_dock', name: 'Zone portuaire & Conteneurs 📦🏗️', url: '/environment/hdri/container_free.hdr', type: 'hdr' },
  { id: 'machinery_room', name: 'Salle des machines sous néons 🏭⚡', url: '/environment/hdri/fluorescent-lit-machinery-room_4K.hdr', type: 'hdr' },
  { id: 'historic_flour_mill', name: 'Moulin à farine historique 🏛️🌾', url: '/environment/hdri/historic-flour-mill_4K.hdr', type: 'hdr' },
  { id: 'ludwikowice_underpass', name: 'Passage sous voie ferrée Ludwikowice 🛤️🏢', url: '/environment/hdri/ludwikowice-underpass_4K.hdr', type: 'hdr' },
  { id: 'neogothic_church', name: 'Parvis d\'église néo-gothique ⛪🏛️', url: '/environment/hdri/neogothic-church-exterior_4K.hdr', type: 'hdr' },
  { id: 'stairway_basilica', name: 'Grand escalier vers la basilique ⛪🏛️', url: '/environment/hdri/stairway-to-basilica_4K.hdr', type: 'hdr' },
  { id: 'sunny_industrial_yard', name: 'Cour industrielle ensoleillée 🏭☀️', url: '/environment/hdri/sunny-industrial-yard_4K.hdr', type: 'hdr' },
  { id: 'wlodyka_bunker', name: 'Entrée du bunker Włodyka 🪨🛡️', url: '/environment/hdri/wlodyka-bunker-entrance_4K.hdr', type: 'hdr' },

  // --- Studios photo & Intérieurs Design ---
  { id: 'studio_small', name: 'Studio photo & Lumières douces 💡', url: '/environment/hdri/studio_small_03_1k.hdr', type: 'hdr' },
  { id: 'big_studio_01', name: 'Grand studio photo neutre 1 🎬💡', url: '/environment/hdri/big-studio-01_4K.hdr', type: 'hdr' },
  { id: 'big_studio_04', name: 'Grand studio photo cyclorama 4 🎬💡', url: '/environment/hdri/big-studio-04_4K.hdr', type: 'hdr' },
  { id: 'fly_studio_03', name: 'Studio Fly avec éclairage directionnel 3 💡🎥', url: '/environment/hdri/fly-studio-03_4K.hdr', type: 'hdr' },
  { id: 'fly_studio_04', name: 'Studio Fly à lumière douce 4 💡🎥', url: '/environment/hdri/fly-studio-04_4K.hdr', type: 'hdr' },
  { id: 'fly_studio_05', name: 'Studio Fly à contraste élevé 5 💡🎥', url: '/environment/hdri/fly-studio-05_4K.hdr', type: 'hdr' },
  { id: 'hilberts_conference_room', name: 'Salle de conférence du moulin Hilbert 🏢💼', url: '/environment/hdri/hilberts-mill-conference-room_4K.hdr', type: 'hdr' },
  { id: 'studio_2nd_cyclorama', name: 'Cyclorama d\'étage de studio 📸⚪', url: '/environment/hdri/studio-2nd-floor-cyclorama_4K.hdr', type: 'hdr' },
  { id: 'studio_2nd_snoot', name: 'Studio à projecteur snoot focalisé 📸🎯', url: '/environment/hdri/studio-2nd-floor-snoot_4K.hdr', type: 'hdr' },
  { id: 'studio_2nd_floor', name: 'Plateau de studio 2e étage 📸✨', url: '/environment/hdri/studio-2nd-floor_4K.hdr', type: 'hdr' },
];

export function getRandomHdriId(): string {
  const index = Math.floor(Math.random() * HDRI_LIST.length);
  return HDRI_LIST[index].id;
}

export function getHdriById(id: string): HdriItem {
  return HDRI_LIST.find(h => h.id === id) || HDRI_LIST[0];
}
