# Inventaire Home Assistant — 26 octobre 2026

Lecture des registres HA après regroupement des pièces. Les noms ci-dessous sont
ceux encore présents dans HA ; les noms importés des appareils ne sont pas les
noms des pièces. Les états sont un instantané et peuvent changer.

52 fiches appareils : 12 virtuelles et 40 fiches matériel.
Une fiche matériel ne prouve pas un objet physique distinct : plusieurs intégrations
peuvent représenter le même équipement. Les entrées réseau Freebox nommées par une
adresse MAC restent à rapprocher des autres intégrations avant tout nettoyage.

330 entités enregistrées : 173 activées et 157 désactivées.
Parmi les entités activées, 8 sont indisponibles au moment du relevé.

Une entité représente une mesure, une commande ou un état, pas un appareil.
Exemple : un capteur Hue expose mouvement, température, luminosité, batterie,
diagnostic Zigbee et deux commandes d’activation des capteurs, soit sept entités.

## Entités par intégration

| Intégration | Nombre |
| --- | --- |
| mobile_app | 127 |
| hue | 88 |
| tuya | 43 |
| freebox | 31 |
| philips_airpurifier_coap | 19 |
| sun | 9 |
| backup | 5 |
| homekit_controller | 3 |
| cast | 1 |
| person | 1 |
| shopping_list | 1 |
| google_translate | 1 |
| met | 1 |

## Les 52 fiches appareils

| N° | Nom dans HA | Modèle | Intégration | Nature | Entités | Désactivées |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Sun | — | sun | Virtuel | 9 | 3 |
| 2 | hci0 (4C:44:5B:88:74:C0) | Unknown | bluetooth | Matériel | 0 | 0 |
| 3 | Backup | Home Assistant Backup | backup | Virtuel | 5 | 0 |
| 4 | Google mini | Google Nest Mini | cast | Matériel | 1 | 0 |
| 5 | Google Translate en com | Google Translate TTS | google_translate | Virtuel | 1 | 0 |
| 6 | Forecast | Forecast | met | Virtuel | 1 | 0 |
| 7 | Hue Bridge | Hue Bridge | hue | Matériel | 2 | 1 |
| 8 | Interrupteur 1 | Hue dimmer switch | hue | Matériel | 6 | 1 |
| 9 | Porte | Hue color lamp | hue | Matériel | 2 | 1 |
| 10 | Barre | Hue play | hue | Matériel | 2 | 1 |
| 11 | Capteur Douche | Hue motion sensor | hue | Matériel | 7 | 1 |
| 12 | Capteur Entrée | Hue motion sensor | hue | Matériel | 7 | 1 |
| 13 | Strip Blanc Jardin | Hue lightstrip | hue | Matériel | 2 | 1 |
| 14 | Cha | Hue color lamp | hue | Matériel | 2 | 1 |
| 15 | Capteur Cuisine | Hue motion sensor | hue | Matériel | 7 | 1 |
| 16 | Entrée | Hue color lamp | hue | Matériel | 2 | 1 |
| 17 | Rosanna | Hue color lamp | hue | Matériel | 2 | 1 |
| 18 | Douche | Hue color lamp | hue | Matériel | 2 | 1 |
| 19 | Interrupteur 2 | Hue dimmer switch | hue | Matériel | 6 | 1 |
| 20 | Principale | Room | hue | Virtuel | 22 | 0 |
| 21 | Douche | Room | hue | Virtuel | 5 | 0 |
| 22 | Cuisine | Room | hue | Virtuel | 2 | 0 |
| 23 | Entrée | Room | hue | Virtuel | 7 | 0 |
| 24 | Douche zone | Zone | hue | Virtuel | 3 | 0 |
| 25 | Freebox v8 (r1) | Freebox v8 (r1) | freebox | Matériel | 10 | 0 |
| 26 | EC:B5:FA:1F:B5:83 | — | freebox | Matériel | 1 | 0 |
| 27 | Somfy Connectivity kit | Connectivity kit | homekit_controller | Matériel | 1 | 0 |
| 28 | Volet | shutter | homekit_controller | Matériel | 2 | 0 |
| 29 | CPH2663 | CPH2663 | mobile_app | Matériel | 127 | 122 |
| 30 | Jardin | OECO_PG02 | tuya | Matériel | 1 | 0 |
| 31 | Chauffe serviettes | ReadyWarm PowerBox Ceramic Connected | tuya | Matériel | 3 | 0 |
| 32 | Interrupteurs Salle de bain | 2gang smart switch | tuya | Matériel | 2 | 0 |
| 33 | Interrupteur carré 2 btn | Wireless Switch | tuya | Matériel | 3 | 0 |
| 34 | Motion Sensor Rectangle Wifi | Motion Sensor | tuya | Matériel | 2 | 0 |
| 35 | Motion Sensor Carré | Motion Sensor | tuya | Matériel | 2 | 0 |
| 36 | Matter ZigBee Hub | Matter ZigBee Hub | tuya | Matériel | 1 | 0 |
| 37 | Détecteur rectangulaire | Motion Sensor | tuya | Matériel | 2 | 0 |
| 38 | Tête | Smart plug | tuya | Matériel | 8 | 0 |
| 39 | Smart knob dimmer | Smart knob dimmer | tuya | Matériel | 2 | 0 |
| 40 | smart button 2 entrée rond blanc | smart button | tuya | Matériel | 2 | 0 |
| 41 | Porte | Smart Lighting | tuya | Matériel | 1 | 0 |
| 42 | interrupteur rond 2 click | Wireless scene switch | tuya | Matériel | 2 | 0 |
| 43 | Détecteur jardin | PIR motion sensor | tuya | Matériel | 2 | 0 |
| 44 | Bouton Rotatif | Knob Switch | tuya | Matériel | 2 | 0 |
| 45 | Fenêtre | Smart Led Strip | tuya | Matériel | 1 | 0 |
| 46 | Motion Sensor 2 | Motion Sensor | tuya | Matériel | 2 | 0 |
| 47 | Zigbdee Smart  Scene  Button | Zigbdee Smart  Scene  Button | tuya | Matériel | 2 | 0 |
| 48 | Living room | AMF870/15 | philips_airpurifier_coap | Matériel | 19 | 0 |
| 49 | D0:BA:E4:43:2F:A0 | — | freebox | Matériel | 1 | 0 |
| 50 | allumer studio 3 🕯️ | Tuya Scene | tuya | Virtuel | 1 | 0 |
| 51 | Allumer studio | Tuya Scene | tuya | Virtuel | 1 | 0 |
| 52 | Éteindre portes et fenêtres | Tuya Scene | tuya | Virtuel | 1 | 0 |

## Les 330 entités

« Désactivée » signifie présente au registre mais non chargée. « Sans état »
signifie qu’aucun état n’a été trouvé dans la session lors du relevé.

| Entité | Appareil | Intégration | Statut |
| --- | --- | --- | --- |
| event.backup_automatic_backup | Backup | backup | unknown |
| sensor.backup_backup_manager_state | Backup | backup | idle |
| sensor.backup_last_attempted_automatic_backup | Backup | backup | unknown |
| sensor.backup_last_successful_automatic_backup | Backup | backup | unknown |
| sensor.backup_next_scheduled_automatic_backup | Backup | backup | unknown |
| media_player.google_mini | Google mini | cast | off |
| device_tracker.mxchip | D0:BA:E4:43:2F:A0 | freebox | home |
| device_tracker.ecb5fa1fb583 | EC:B5:FA:1F:B5:83 | freebox | home |
| button.freebox_v8_r1_mark_calls_as_read | Freebox v8 (r1) | freebox | unknown |
| button.freebox_v8_r1_restart | Freebox v8 (r1) | freebox | unknown |
| device_tracker.freebox_v8_r1 | Freebox v8 (r1) | freebox | home |
| sensor.freebox_v8_r1_download_speed | Freebox v8 (r1) | freebox | 6.54 |
| sensor.freebox_v8_r1_missed_calls | Freebox v8 (r1) | freebox | 5 |
| sensor.freebox_v8_r1_temperature_1 | Freebox v8 (r1) | freebox | 49 |
| sensor.freebox_v8_r1_temperature_cpu_0 | Freebox v8 (r1) | freebox | 60 |
| sensor.freebox_v8_r1_upload_speed | Freebox v8 (r1) | freebox | 8.05 |
| sensor.freebox_v8_r1_ventilateur_1 | Freebox v8 (r1) | freebox | 360 |
| switch.freebox_v8_r1_wi_fi | Freebox v8 (r1) | freebox | on |
| device_tracker.android | Sans appareil | freebox | Désactivée (integration) |
| device_tracker.connectivity_kit_2111_7908_6883 | Sans appareil | freebox | Désactivée (integration) |
| device_tracker.dinatih_homelab | Sans appareil | freebox | Désactivée (integration) |
| device_tracker.eloidine85100 | Sans appareil | freebox | Désactivée (integration) |
| device_tracker.esp_14036d | Sans appareil | freebox | Désactivée (integration) |
| device_tracker.google_nest_mini | Sans appareil | freebox | Désactivée (integration) |
| device_tracker.mini_pc | Sans appareil | freebox | Désactivée (integration) |
| device_tracker.omarchy_on_framework | Sans appareil | freebox | Désactivée (integration) |
| device_tracker.oneplus_nord_4 | Sans appareil | freebox | Désactivée (integration) |
| device_tracker.smartgateway | Sans appareil | freebox | Désactivée (integration) |
| device_tracker.unknown_device | Sans appareil | freebox | Désactivée (integration) |
| device_tracker.unknown_device_2 | Sans appareil | freebox | Désactivée (integration) |
| device_tracker.unknown_device_3 | Sans appareil | freebox | Désactivée (integration) |
| device_tracker.wlan0 | Sans appareil | freebox | Désactivée (integration) |
| device_tracker.wlan0_2 | Sans appareil | freebox | Désactivée (integration) |
| device_tracker.wlan0_3 | Sans appareil | freebox | Désactivée (integration) |
| device_tracker.wlan0_4 | Sans appareil | freebox | Désactivée (integration) |
| device_tracker.wlan0_5 | Sans appareil | freebox | Désactivée (integration) |
| device_tracker.wlan0_6 | Sans appareil | freebox | Désactivée (integration) |
| tts.google_translate_en_com | Google Translate en com | google_translate | unknown |
| button.somfy_connectivity_kit_identify | Somfy Connectivity kit | homekit_controller | unknown |
| button.volet_identify | Volet | homekit_controller | unknown |
| cover.volet | Volet | homekit_controller | open |
| light.cuisine_barre | Barre | hue | off |
| sensor.cuisine_barre_zigbee_connectivity | Barre | hue | Désactivée (integration) |
| binary_sensor.capteur_cuisine_motion | Capteur Cuisine | hue | off |
| sensor.capteur_cuisine_battery | Capteur Cuisine | hue | 100 |
| sensor.capteur_cuisine_illuminance | Capteur Cuisine | hue | 0 |
| sensor.capteur_cuisine_temperature | Capteur Cuisine | hue | 19.0 |
| sensor.capteur_cuisine_zigbee_connectivity | Capteur Cuisine | hue | Désactivée (integration) |
| switch.capteur_cuisine_light_sensor_enabled | Capteur Cuisine | hue | on |
| switch.capteur_cuisine_motion_sensor_enabled | Capteur Cuisine | hue | on |
| binary_sensor.capteur_douche_motion | Capteur Douche | hue | off |
| sensor.capteur_douche_battery | Capteur Douche | hue | 100 |
| sensor.capteur_douche_illuminance | Capteur Douche | hue | 0 |
| sensor.capteur_douche_temperature | Capteur Douche | hue | 19.2 |
| sensor.capteur_douche_zigbee_connectivity | Capteur Douche | hue | Désactivée (integration) |
| switch.capteur_douche_light_sensor_enabled | Capteur Douche | hue | on |
| switch.capteur_douche_motion_sensor_enabled | Capteur Douche | hue | on |
| binary_sensor.entree_capteur_entree_motion | Capteur Entrée | hue | off |
| sensor.entree_capteur_entree_battery | Capteur Entrée | hue | 100 |
| sensor.entree_capteur_entree_illuminance | Capteur Entrée | hue | 0 |
| sensor.entree_capteur_entree_temperature | Capteur Entrée | hue | 18.7 |
| sensor.entree_capteur_entree_zigbee_connectivity | Capteur Entrée | hue | Désactivée (integration) |
| switch.entree_capteur_entree_light_sensor_enabled | Capteur Entrée | hue | on |
| switch.entree_capteur_entree_motion_sensor_enabled | Capteur Entrée | hue | on |
| light.principale_cha | Cha | hue | unavailable |
| sensor.principale_cha_zigbee_connectivity | Cha | hue | Désactivée (integration) |
| light.cuisine_cuisine | Cuisine | hue | off |
| select.cuisine_cuisine_scene | Cuisine | hue | unknown |
| light.douche_douche | Douche | hue | off |
| light.douche_douche_2 | Douche | hue | off |
| scene.douche_douche_bright | Douche | hue | unknown |
| scene.douche_douche_energize | Douche | hue | unknown |
| scene.douche_douche_read | Douche | hue | unknown |
| select.douche_douche_scene | Douche | hue | unknown |
| sensor.douche_douche_zigbee_connectivity | Douche | hue | Désactivée (integration) |
| light.douche_zone | Douche zone | hue | off |
| scene.douche_zone_bright | Douche zone | hue | unknown |
| select.douche_zone_scene | Douche zone | hue | unknown |
| binary_sensor.entree_entree_motion | Entrée | hue | off |
| light.entree_entree_2 | Entrée | hue | off |
| scene.entree_entree_chinatown | Entrée | hue | unknown |
| scene.entree_entree_dimmed | Entrée | hue | unknown |
| scene.entree_entree_disturbia | Entrée | hue | unknown |
| select.entree_entree_scene | Entrée | hue | unknown |
| sensor.entree_entree_illuminance | Entrée | hue | 0 |
| light.entree_entree | Entrée | hue | off |
| sensor.entree_entree_zigbee_connectivity | Entrée | hue | Désactivée (integration) |
| binary_sensor.hue_bridge_entertainment_area_music_arena | Hue Bridge | hue | off |
| sensor.hue_bridge_zigbee_connectivity | Hue Bridge | hue | Désactivée (integration) |
| event.principale_interrupteur_1_button_1 | Interrupteur 1 | hue | unknown |
| event.principale_interrupteur_1_button_2 | Interrupteur 1 | hue | unknown |
| event.principale_interrupteur_1_button_3 | Interrupteur 1 | hue | unknown |
| event.principale_interrupteur_1_button_4 | Interrupteur 1 | hue | unknown |
| sensor.principale_interrupteur_1_battery | Interrupteur 1 | hue | 0 |
| sensor.principale_interrupteur_1_zigbee_connectivity | Interrupteur 1 | hue | Désactivée (integration) |
| event.principale_interrupteur_2_button_1 | Interrupteur 2 | hue | 2026-10-24T22:25:22.775+00:00 |
| event.principale_interrupteur_2_button_2 | Interrupteur 2 | hue | unknown |
| event.principale_interrupteur_2_button_3 | Interrupteur 2 | hue | unknown |
| event.principale_interrupteur_2_button_4 | Interrupteur 2 | hue | unknown |
| sensor.principale_interrupteur_2_battery | Interrupteur 2 | hue | 1 |
| sensor.principale_interrupteur_2_zigbee_connectivity | Interrupteur 2 | hue | Désactivée (integration) |
| light.principale_porte | Porte | hue | unavailable |
| sensor.principale_porte_zigbee_connectivity | Porte | hue | Désactivée (integration) |
| light.principale_principale | Principale | hue | on |
| scene.principale_principale_amber_bloom | Principale | hue | unknown |
| scene.principale_principale_cancun | Principale | hue | unknown |
| scene.principale_principale_chinatown | Principale | hue | unknown |
| scene.principale_principale_city_of_love | Principale | hue | unknown |
| scene.principale_principale_colorful | Principale | hue | unknown |
| scene.principale_principale_disturbia | Principale | hue | unknown |
| scene.principale_principale_docteur | Principale | hue | unknown |
| scene.principale_principale_dreamy_dusk | Principale | hue | unknown |
| scene.principale_principale_hal | Principale | hue | unknown |
| scene.principale_principale_lecture | Principale | hue | unknown |
| scene.principale_principale_lumiere_naturelle | Principale | hue | unknown |
| scene.principale_principale_malibu_pink | Principale | hue | unknown |
| scene.principale_principale_nightlight | Principale | hue | unknown |
| scene.principale_principale_relax | Principale | hue | unknown |
| scene.principale_principale_relax_et_plus_couleur | Principale | hue | unknown |
| scene.principale_principale_rest | Principale | hue | unknown |
| scene.principale_principale_rouge_et_plus | Principale | hue | unknown |
| scene.principale_principale_ruby_glow | Principale | hue | unknown |
| scene.principale_principale_ruby_romance | Principale | hue | unknown |
| scene.principale_principale_scarlet_dream | Principale | hue | unknown |
| select.principale_principale_scene | Principale | hue | unknown |
| light.principale_rosanna | Rosanna | hue | unavailable |
| sensor.principale_rosanna_zigbee_connectivity | Rosanna | hue | Désactivée (integration) |
| light.douche_strip_blanc_jardin | Strip Blanc Jardin | hue | unavailable |
| sensor.douche_strip_blanc_jardin_zigbee_connectivity | Strip Blanc Jardin | hue | Désactivée (integration) |
| weather.forecast_home | Forecast | met | cloudy |
| binary_sensor.cph2663_android_auto | CPH2663 | mobile_app | Désactivée (integration) |
| binary_sensor.cph2663_app_inactive | CPH2663 | mobile_app | Désactivée (integration) |
| binary_sensor.cph2663_bluetooth_state | CPH2663 | mobile_app | Désactivée (integration) |
| binary_sensor.cph2663_device_locked | CPH2663 | mobile_app | Désactivée (integration) |
| binary_sensor.cph2663_device_secure | CPH2663 | mobile_app | Désactivée (integration) |
| binary_sensor.cph2663_doze_mode | CPH2663 | mobile_app | Désactivée (integration) |
| binary_sensor.cph2663_headphones | CPH2663 | mobile_app | Désactivée (integration) |
| binary_sensor.cph2663_hotspot_state | CPH2663 | mobile_app | Désactivée (integration) |
| binary_sensor.cph2663_interactive | CPH2663 | mobile_app | Désactivée (integration) |
| binary_sensor.cph2663_is_charging | CPH2663 | mobile_app | Désactivée (integration) |
| binary_sensor.cph2663_keyguard_locked | CPH2663 | mobile_app | Désactivée (integration) |
| binary_sensor.cph2663_keyguard_secure | CPH2663 | mobile_app | Désactivée (integration) |
| binary_sensor.cph2663_mic_muted | CPH2663 | mobile_app | Désactivée (integration) |
| binary_sensor.cph2663_mobile_data | CPH2663 | mobile_app | Désactivée (integration) |
| binary_sensor.cph2663_mobile_data_roaming | CPH2663 | mobile_app | Désactivée (integration) |
| binary_sensor.cph2663_music_active | CPH2663 | mobile_app | Désactivée (integration) |
| binary_sensor.cph2663_nfc_state | CPH2663 | mobile_app | Désactivée (integration) |
| binary_sensor.cph2663_power_save | CPH2663 | mobile_app | Désactivée (integration) |
| binary_sensor.cph2663_speakerphone | CPH2663 | mobile_app | Désactivée (integration) |
| binary_sensor.cph2663_wi_fi_state | CPH2663 | mobile_app | Désactivée (integration) |
| binary_sensor.cph2663_work_profile | CPH2663 | mobile_app | Désactivée (integration) |
| device_tracker.cph2663 | CPH2663 | mobile_app | home |
| notify.cph2663 | CPH2663 | mobile_app | unknown |
| sensor.cph2663_accent_color | CPH2663 | mobile_app | Désactivée (integration) |
| sensor.cph2663_active_calories_burned | CPH2663 | mobile_app | Désactivée (integration) |
| sensor.cph2663_app_importance | CPH2663 | mobile_app | Désactivée (integration) |
| sensor.cph2663_app_memory | CPH2663 | mobile_app | Désactivée (integration) |
| sensor.cph2663_app_rx_gb | CPH2663 | mobile_app | Désactivée (integration) |
| sensor.cph2663_app_standby_bucket | CPH2663 | mobile_app | Désactivée (integration) |
| sensor.cph2663_app_tx_gb | CPH2663 | mobile_app | Désactivée (integration) |
| sensor.cph2663_audio_mode | CPH2663 | mobile_app | Désactivée (integration) |
| sensor.cph2663_basal_body_temperature | CPH2663 | mobile_app | Désactivée (integration) |
| sensor.cph2663_basal_metabolic_rate | CPH2663 | mobile_app | Désactivée (integration) |
| sensor.cph2663_battery_cycle_count | CPH2663 | mobile_app | Désactivée (integration) |
| sensor.cph2663_battery_health | CPH2663 | mobile_app | Désactivée (integration) |
| sensor.cph2663_battery_level | CPH2663 | mobile_app | 63 |
| sensor.cph2663_battery_power | CPH2663 | mobile_app | Désactivée (integration) |
| sensor.cph2663_battery_state | CPH2663 | mobile_app | discharging |
| sensor.cph2663_battery_temperature | CPH2663 | mobile_app | Désactivée (integration) |
| sensor.cph2663_beacon_monitor | CPH2663 | mobile_app | Désactivée (integration) |
| sensor.cph2663_ble_transmitter | CPH2663 | mobile_app | Désactivée (integration) |
| sensor.cph2663_blood_glucose | CPH2663 | mobile_app | Désactivée (integration) |
| sensor.cph2663_bluetooth_connection | CPH2663 | mobile_app | Désactivée (integration) |
| sensor.cph2663_body_fat | CPH2663 | mobile_app | Désactivée (integration) |
| sensor.cph2663_body_temperature | CPH2663 | mobile_app | Désactivée (integration) |
| sensor.cph2663_body_water_mass | CPH2663 | mobile_app | Désactivée (integration) |
| sensor.cph2663_bone_mass | CPH2663 | mobile_app | Désactivée (integration) |
| sensor.cph2663_car_battery | CPH2663 | mobile_app | Désactivée (integration) |
| sensor.cph2663_car_charging_status | CPH2663 | mobile_app | Désactivée (integration) |
| sensor.cph2663_car_ev_connector_type | CPH2663 | mobile_app | Désactivée (integration) |
| sensor.cph2663_car_fuel | CPH2663 | mobile_app | Désactivée (integration) |
| sensor.cph2663_car_fuel_type | CPH2663 | mobile_app | Désactivée (integration) |
| sensor.cph2663_car_name | CPH2663 | mobile_app | Désactivée (integration) |
| sensor.cph2663_car_odometer | CPH2663 | mobile_app | Désactivée (integration) |
| sensor.cph2663_car_range_remaining | CPH2663 | mobile_app | Désactivée (integration) |
| sensor.cph2663_car_speed | CPH2663 | mobile_app | Désactivée (integration) |
| sensor.cph2663_charger_type | CPH2663 | mobile_app | none |
| sensor.cph2663_current_time_zone | CPH2663 | mobile_app | Désactivée (integration) |
| sensor.cph2663_current_version | CPH2663 | mobile_app | Désactivée (integration) |
| sensor.cph2663_daily_distance | CPH2663 | mobile_app | Désactivée (integration) |
| sensor.cph2663_daily_elevation_gained | CPH2663 | mobile_app | Désactivée (integration) |
| sensor.cph2663_daily_floors | CPH2663 | mobile_app | Désactivée (integration) |
| sensor.cph2663_daily_hydration | CPH2663 | mobile_app | Désactivée (integration) |
| sensor.cph2663_daily_steps | CPH2663 | mobile_app | Désactivée (integration) |
| sensor.cph2663_data_network_type_sim_1 | CPH2663 | mobile_app | Désactivée (integration) |
| sensor.cph2663_data_network_type_sim_2 | CPH2663 | mobile_app | Désactivée (integration) |
| sensor.cph2663_detected_activity | CPH2663 | mobile_app | Désactivée (integration) |
| sensor.cph2663_diastolic_blood_pressure | CPH2663 | mobile_app | Désactivée (integration) |
| sensor.cph2663_do_not_disturb_sensor | CPH2663 | mobile_app | Désactivée (integration) |
| sensor.cph2663_external_storage | CPH2663 | mobile_app | Désactivée (integration) |
| sensor.cph2663_geocoded_location | CPH2663 | mobile_app | Désactivée (integration) |
| sensor.cph2663_heart_rate | CPH2663 | mobile_app | Désactivée (integration) |
| sensor.cph2663_heart_rate_variability | CPH2663 | mobile_app | Désactivée (integration) |
| sensor.cph2663_height | CPH2663 | mobile_app | Désactivée (integration) |
| sensor.cph2663_internal_storage | CPH2663 | mobile_app | Désactivée (integration) |
| sensor.cph2663_ipv6_addresses | CPH2663 | mobile_app | Désactivée (integration) |
| sensor.cph2663_last_reboot | CPH2663 | mobile_app | Désactivée (integration) |
| sensor.cph2663_last_used_app | CPH2663 | mobile_app | Désactivée (integration) |
| sensor.cph2663_lean_body_mass | CPH2663 | mobile_app | Désactivée (integration) |
| sensor.cph2663_light_sensor | CPH2663 | mobile_app | Désactivée (integration) |
| sensor.cph2663_media_session | CPH2663 | mobile_app | Désactivée (integration) |
| sensor.cph2663_mobile_rx_gb | CPH2663 | mobile_app | Désactivée (integration) |
| sensor.cph2663_mobile_tx_gb | CPH2663 | mobile_app | Désactivée (integration) |
| sensor.cph2663_network_type | CPH2663 | mobile_app | Désactivée (integration) |
| sensor.cph2663_next_alarm | CPH2663 | mobile_app | Désactivée (integration) |
| sensor.cph2663_os_version | CPH2663 | mobile_app | Désactivée (integration) |
| sensor.cph2663_oxygen_saturation | CPH2663 | mobile_app | Désactivée (integration) |
| sensor.cph2663_phone_state | CPH2663 | mobile_app | Désactivée (integration) |
| sensor.cph2663_proximity_sensor | CPH2663 | mobile_app | Désactivée (integration) |
| sensor.cph2663_public_ip_address | CPH2663 | mobile_app | Désactivée (integration) |
| sensor.cph2663_remaining_charge_time | CPH2663 | mobile_app | Désactivée (integration) |
| sensor.cph2663_respiratory_rate | CPH2663 | mobile_app | Désactivée (integration) |
| sensor.cph2663_resting_heart_rate | CPH2663 | mobile_app | Désactivée (integration) |
| sensor.cph2663_ringer_mode | CPH2663 | mobile_app | Désactivée (integration) |
| sensor.cph2663_screen_brightness | CPH2663 | mobile_app | Désactivée (integration) |
| sensor.cph2663_screen_off_timeout | CPH2663 | mobile_app | Désactivée (integration) |
| sensor.cph2663_screen_orientation | CPH2663 | mobile_app | Désactivée (integration) |
| sensor.cph2663_screen_rotation | CPH2663 | mobile_app | Désactivée (integration) |
| sensor.cph2663_security_patch | CPH2663 | mobile_app | Désactivée (integration) |
| sensor.cph2663_signal_strength_sim_1 | CPH2663 | mobile_app | Désactivée (integration) |
| sensor.cph2663_signal_strength_sim_2 | CPH2663 | mobile_app | Désactivée (integration) |
| sensor.cph2663_sim_1 | CPH2663 | mobile_app | Désactivée (integration) |
| sensor.cph2663_sim_2 | CPH2663 | mobile_app | Désactivée (integration) |
| sensor.cph2663_sleep_confidence | CPH2663 | mobile_app | Désactivée (integration) |
| sensor.cph2663_sleep_duration | CPH2663 | mobile_app | Désactivée (integration) |
| sensor.cph2663_sleep_segment | CPH2663 | mobile_app | Désactivée (integration) |
| sensor.cph2663_steps_sensor | CPH2663 | mobile_app | Désactivée (integration) |
| sensor.cph2663_systolic_blood_pressure | CPH2663 | mobile_app | Désactivée (integration) |
| sensor.cph2663_total_calories_burned | CPH2663 | mobile_app | Désactivée (integration) |
| sensor.cph2663_total_rx_gb | CPH2663 | mobile_app | Désactivée (integration) |
| sensor.cph2663_total_tx_gb | CPH2663 | mobile_app | Désactivée (integration) |
| sensor.cph2663_vo2_max | CPH2663 | mobile_app | Désactivée (integration) |
| sensor.cph2663_volume_level_accessibility | CPH2663 | mobile_app | Désactivée (integration) |
| sensor.cph2663_volume_level_alarm | CPH2663 | mobile_app | Désactivée (integration) |
| sensor.cph2663_volume_level_call | CPH2663 | mobile_app | Désactivée (integration) |
| sensor.cph2663_volume_level_dtmf | CPH2663 | mobile_app | Désactivée (integration) |
| sensor.cph2663_volume_level_music | CPH2663 | mobile_app | Désactivée (integration) |
| sensor.cph2663_volume_level_notification | CPH2663 | mobile_app | Désactivée (integration) |
| sensor.cph2663_volume_level_ringer | CPH2663 | mobile_app | Désactivée (integration) |
| sensor.cph2663_volume_level_system | CPH2663 | mobile_app | Désactivée (integration) |
| sensor.cph2663_weight | CPH2663 | mobile_app | Désactivée (integration) |
| sensor.cph2663_wi_fi_bssid | CPH2663 | mobile_app | Désactivée (integration) |
| sensor.cph2663_wi_fi_connection | CPH2663 | mobile_app | Désactivée (integration) |
| sensor.cph2663_wi_fi_frequency | CPH2663 | mobile_app | Désactivée (integration) |
| sensor.cph2663_wi_fi_ip_address | CPH2663 | mobile_app | Désactivée (integration) |
| sensor.cph2663_wi_fi_link_speed | CPH2663 | mobile_app | Désactivée (integration) |
| sensor.cph2663_wi_fi_signal_strength | CPH2663 | mobile_app | Désactivée (integration) |
| person.david | Sans appareil | person | home |
| fan.living_room | Living room | philips_airpurifier_coap | off |
| light.living_room_display_backlight | Living room | philips_airpurifier_coap | on |
| number.living_room | Living room | philips_airpurifier_coap | 0 |
| number.living_room_temperature | Living room | philips_airpurifier_coap | 24 |
| select.living_room_function | Living room | philips_airpurifier_coap | heating |
| select.living_room_preferred_index | Living room | philips_airpurifier_coap | pm25 |
| select.living_room_timer | Living room | philips_airpurifier_coap | Off |
| sensor.living_room | Living room | philips_airpurifier_coap | 1 |
| sensor.living_room_humidity | Living room | philips_airpurifier_coap | 63 |
| sensor.living_room_indoor_allergen_index | Living room | philips_airpurifier_coap | 11 |
| sensor.living_room_nanoprotect_filter | Living room | philips_airpurifier_coap | 38 |
| sensor.living_room_pm2_5 | Living room | philips_airpurifier_coap | 87 |
| sensor.living_room_pre_filter | Living room | philips_airpurifier_coap | 84 |
| sensor.living_room_rssi | Living room | philips_airpurifier_coap | -37 |
| sensor.living_room_temperature | Living room | philips_airpurifier_coap | 22.2 |
| switch.living_room_auto_plus | Living room | philips_airpurifier_coap | on |
| switch.living_room_beep | Living room | philips_airpurifier_coap | on |
| switch.living_room_child_lock | Living room | philips_airpurifier_coap | off |
| switch.living_room_standby_sensors | Living room | philips_airpurifier_coap | on |
| todo.shopping_list | Sans appareil | shopping_list | 0 |
| binary_sensor.sun_solar_rising | Sun | sun | Désactivée (integration) |
| sensor.sun_next_dawn | Sun | sun | 2026-10-27T05:56:13+00:00 |
| sensor.sun_next_dusk | Sun | sun | 2026-10-27T17:11:40+00:00 |
| sensor.sun_next_midnight | Sun | sun | 2026-10-26T23:34:20+00:00 |
| sensor.sun_next_noon | Sun | sun | 2026-10-27T11:34:21+00:00 |
| sensor.sun_next_rising | Sun | sun | 2026-10-27T06:29:30+00:00 |
| sensor.sun_next_setting | Sun | sun | 2026-10-27T16:38:26+00:00 |
| sensor.sun_solar_azimuth | Sun | sun | Désactivée (integration) |
| sensor.sun_solar_elevation | Sun | sun | Désactivée (integration) |
| scene.allumer_studio | Allumer studio | tuya | unknown |
| event.bouton_rotatif_button_1 | Bouton Rotatif | tuya | unknown |
| sensor.bouton_rotatif_battery | Bouton Rotatif | tuya | 64.0 |
| climate.chauffe_serviettes | Chauffe serviettes | tuya | off |
| light.chauffe_serviettes_backlight | Chauffe serviettes | tuya | on |
| select.chauffe_serviettes_temperature_level | Chauffe serviettes | tuya | unknown |
| binary_sensor.detecteur_jardin_motion | Détecteur jardin | tuya | off |
| sensor.detecteur_jardin_battery | Détecteur jardin | tuya | 100.0 |
| binary_sensor.detecteur_rectangulaire_motion | Détecteur rectangulaire | tuya | unavailable |
| sensor.detecteur_rectangulaire_battery | Détecteur rectangulaire | tuya | unavailable |
| light.fenetre | Fenêtre | tuya | off |
| event.interrupteur_carre_2_btn_button_1 | Interrupteur carré 2 btn | tuya | unknown |
| event.interrupteur_carre_2_btn_button_2 | Interrupteur carré 2 btn | tuya | unknown |
| sensor.interrupteur_carre_2_btn_battery | Interrupteur carré 2 btn | tuya | 33.0 |
| switch.interrupteurs_salle_de_bain_switch_1 | Interrupteurs Salle de bain | tuya | off |
| switch.interrupteurs_salle_de_bain_switch_2 | Interrupteurs Salle de bain | tuya | on |
| switch.jardin_socket_1 | Jardin | tuya | off |
| binary_sensor.matter_zigbee_hub_problem | Matter ZigBee Hub | tuya | off |
| binary_sensor.motion_sensor_2_motion | Motion Sensor 2 | tuya | on |
| sensor.motion_sensor_2_battery | Motion Sensor 2 | tuya | 100.0 |
| binary_sensor.motion_sensor_carre_motion | Motion Sensor Carré | tuya | on |
| sensor.motion_sensor_carre_battery | Motion Sensor Carré | tuya | 99.0 |
| binary_sensor.motion_sensor_rectangle_wifi_motion | Motion Sensor Rectangle Wifi | tuya | unavailable |
| sensor.motion_sensor_rectangle_wifi_battery_state | Motion Sensor Rectangle Wifi | tuya | unavailable |
| light.porte | Porte | tuya | on |
| event.smart_knob_dimmer_button_1 | Smart knob dimmer | tuya | unknown |
| sensor.smart_knob_dimmer_battery | Smart knob dimmer | tuya | 1.0 |
| select.tete_indicator_light_mode | Tête | tuya | relay |
| select.tete_power_on_behavior | Tête | tuya | power_off |
| sensor.tete_current | Tête | tuya | 0.0 |
| sensor.tete_power | Tête | tuya | 0.0 |
| sensor.tete_total_energy | Tête | tuya | 0.03 |
| sensor.tete_voltage | Tête | tuya | 231.0 |
| switch.tete_child_lock | Tête | tuya | off |
| switch.tete_socket_1 | Tête | tuya | off |
| event.zigbdee_smart_scene_button_button_1 | Zigbdee Smart  Scene  Button | tuya | unknown |
| sensor.zigbdee_smart_scene_button_battery | Zigbdee Smart  Scene  Button | tuya | 82.0 |
| scene.allumer_studio_3 | allumer studio 3 🕯️ | tuya | unknown |
| event.interrupteur_rond_2_click_button_1 | interrupteur rond 2 click | tuya | unknown |
| sensor.interrupteur_rond_2_click_battery | interrupteur rond 2 click | tuya | 1.0 |
| event.smart_button_2_entree_rond_blanc_button_1 | smart button 2 entrée rond blanc | tuya | unknown |
| sensor.smart_button_2_entree_rond_blanc_battery | smart button 2 entrée rond blanc | tuya | 45.0 |
| scene.eteindre_portes_et_fenetres | Éteindre portes et fenêtres | tuya | unknown |
