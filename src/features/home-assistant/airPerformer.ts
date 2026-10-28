/** AMF870 controls, using the entity IDs verified on the user's Home Assistant. */
export const AIR_PERFORMER_CONTROLS = {
  airPerformerPower: { entity: 'fan.living_room', label: 'Alimentation', initialValue: false },
  airPerformerOscillation: { entity: 'number.living_room', label: 'Oscillation', values: [0, 45, 90, 180, 270, 350], initialValue: 0 },
  airPerformerMode: { entity: 'select.living_room_function', label: 'Fonction', values: ['fan', 'circulation', 'heating'], initialValue: 'fan' },
  airPerformerPreset: { entity: 'fan.living_room', label: 'Mode', values: ['auto', 'sleep', 'turbo'], initialValue: 'auto' },
  airPerformerSpeed: { entity: 'fan.living_room', label: 'Vitesse', values: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], initialValue: 5 },
  airPerformerTemperature: { entity: 'number.living_room_temperature', label: 'Température cible', values: Array.from({ length: 37 }, (_, i) => i + 1), initialValue: 24 },
  airPerformerTimer: { entity: 'select.living_room_timer', label: 'Minuterie', values: ['Off', '30min', ...Array.from({ length: 12 }, (_, i) => `${i + 1}h`)], initialValue: 'Off' },
  airPerformerDisplay: { entity: 'light.living_room_display_backlight', label: 'Luminosité écran', values: [0, 10, 50, 100], initialValue: 100 },
  airPerformerIndex: { entity: 'select.living_room_preferred_index', label: 'Indice affiché', values: ['indoor_allergen_index', 'pm25', 'gas_level'], initialValue: 'pm25' },
  airPerformerAutoPlus: { entity: 'switch.living_room_auto_plus', label: 'Auto Plus', initialValue: true },
  airPerformerBeep: { entity: 'switch.living_room_beep', label: 'Bip sonore', initialValue: true },
  airPerformerChildLock: { entity: 'switch.living_room_child_lock', label: 'Verrouillage enfant', initialValue: false },
  airPerformerStandbySensors: { entity: 'switch.living_room_standby_sensors', label: 'Capteurs en veille', initialValue: true },
} satisfies Record<string, { entity: string; label: string; values?: (string | number)[]; initialValue: string | number | boolean }>;
export type AirPerformerAction = keyof typeof AIR_PERFORMER_CONTROLS;
export const AIR_PERFORMER_ACTION_IDS = Object.keys(AIR_PERFORMER_CONTROLS) as AirPerformerAction[];
export const isAirPerformerAction = (key: string): key is AirPerformerAction => Object.prototype.hasOwnProperty.call(AIR_PERFORMER_CONTROLS, key);
export const AIR_PERFORMER_SENSORS = {
  'sensor.living_room': 'Gaz',
  'sensor.living_room_pm2_5': 'PM2.5',
  'sensor.living_room_humidity': 'Humidité',
  'sensor.living_room_temperature': 'Température ambiante',
  'sensor.living_room_indoor_allergen_index': 'Allergènes',
  'sensor.living_room_nanoprotect_filter': 'Filtre NanoProtect',
  'sensor.living_room_pre_filter': 'Préfiltre',
  'sensor.living_room_rssi': 'Signal Wi-Fi',
};
