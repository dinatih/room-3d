/**
 * laraOutfits.ts — Registre unique des tenues et accessoires sur mesure de Lara.
 * Source de vérité partagée par types.ts, layerUrlParams.ts, CharacterClothing.tsx,
 * Character.tsx et CharacterSection.tsx.
 */

export const LARA_TOP_IDS = [
  'native',
  'bikini',
  'bikini-red',
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
  'none',
] as const;

export const LARA_BOTTOM_IDS = [
  'native',
  'bikini',
  'bikini-slip',
  'bikini-shorty',
  'bikini-tanga',
  'bikini-string',
  'legging',
  'sweatpants',
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
  { id: 'none', label: 'Aucun' },
];

export const LARA_BOTTOM_SPECS: ReadonlyArray<LaraGarmentSpec & { id: LaraBottomId }> = [
  { id: 'native', label: 'Native' },
  { id: 'bikini', label: 'Bikini (natif)' },
  { id: 'bikini-slip', label: 'Bas maillot slip', glbBasePath: 'characters/clothing/lara/swimwear/lara_bikini_slip.glb' },
  { id: 'bikini-shorty', label: 'Bas maillot shorty', glbBasePath: 'characters/clothing/lara/swimwear/lara_bikini_shorty.glb' },
  { id: 'bikini-tanga', label: 'Bas maillot tanga', glbBasePath: 'characters/clothing/lara/swimwear/lara_bikini_tanga.glb' },
  { id: 'bikini-string', label: 'Bas maillot string', glbBasePath: 'characters/clothing/lara/swimwear/lara_bikini_string.glb' },
  { id: 'legging', label: 'Legging', glbBasePath: 'characters/clothing/lara/bottoms/lara_legging.glb' },
  { id: 'sweatpants', label: 'Jogging', glbBasePath: 'characters/clothing/lara/bottoms/lara_sweatpants.glb' },
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
