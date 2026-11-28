/**
 * laraOutfits.ts — Registre unique des tenues et accessoires sur mesure de Lara.
 * Source de vérité partagée par types.ts, layerUrlParams.ts, CharacterClothing.tsx,
 * Character.tsx et CharacterSection.tsx.
 */

export const LARA_TOP_IDS = [
  'native',
  'bikini',
  'bikini-red',
  'body-native-red',
  'onepiece',
  'onepiece-shorty',
  'tank-rib',
  'tshirt',
  'nightgown-tank',
  'nightgown-tshirt',
  'hoodie',
  'hoodie-crop',
  'hoodie-tank',
  'hoodie-crop-tank',
  'denim-jacket-cropped-g4h-high',
  'denim-jacket-classic-g4h-high',
  'denim-vest-cropped-g4h-high',
  'denim-vest-classic-g4h-high',
  'denim-romper-tank-g4h-high',
  'denim-overalls-g4h-high',
  'denim-overalls-short-g4h-high',
  'denim-pinafore-g4h-high',
  'denim-dress-tank-g4h-high',
  'denim-jumpsuit-long-g4h-high',
  'denim-jumpsuit-short-g4h-high',
  'denim-jumpsuit-sleeveless-g4h-high',
  'denim-shorty-jumpsuit-long-g4h-high',
  'denim-shorty-jumpsuit-short-g4h-high',
  'denim-shorty-jumpsuit-sleeveless-g4h-high',
  'denim-micro-romper-long-g4h-high',
  'denim-micro-romper-short-g4h-high',
  'denim-micro-romper-sleeveless-g4h-high',
  'denim-mini-dress-long-g4h-high',
  'denim-mini-dress-short-g4h-high',
  'denim-mini-dress-sleeveless-g4h-high',
  'denim-midi-dress-long-g4h-high',
  'denim-midi-dress-short-g4h-high',
  'denim-midi-dress-sleeveless-g4h-high',
  // Basiques 01 · Maillots de bain (Gemini 4 Hydrogen High)
  'swim-onepiece-classic-g4h-high',
  'swim-onepiece-halter-g4h-high',
  'swim-onepiece-asymmetric-g4h-high',
  'swim-onepiece-training-g4h-high',
  'swim-top-triangle-g4h-high',
  'swim-top-bandeau-g4h-high',
  'swim-top-bralette-g4h-high',
  'swim-top-balconette-g4h-high',
  'swim-top-tankini-g4h-high',
  'swim-trikini-g4h-high',
  'swim-top-rashguard-g4h-high',
  'swim-fullcover-g4h-high',
  // Basiques 02 · Tenues de sport (Gemini 4 Hydrogen High)
  'sport-top-bra-g4h-high',
  'sport-top-tank-g4h-high',
  'sport-top-tshirt-g4h-high',
  'sport-tennis-dress-g4h-high',
  'sport-yoga-unitard-g4h-high',
  'sport-dance-leotard-g4h-high',
  'sport-top-longsleeve-g4h-high',
  'sport-top-sweatshirt-g4h-high',
  'sport-top-trackjacket-g4h-high',
  'sport-cycling-skinsuit-g4h-high',
  // Basiques 03 · Streetwear & Hoodies (Gemini 4 Hydrogen High)
  'street-jumpsuit-hoodie-g4h-high',
  'street-hoodie-sleeveless-g4h-high',
  'street-hoodie-crop-long-g4h-high',
  'street-hoodie-crop-sleeveless-g4h-high',
  'street-dress-hoodie-long-g4h-high',
  'street-dress-hoodie-sleeveless-g4h-high',
  'none',
] as const;

export const LARA_BOTTOM_IDS = [
  'native',
  'bikini',
  'bikini-slip-sol-high',
  'bikini-shorty-sol-high',
  'bikini-tanga-sol-high',
  'bikini-string-sol-high',
  'legging',
  'legging-sol-high',
  'sweatpants',
  'sweatpants-sol-high',
  'denim-jeans-classic-g4h-high',
  'denim-jeans-flare-g4h-high',
  'denim-jeans-high-g4h-high',
  'denim-jeans-ripped-g4h-high',
  'denim-shorts-g4h-high',
  'denim-shorty-g4h-high',
  'denim-skirt-g4h-high',
  // Basiques 01 · Bas maillots (Gemini 4 Hydrogen High)
  'swim-bottom-tie-g4h-high',
  'swim-bottom-classic-g4h-high',
  'swim-bottom-highwaist-g4h-high',
  // Basiques 02 · Bas sport (Gemini 4 Hydrogen High)
  'sport-bottom-legging-g4h-high',
  'sport-bottom-cycliste-g4h-high',
  'sport-bottom-runningshorts-g4h-high',
  'sport-bottom-skort-g4h-high',
  'sport-bottom-flarelegging-g4h-high',
  'sport-bottom-jogging-g4h-high',
  'sport-bottom-trackpants-g4h-high',
  'none',
] as const;

export const LARA_HOODIE_ZIP_IDS = ['closed', 'open-1-3', 'open-2-3', 'open-full'] as const;

export type LaraTopId = (typeof LARA_TOP_IDS)[number];
export type LaraBottomId = (typeof LARA_BOTTOM_IDS)[number];
export type LaraHoodieZip = (typeof LARA_HOODIE_ZIP_IDS)[number];
export type LaraClothing = LaraTopId | LaraBottomId;

export const LARA_HOODIE_ZIP_OPTIONS: ReadonlyArray<{ id: LaraHoodieZip; label: string; suffix: string }> = [
  { id: 'closed', label: 'Fermé', suffix: '' },
  { id: 'open-1-3', label: '1/3 ouvert', suffix: '_open_1_3' },
  { id: 'open-2-3', label: '2/3 ouvert', suffix: '_open_2_3' },
  { id: 'open-full', label: 'Complètement ouvert', suffix: '_open_full' },
];

export interface LaraGarmentSpec {
  id: string;
  label: string;
  glbBasePath?: string;
  hasZipStates?: boolean;
  isOnePiece?: boolean;
}

export const LARA_TOP_SPECS: ReadonlyArray<LaraGarmentSpec & { id: LaraTopId }> = [
  { id: 'native', label: 'Native' },
  { id: 'bikini', label: 'Bikini (natif)' },
  { id: 'bikini-red', label: 'Bikini haut (rouge)', glbBasePath: 'characters/clothing/lara/swimwear/lara_bikini_top_red.glb' },
  { id: 'body-native-red', label: 'Body rouge natif', glbBasePath: 'characters/clothing/lara/swimwear/lara_body_native_red.glb', isOnePiece: true },
  { id: 'onepiece', label: 'Maillot 1 pièce / Body', glbBasePath: 'characters/clothing/lara/swimwear/lara_swimsuit_onepiece.glb', isOnePiece: true },
  { id: 'onepiece-shorty', label: 'Maillot 1 pièce shorty', glbBasePath: 'characters/clothing/lara/swimwear/lara_swimsuit_shorty.glb', isOnePiece: true },
  { id: 'tank-rib', label: 'Débardeur fin côtelé', glbBasePath: 'characters/clothing/lara/tops/lara_tank_rib.glb' },
  { id: 'tshirt', label: 'T-shirt', glbBasePath: 'characters/clothing/lara/tops/lara_tshirt.glb' },
  { id: 'nightgown-tank', label: 'Robe de nuit débardeur', glbBasePath: 'characters/clothing/lara/dresses/lara_nightgown_tank.glb', isOnePiece: true },
  { id: 'nightgown-tshirt', label: 'Robe de nuit t-shirt long', glbBasePath: 'characters/clothing/lara/dresses/lara_nightgown_tshirt.glb', isOnePiece: true },
  { id: 'hoodie', label: 'Sweat zippé', glbBasePath: 'characters/clothing/lara/hoodies/lara_hoodie_zip', hasZipStates: true },
  { id: 'hoodie-crop', label: 'Sweat zippé crop top', glbBasePath: 'characters/clothing/lara/hoodies/lara_hoodie_crop', hasZipStates: true },
  { id: 'hoodie-tank', label: 'Sweat zippé débardeur', glbBasePath: 'characters/clothing/lara/hoodies/lara_hoodie_tank', hasZipStates: true },
  { id: 'hoodie-crop-tank', label: 'Sweat zippé crop débardeur', glbBasePath: 'characters/clothing/lara/hoodies/lara_hoodie_crop_tank', hasZipStates: true },
  { id: 'denim-jacket-cropped-g4h-high', label: 'Veste courte denim · Gemini 4 Hydrogen (High)', glbBasePath: 'characters/clothing/lara/denim/lara_denim_jacket_cropped_g4h_high.glb' },
  { id: 'denim-jacket-classic-g4h-high', label: 'Veste classique denim · Gemini 4 Hydrogen (High)', glbBasePath: 'characters/clothing/lara/denim/lara_denim_jacket_classic_g4h_high.glb' },
  { id: 'denim-vest-cropped-g4h-high', label: 'Veste courte sans manches denim · Gemini 4 Hydrogen (High)', glbBasePath: 'characters/clothing/lara/denim/lara_denim_vest_cropped_g4h_high.glb' },
  { id: 'denim-vest-classic-g4h-high', label: 'Veste classique sans manches denim · Gemini 4 Hydrogen (High)', glbBasePath: 'characters/clothing/lara/denim/lara_denim_vest_classic_g4h_high.glb' },
  { id: 'denim-romper-tank-g4h-high', label: 'Combishort débardeur denim · Gemini 4 Hydrogen (High)', glbBasePath: 'characters/clothing/lara/denim/lara_denim_romper_tank_g4h_high.glb', isOnePiece: true },
  { id: 'denim-overalls-g4h-high', label: 'Salopette denim · Gemini 4 Hydrogen (High)', glbBasePath: 'characters/clothing/lara/denim/lara_denim_overalls_g4h_high.glb', isOnePiece: true },
  { id: 'denim-overalls-short-g4h-high', label: 'Salopette-short denim · Gemini 4 Hydrogen (High)', glbBasePath: 'characters/clothing/lara/denim/lara_denim_overalls_short_g4h_high.glb', isOnePiece: true },
  { id: 'denim-pinafore-g4h-high', label: 'Salopette-jupe denim · Gemini 4 Hydrogen (High)', glbBasePath: 'characters/clothing/lara/denim/lara_denim_pinafore_g4h_high.glb', isOnePiece: true },
  { id: 'denim-dress-tank-g4h-high', label: 'Combi-jupe débardeur denim · Gemini 4 Hydrogen (High)', glbBasePath: 'characters/clothing/lara/denim/lara_denim_dress_tank_g4h_high.glb', isOnePiece: true },
  { id: 'denim-jumpsuit-long-g4h-high', label: 'Combi pantalon droit manches longues · Gemini 4 Hydrogen (High)', glbBasePath: 'characters/clothing/lara/denim/lara_denim_jumpsuit_long_g4h_high.glb', isOnePiece: true },
  { id: 'denim-jumpsuit-short-g4h-high', label: 'Combi pantalon droit manches courtes · Gemini 4 Hydrogen (High)', glbBasePath: 'characters/clothing/lara/denim/lara_denim_jumpsuit_short_g4h_high.glb', isOnePiece: true },
  { id: 'denim-jumpsuit-sleeveless-g4h-high', label: 'Combi pantalon droit sans manches · Gemini 4 Hydrogen (High)', glbBasePath: 'characters/clothing/lara/denim/lara_denim_jumpsuit_sleeveless_g4h_high.glb', isOnePiece: true },
  { id: 'denim-shorty-jumpsuit-long-g4h-high', label: 'Combi shorty manches longues · Gemini 4 Hydrogen (High)', glbBasePath: 'characters/clothing/lara/denim/lara_denim_shorty_jumpsuit_long_g4h_high.glb', isOnePiece: true },
  { id: 'denim-shorty-jumpsuit-short-g4h-high', label: 'Combi shorty manches courtes · Gemini 4 Hydrogen (High)', glbBasePath: 'characters/clothing/lara/denim/lara_denim_shorty_jumpsuit_short_g4h_high.glb', isOnePiece: true },
  { id: 'denim-shorty-jumpsuit-sleeveless-g4h-high', label: 'Combi shorty sans manches · Gemini 4 Hydrogen (High)', glbBasePath: 'characters/clothing/lara/denim/lara_denim_shorty_jumpsuit_sleeveless_g4h_high.glb', isOnePiece: true },
  { id: 'denim-micro-romper-long-g4h-high', label: 'Combi shorty très court manches longues · Gemini 4 Hydrogen (High)', glbBasePath: 'characters/clothing/lara/denim/lara_denim_micro_romper_long_g4h_high.glb', isOnePiece: true },
  { id: 'denim-micro-romper-short-g4h-high', label: 'Combi shorty très court manches courtes · Gemini 4 Hydrogen (High)', glbBasePath: 'characters/clothing/lara/denim/lara_denim_micro_romper_short_g4h_high.glb', isOnePiece: true },
  { id: 'denim-micro-romper-sleeveless-g4h-high', label: 'Combi shorty très court sans manches · Gemini 4 Hydrogen (High)', glbBasePath: 'characters/clothing/lara/denim/lara_denim_micro_romper_sleeveless_g4h_high.glb', isOnePiece: true },
  { id: 'denim-mini-dress-long-g4h-high', label: 'Combi-jupe manches longues · Gemini 4 Hydrogen (High)', glbBasePath: 'characters/clothing/lara/denim/lara_denim_mini_dress_long_g4h_high.glb', isOnePiece: true },
  { id: 'denim-mini-dress-short-g4h-high', label: 'Combi-jupe manches courtes · Gemini 4 Hydrogen (High)', glbBasePath: 'characters/clothing/lara/denim/lara_denim_mini_dress_short_g4h_high.glb', isOnePiece: true },
  { id: 'denim-mini-dress-sleeveless-g4h-high', label: 'Combi-jupe sans manches · Gemini 4 Hydrogen (High)', glbBasePath: 'characters/clothing/lara/denim/lara_denim_mini_dress_sleeveless_g4h_high.glb', isOnePiece: true },
  { id: 'denim-midi-dress-long-g4h-high', label: 'Robe midi manches longues · Gemini 4 Hydrogen (High)', glbBasePath: 'characters/clothing/lara/denim/lara_denim_midi_dress_long_g4h_high.glb', isOnePiece: true },
  { id: 'denim-midi-dress-short-g4h-high', label: 'Robe midi manches courtes · Gemini 4 Hydrogen (High)', glbBasePath: 'characters/clothing/lara/denim/lara_denim_midi_dress_short_g4h_high.glb', isOnePiece: true },
  { id: 'denim-midi-dress-sleeveless-g4h-high', label: 'Robe midi sans manches · Gemini 4 Hydrogen (High)', glbBasePath: 'characters/clothing/lara/denim/lara_denim_midi_dress_sleeveless_g4h_high.glb', isOnePiece: true },
  // Basiques 01 · Maillots de bain (Gemini 4 Hydrogen High)
  { id: 'swim-onepiece-classic-g4h-high', label: 'Une-pièce classique · Gemini 4 Hydrogen (High)', glbBasePath: 'characters/clothing/lara/swimwear/lara_swim_onepiece_classic_g4h_high.glb', isOnePiece: true },
  { id: 'swim-onepiece-halter-g4h-high', label: 'Une-pièce dos nu · Gemini 4 Hydrogen (High)', glbBasePath: 'characters/clothing/lara/swimwear/lara_swim_onepiece_halter_g4h_high.glb', isOnePiece: true },
  { id: 'swim-onepiece-asymmetric-g4h-high', label: 'Une-pièce asymétrique · Gemini 4 Hydrogen (High)', glbBasePath: 'characters/clothing/lara/swimwear/lara_swim_onepiece_asymmetric_g4h_high.glb', isOnePiece: true },
  { id: 'swim-onepiece-training-g4h-high', label: 'Maillot de natation · Gemini 4 Hydrogen (High)', glbBasePath: 'characters/clothing/lara/swimwear/lara_swim_onepiece_training_g4h_high.glb', isOnePiece: true },
  { id: 'swim-top-triangle-g4h-high', label: 'Bikini triangle (haut) · Gemini 4 Hydrogen (High)', glbBasePath: 'characters/clothing/lara/swimwear/lara_swim_top_triangle_g4h_high.glb' },
  { id: 'swim-top-bandeau-g4h-high', label: 'Bikini bandeau (haut) · Gemini 4 Hydrogen (High)', glbBasePath: 'characters/clothing/lara/swimwear/lara_swim_top_bandeau_g4h_high.glb' },
  { id: 'swim-top-bralette-g4h-high', label: 'Bikini brassière (haut) · Gemini 4 Hydrogen (High)', glbBasePath: 'characters/clothing/lara/swimwear/lara_swim_top_bralette_g4h_high.glb' },
  { id: 'swim-top-balconette-g4h-high', label: 'Bikini taille haute (haut) · Gemini 4 Hydrogen (High)', glbBasePath: 'characters/clothing/lara/swimwear/lara_swim_top_balconette_g4h_high.glb' },
  { id: 'swim-top-tankini-g4h-high', label: 'Tankini (haut) · Gemini 4 Hydrogen (High)', glbBasePath: 'characters/clothing/lara/swimwear/lara_swim_top_tankini_g4h_high.glb' },
  { id: 'swim-trikini-g4h-high', label: 'Trikini · Gemini 4 Hydrogen (High)', glbBasePath: 'characters/clothing/lara/swimwear/lara_swim_trikini_g4h_high.glb', isOnePiece: true },
  { id: 'swim-top-rashguard-g4h-high', label: 'Maillot de surf (haut) · Gemini 4 Hydrogen (High)', glbBasePath: 'characters/clothing/lara/swimwear/lara_swim_top_rashguard_g4h_high.glb' },
  { id: 'swim-fullcover-g4h-high', label: 'Maillot couvrant · Gemini 4 Hydrogen (High)', glbBasePath: 'characters/clothing/lara/swimwear/lara_swim_fullcover_g4h_high.glb', isOnePiece: true },
  // Basiques 02 · Tenues de sport (Gemini 4 Hydrogen High)
  { id: 'sport-top-bra-g4h-high', label: 'Brassière de sport · Gemini 4 Hydrogen (High)', glbBasePath: 'characters/clothing/lara/sport/lara_sport_top_bra_g4h_high.glb' },
  { id: 'sport-top-tank-g4h-high', label: 'Débardeur de sport · Gemini 4 Hydrogen (High)', glbBasePath: 'characters/clothing/lara/sport/lara_sport_top_tank_g4h_high.glb' },
  { id: 'sport-top-tshirt-g4h-high', label: 'T-shirt de sport · Gemini 4 Hydrogen (High)', glbBasePath: 'characters/clothing/lara/sport/lara_sport_top_tshirt_g4h_high.glb' },
  { id: 'sport-tennis-dress-g4h-high', label: 'Robe de tennis · Gemini 4 Hydrogen (High)', glbBasePath: 'characters/clothing/lara/sport/lara_sport_tennis_dress_g4h_high.glb', isOnePiece: true },
  { id: 'sport-yoga-unitard-g4h-high', label: 'Combinaison de yoga · Gemini 4 Hydrogen (High)', glbBasePath: 'characters/clothing/lara/sport/lara_sport_yoga_unitard_g4h_high.glb', isOnePiece: true },
  { id: 'sport-dance-leotard-g4h-high', label: 'Justaucorps de danse · Gemini 4 Hydrogen (High)', glbBasePath: 'characters/clothing/lara/sport/lara_sport_dance_leotard_g4h_high.glb', isOnePiece: true },
  { id: 'sport-top-longsleeve-g4h-high', label: 'Haut manches longues sport · Gemini 4 Hydrogen (High)', glbBasePath: 'characters/clothing/lara/sport/lara_sport_top_longsleeve_g4h_high.glb' },
  { id: 'sport-top-sweatshirt-g4h-high', label: 'Sweat crewneck · Gemini 4 Hydrogen (High)', glbBasePath: 'characters/clothing/lara/sport/lara_sport_top_sweatshirt_g4h_high.glb' },
  { id: 'sport-top-trackjacket-g4h-high', label: 'Veste zippée sport · Gemini 4 Hydrogen (High)', glbBasePath: 'characters/clothing/lara/sport/lara_sport_top_trackjacket_g4h_high.glb' },
  { id: 'sport-cycling-skinsuit-g4h-high', label: 'Combinaison de cyclisme · Gemini 4 Hydrogen (High)', glbBasePath: 'characters/clothing/lara/sport/lara_sport_cycling_skinsuit_g4h_high.glb', isOnePiece: true },
  // Basiques 03 · Streetwear & Hoodies (Gemini 4 Hydrogen High)
  { id: 'street-jumpsuit-hoodie-g4h-high', label: 'Combinaison streetwear · Gemini 4 Hydrogen (High)', glbBasePath: 'characters/clothing/lara/streetwear/lara_street_jumpsuit_hoodie_g4h_high.glb', isOnePiece: true },
  { id: 'street-hoodie-sleeveless-g4h-high', label: 'Hoodie zippé sans manches · Gemini 4 Hydrogen (High)', glbBasePath: 'characters/clothing/lara/streetwear/lara_street_hoodie_sleeveless_g4h_high.glb' },
  { id: 'street-hoodie-crop-long-g4h-high', label: 'Hoodie zippé court manches longues · Gemini 4 Hydrogen (High)', glbBasePath: 'characters/clothing/lara/streetwear/lara_street_hoodie_crop_long_g4h_high.glb' },
  { id: 'street-hoodie-crop-sleeveless-g4h-high', label: 'Hoodie zippé court sans manches · Gemini 4 Hydrogen (High)', glbBasePath: 'characters/clothing/lara/streetwear/lara_street_hoodie_crop_sleeveless_g4h_high.glb' },
  { id: 'street-dress-hoodie-long-g4h-high', label: 'Robe hoodie zippée manches longues · Gemini 4 Hydrogen (High)', glbBasePath: 'characters/clothing/lara/streetwear/lara_street_dress_hoodie_long_g4h_high.glb', isOnePiece: true },
  { id: 'street-dress-hoodie-sleeveless-g4h-high', label: 'Robe hoodie zippée sans manches · Gemini 4 Hydrogen (High)', glbBasePath: 'characters/clothing/lara/streetwear/lara_street_dress_hoodie_sleeveless_g4h_high.glb', isOnePiece: true },
  { id: 'none', label: 'Aucun' },
];

export const LARA_BOTTOM_SPECS: ReadonlyArray<LaraGarmentSpec & { id: LaraBottomId }> = [
  { id: 'native', label: 'Native' },
  { id: 'bikini', label: 'Bikini (natif)' },
  { id: 'bikini-slip-sol-high', label: 'Bas maillot slip · GPT-6.1-Sol high', glbBasePath: 'characters/clothing/lara/swimwear/lara_bikini_slip_sol_high.glb' },
  { id: 'bikini-shorty-sol-high', label: 'Bas maillot shorty · GPT-6.1-Sol high', glbBasePath: 'characters/clothing/lara/swimwear/lara_bikini_shorty_sol_high.glb' },
  { id: 'bikini-tanga-sol-high', label: 'Bas maillot tanga · GPT-6.1-Sol high', glbBasePath: 'characters/clothing/lara/swimwear/lara_bikini_tanga_sol_high.glb' },
  { id: 'bikini-string-sol-high', label: 'Bas maillot string · GPT-6.1-Sol high', glbBasePath: 'characters/clothing/lara/swimwear/lara_bikini_string_sol_high.glb' },
  { id: 'legging', label: 'Legging', glbBasePath: 'characters/clothing/lara/bottoms/lara_legging.glb' },
  { id: 'legging-sol-high', label: 'Legging · GPT-6.1-Sol high', glbBasePath: 'characters/clothing/lara/bottoms/lara_legging_sol_high.glb' },
  { id: 'sweatpants', label: 'Jogging', glbBasePath: 'characters/clothing/lara/bottoms/lara_sweatpants.glb' },
  { id: 'sweatpants-sol-high', label: 'Jogging · GPT-6.1-Sol high', glbBasePath: 'characters/clothing/lara/bottoms/lara_sweatpants_sol_high.glb' },
  { id: 'denim-jeans-classic-g4h-high', label: 'Jean classique · Gemini 4 Hydrogen (High)', glbBasePath: 'characters/clothing/lara/denim/lara_denim_jeans_classic_g4h_high.glb' },
  { id: 'denim-jeans-flare-g4h-high', label: 'Jean évasé à la cheville · Gemini 4 Hydrogen (High)', glbBasePath: 'characters/clothing/lara/denim/lara_denim_jeans_flare_g4h_high.glb' },
  { id: 'denim-jeans-high-g4h-high', label: 'Jean taille haute · Gemini 4 Hydrogen (High)', glbBasePath: 'characters/clothing/lara/denim/lara_denim_jeans_high_g4h_high.glb' },
  { id: 'denim-jeans-ripped-g4h-high', label: 'Jean déchiré · Gemini 4 Hydrogen (High)', glbBasePath: 'characters/clothing/lara/denim/lara_denim_jeans_ripped_g4h_high.glb' },
  { id: 'denim-shorts-g4h-high', label: 'Short en jean · Gemini 4 Hydrogen (High)', glbBasePath: 'characters/clothing/lara/denim/lara_denim_shorts_g4h_high.glb' },
  { id: 'denim-shorty-g4h-high', label: 'Shorty en jean · Gemini 4 Hydrogen (High)', glbBasePath: 'characters/clothing/lara/denim/lara_denim_shorty_g4h_high.glb' },
  { id: 'denim-skirt-g4h-high', label: 'Jupe en jean · Gemini 4 Hydrogen (High)', glbBasePath: 'characters/clothing/lara/denim/lara_denim_skirt_g4h_high.glb' },
  // Basiques 01 · Bas maillots (Gemini 4 Hydrogen High)
  { id: 'swim-bottom-tie-g4h-high', label: 'Bas bikini noué · Gemini 4 Hydrogen (High)', glbBasePath: 'characters/clothing/lara/swimwear/lara_swim_bottom_tie_g4h_high.glb' },
  { id: 'swim-bottom-classic-g4h-high', label: 'Bas bikini classique · Gemini 4 Hydrogen (High)', glbBasePath: 'characters/clothing/lara/swimwear/lara_swim_bottom_classic_g4h_high.glb' },
  { id: 'swim-bottom-highwaist-g4h-high', label: 'Bas bikini taille haute · Gemini 4 Hydrogen (High)', glbBasePath: 'characters/clothing/lara/swimwear/lara_swim_bottom_highwaist_g4h_high.glb' },
  // Basiques 02 · Bas sport (Gemini 4 Hydrogen High)
  { id: 'sport-bottom-legging-g4h-high', label: 'Legging sport · Gemini 4 Hydrogen (High)', glbBasePath: 'characters/clothing/lara/sport/lara_sport_bottom_legging_g4h_high.glb' },
  { id: 'sport-bottom-cycliste-g4h-high', label: 'Cycliste sport · Gemini 4 Hydrogen (High)', glbBasePath: 'characters/clothing/lara/sport/lara_sport_bottom_cycliste_g4h_high.glb' },
  { id: 'sport-bottom-runningshorts-g4h-high', label: 'Short de course · Gemini 4 Hydrogen (High)', glbBasePath: 'characters/clothing/lara/sport/lara_sport_bottom_runningshorts_g4h_high.glb' },
  { id: 'sport-bottom-skort-g4h-high', label: 'Jupe-short sport · Gemini 4 Hydrogen (High)', glbBasePath: 'characters/clothing/lara/sport/lara_sport_bottom_skort_g4h_high.glb' },
  { id: 'sport-bottom-flarelegging-g4h-high', label: 'Legging évasé · Gemini 4 Hydrogen (High)', glbBasePath: 'characters/clothing/lara/sport/lara_sport_bottom_flarelegging_g4h_high.glb' },
  { id: 'sport-bottom-jogging-g4h-high', label: 'Jogging sport · Gemini 4 Hydrogen (High)', glbBasePath: 'characters/clothing/lara/sport/lara_sport_bottom_jogging_g4h_high.glb' },
  { id: 'sport-bottom-trackpants-g4h-high', label: 'Pantalon sport · Gemini 4 Hydrogen (High)', glbBasePath: 'characters/clothing/lara/sport/lara_sport_bottom_trackpants_g4h_high.glb' },
  { id: 'none', label: 'Aucun' },
];

export const LARA_EXTRA_CLOTHING_PATHS = {
  'socks-red': 'characters/clothing/lara/footwear/lara_socks_red.glb',
  'sneakers-red': 'characters/clothing/lara/footwear/lara_sneakers_red.glb',
  'bandana-neck': 'characters/clothing/lara/accessories/lara_bandana_neck.glb',
  'bandana-wrist': 'characters/clothing/lara/accessories/lara_bandana_wrist.glb',
} as const;

export type LaraExtraClothingId = keyof typeof LARA_EXTRA_CLOTHING_PATHS;

const TOP_SPEC_MAP = new Map<string, LaraGarmentSpec>(LARA_TOP_SPECS.map((s) => [s.id, s]));
const BOTTOM_SPEC_MAP = new Map<string, LaraGarmentSpec>(LARA_BOTTOM_SPECS.map((s) => [s.id, s]));
const ZIP_SUFFIX_MAP = new Map<LaraHoodieZip, string>(LARA_HOODIE_ZIP_OPTIONS.map((z) => [z.id, z.suffix]));
const ZIP_LABEL_MAP = new Map<LaraHoodieZip, string>(LARA_HOODIE_ZIP_OPTIONS.map((z) => [z.id, z.label]));

export interface LaraOutfitSummary {
  title: string;
  details: string;
}

export function formatLaraOutfitSummary(layers: {
  laraTop: LaraClothing;
  laraBottom: LaraClothing;
  laraHoodieZip?: LaraHoodieZip;
  laraShoes?: boolean;
  laraSocks?: boolean;
  laraSneakers?: boolean;
  laraPistols?: boolean;
  laraGlasses?: boolean;
  accessories?: boolean;
  laraNeckBandana?: boolean;
  laraWristBandana?: boolean;
}): LaraOutfitSummary {
  const topBase = TOP_SPEC_MAP.get(layers.laraTop)?.label ?? layers.laraTop;
  const topLabel = isHoodieTop(layers.laraTop)
    ? `${topBase} (${ZIP_LABEL_MAP.get(layers.laraHoodieZip ?? 'closed') ?? 'Fermé'})`
    : topBase;
  const bottomLabel = layers.laraBottom !== 'none'
    ? (BOTTOM_SPEC_MAP.get(layers.laraBottom)?.label ?? layers.laraBottom)
    : null;
  const title = bottomLabel ? `${topLabel} + ${bottomLabel}` : topLabel;

  const extras: string[] = [];
  if (layers.laraShoes) extras.push('Bottes');
  if (layers.laraSneakers) extras.push('Baskets rouges');
  if (layers.laraSocks) extras.push('Chaussettes rouges');
  if (layers.laraGlasses) extras.push('Lunettes');
  if (layers.laraPistols) extras.push('Pistolets');
  if (layers.accessories) extras.push('Accessoires');
  if (layers.laraNeckBandana) extras.push('Bandana cou');
  if (layers.laraWristBandana) extras.push('Bandana poignet');

  return {
    title,
    details: extras.length > 0 ? extras.join(' · ') : 'Sans accessoires',
  };
}

export function isHoodieTop(id: LaraClothing): boolean {
  return Boolean(TOP_SPEC_MAP.get(id)?.hasZipStates);
}

export function isOnePieceTop(id: LaraClothing): boolean {
  return Boolean(TOP_SPEC_MAP.get(id)?.isOnePiece);
}

export function resolveLaraGarmentGlbPath(
  id: LaraClothing | LaraExtraClothingId,
  hoodieZip: LaraHoodieZip = 'closed',
): string | null {
  if (id in LARA_EXTRA_CLOTHING_PATHS) {
    return LARA_EXTRA_CLOTHING_PATHS[id as LaraExtraClothingId];
  }
  const topSpec = TOP_SPEC_MAP.get(id);
  if (topSpec?.glbBasePath) {
    if (topSpec.hasZipStates) {
      const suffix = ZIP_SUFFIX_MAP.get(hoodieZip) ?? '';
      return `${topSpec.glbBasePath}${suffix}.glb`;
    }
    return topSpec.glbBasePath;
  }
  const bottomSpec = BOTTOM_SPEC_MAP.get(id);
  return bottomSpec?.glbBasePath ?? null;
}

export const ALL_LARA_CLOTHING_VALUES = new Set<LaraClothing>([
  ...LARA_TOP_IDS,
  ...LARA_BOTTOM_IDS,
]);
