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
  'denim-jacket-cropped-g4h-medium',
  'denim-jacket-classic-g4h-medium',
  'denim-vest-cropped-g4h-medium',
  'denim-vest-classic-g4h-medium',
  'denim-romper-tank-g4h-medium',
  'denim-overalls-g4h-medium',
  'denim-overalls-short-g4h-medium',
  'denim-pinafore-g4h-medium',
  'denim-dress-tank-g4h-medium',
  'denim-jumpsuit-long-g4h-medium',
  'denim-jumpsuit-short-g4h-medium',
  'denim-jumpsuit-sleeveless-g4h-medium',
  'denim-shorty-jumpsuit-long-g4h-medium',
  'denim-shorty-jumpsuit-short-g4h-medium',
  'denim-shorty-jumpsuit-sleeveless-g4h-medium',
  'denim-micro-romper-long-g4h-medium',
  'denim-micro-romper-short-g4h-medium',
  'denim-micro-romper-sleeveless-g4h-medium',
  'denim-mini-dress-long-g4h-medium',
  'denim-mini-dress-short-g4h-medium',
  'denim-mini-dress-sleeveless-g4h-medium',
  'denim-midi-dress-long-g4h-medium',
  'denim-midi-dress-short-g4h-medium',
  'denim-midi-dress-sleeveless-g4h-medium',
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
  'denim-jeans-classic-g4h-medium',
  'denim-jeans-flare-g4h-medium',
  'denim-jeans-high-g4h-medium',
  'denim-jeans-ripped-g4h-medium',
  'denim-shorts-g4h-medium',
  'denim-shorty-g4h-medium',
  'denim-skirt-g4h-medium',
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
  { id: 'denim-jacket-cropped-g4h-medium', label: 'Veste courte denim · Gemini 4 Hydrogen medium', glbBasePath: 'characters/clothing/lara/denim/lara_denim_jacket_cropped_g4h_medium.glb' },
  { id: 'denim-jacket-classic-g4h-medium', label: 'Veste classique denim · Gemini 4 Hydrogen medium', glbBasePath: 'characters/clothing/lara/denim/lara_denim_jacket_classic_g4h_medium.glb' },
  { id: 'denim-vest-cropped-g4h-medium', label: 'Veste courte sans manches denim · Gemini 4 Hydrogen medium', glbBasePath: 'characters/clothing/lara/denim/lara_denim_vest_cropped_g4h_medium.glb' },
  { id: 'denim-vest-classic-g4h-medium', label: 'Veste classique sans manches denim · Gemini 4 Hydrogen medium', glbBasePath: 'characters/clothing/lara/denim/lara_denim_vest_classic_g4h_medium.glb' },
  { id: 'denim-romper-tank-g4h-medium', label: 'Combishort débardeur denim · Gemini 4 Hydrogen medium', glbBasePath: 'characters/clothing/lara/denim/lara_denim_romper_tank_g4h_medium.glb', isOnePiece: true },
  { id: 'denim-overalls-g4h-medium', label: 'Salopette denim · Gemini 4 Hydrogen medium', glbBasePath: 'characters/clothing/lara/denim/lara_denim_overalls_g4h_medium.glb', isOnePiece: true },
  { id: 'denim-overalls-short-g4h-medium', label: 'Salopette-short denim · Gemini 4 Hydrogen medium', glbBasePath: 'characters/clothing/lara/denim/lara_denim_overalls_short_g4h_medium.glb', isOnePiece: true },
  { id: 'denim-pinafore-g4h-medium', label: 'Salopette-jupe denim · Gemini 4 Hydrogen medium', glbBasePath: 'characters/clothing/lara/denim/lara_denim_pinafore_g4h_medium.glb', isOnePiece: true },
  { id: 'denim-dress-tank-g4h-medium', label: 'Combi-jupe débardeur denim · Gemini 4 Hydrogen medium', glbBasePath: 'characters/clothing/lara/denim/lara_denim_dress_tank_g4h_medium.glb', isOnePiece: true },
  { id: 'denim-jumpsuit-long-g4h-medium', label: 'Combi pantalon droit manches longues · Gemini 4 Hydrogen medium', glbBasePath: 'characters/clothing/lara/denim/lara_denim_jumpsuit_long_g4h_medium.glb', isOnePiece: true },
  { id: 'denim-jumpsuit-short-g4h-medium', label: 'Combi pantalon droit manches courtes · Gemini 4 Hydrogen medium', glbBasePath: 'characters/clothing/lara/denim/lara_denim_jumpsuit_short_g4h_medium.glb', isOnePiece: true },
  { id: 'denim-jumpsuit-sleeveless-g4h-medium', label: 'Combi pantalon droit sans manches · Gemini 4 Hydrogen medium', glbBasePath: 'characters/clothing/lara/denim/lara_denim_jumpsuit_sleeveless_g4h_medium.glb', isOnePiece: true },
  { id: 'denim-shorty-jumpsuit-long-g4h-medium', label: 'Combi shorty manches longues · Gemini 4 Hydrogen medium', glbBasePath: 'characters/clothing/lara/denim/lara_denim_shorty_jumpsuit_long_g4h_medium.glb', isOnePiece: true },
  { id: 'denim-shorty-jumpsuit-short-g4h-medium', label: 'Combi shorty manches courtes · Gemini 4 Hydrogen medium', glbBasePath: 'characters/clothing/lara/denim/lara_denim_shorty_jumpsuit_short_g4h_medium.glb', isOnePiece: true },
  { id: 'denim-shorty-jumpsuit-sleeveless-g4h-medium', label: 'Combi shorty sans manches · Gemini 4 Hydrogen medium', glbBasePath: 'characters/clothing/lara/denim/lara_denim_shorty_jumpsuit_sleeveless_g4h_medium.glb', isOnePiece: true },
  { id: 'denim-micro-romper-long-g4h-medium', label: 'Combi shorty très court manches longues · Gemini 4 Hydrogen medium', glbBasePath: 'characters/clothing/lara/denim/lara_denim_micro_romper_long_g4h_medium.glb', isOnePiece: true },
  { id: 'denim-micro-romper-short-g4h-medium', label: 'Combi shorty très court manches courtes · Gemini 4 Hydrogen medium', glbBasePath: 'characters/clothing/lara/denim/lara_denim_micro_romper_short_g4h_medium.glb', isOnePiece: true },
  { id: 'denim-micro-romper-sleeveless-g4h-medium', label: 'Combi shorty très court sans manches · Gemini 4 Hydrogen medium', glbBasePath: 'characters/clothing/lara/denim/lara_denim_micro_romper_sleeveless_g4h_medium.glb', isOnePiece: true },
  { id: 'denim-mini-dress-long-g4h-medium', label: 'Combi-jupe manches longues · Gemini 4 Hydrogen medium', glbBasePath: 'characters/clothing/lara/denim/lara_denim_mini_dress_long_g4h_medium.glb', isOnePiece: true },
  { id: 'denim-mini-dress-short-g4h-medium', label: 'Combi-jupe manches courtes · Gemini 4 Hydrogen medium', glbBasePath: 'characters/clothing/lara/denim/lara_denim_mini_dress_short_g4h_medium.glb', isOnePiece: true },
  { id: 'denim-mini-dress-sleeveless-g4h-medium', label: 'Combi-jupe sans manches · Gemini 4 Hydrogen medium', glbBasePath: 'characters/clothing/lara/denim/lara_denim_mini_dress_sleeveless_g4h_medium.glb', isOnePiece: true },
  { id: 'denim-midi-dress-long-g4h-medium', label: 'Robe midi manches longues · Gemini 4 Hydrogen medium', glbBasePath: 'characters/clothing/lara/denim/lara_denim_midi_dress_long_g4h_medium.glb', isOnePiece: true },
  { id: 'denim-midi-dress-short-g4h-medium', label: 'Robe midi manches courtes · Gemini 4 Hydrogen medium', glbBasePath: 'characters/clothing/lara/denim/lara_denim_midi_dress_short_g4h_medium.glb', isOnePiece: true },
  { id: 'denim-midi-dress-sleeveless-g4h-medium', label: 'Robe midi sans manches · Gemini 4 Hydrogen medium', glbBasePath: 'characters/clothing/lara/denim/lara_denim_midi_dress_sleeveless_g4h_medium.glb', isOnePiece: true },
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
  { id: 'denim-jeans-classic-g4h-medium', label: 'Jean classique · Gemini 4 Hydrogen medium', glbBasePath: 'characters/clothing/lara/denim/lara_denim_jeans_classic_g4h_medium.glb' },
  { id: 'denim-jeans-flare-g4h-medium', label: 'Jean évasé à la cheville · Gemini 4 Hydrogen medium', glbBasePath: 'characters/clothing/lara/denim/lara_denim_jeans_flare_g4h_medium.glb' },
  { id: 'denim-jeans-high-g4h-medium', label: 'Jean taille haute · Gemini 4 Hydrogen medium', glbBasePath: 'characters/clothing/lara/denim/lara_denim_jeans_high_g4h_medium.glb' },
  { id: 'denim-jeans-ripped-g4h-medium', label: 'Jean déchiré · Gemini 4 Hydrogen medium', glbBasePath: 'characters/clothing/lara/denim/lara_denim_jeans_ripped_g4h_medium.glb' },
  { id: 'denim-shorts-g4h-medium', label: 'Short en jean · Gemini 4 Hydrogen medium', glbBasePath: 'characters/clothing/lara/denim/lara_denim_shorts_g4h_medium.glb' },
  { id: 'denim-shorty-g4h-medium', label: 'Shorty en jean · Gemini 4 Hydrogen medium', glbBasePath: 'characters/clothing/lara/denim/lara_denim_shorty_g4h_medium.glb' },
  { id: 'denim-skirt-g4h-medium', label: 'Jupe en jean · Gemini 4 Hydrogen medium', glbBasePath: 'characters/clothing/lara/denim/lara_denim_skirt_g4h_medium.glb' },
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
