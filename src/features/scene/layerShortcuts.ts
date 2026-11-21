import type { LayerState } from './sidepanel/types';

export interface LayerShortcutEntry {
  layerKey: keyof LayerState;
  shortcut: string;
  key: string;
  codes?: readonly string[];
  alt?: boolean;
  shift?: boolean;
  modalLabel: string;
  modalIcon?: string;
}

/**
 * Source unique de vérité pour les raccourcis clavier de bascule des calques.
 * Utilisée par :
 * - Studio.tsx (écoute clavier)
 * - LayersSection.tsx (affichage du raccourci sur les boutons de calques)
 * - ShortcutsModal.tsx (liste des raccourcis dans la modale d'aide)
 */
export const LAYER_SHORTCUTS: readonly LayerShortcutEntry[] = [
  { layerKey: 'extraCharacters',    shortcut: 'Alt+E',       key: 'e', alt: true,              modalLabel: 'Personnages Extra',                modalIcon: 'bi-masks-theater' },
  { layerKey: 'aiZones',            shortcut: 'Shift+A',     key: 'a',            shift: true, modalLabel: 'Zones IA' },
  { layerKey: 'laraPistols',        shortcut: '7',           key: '7', codes: ['Digit7', 'Numpad7'], modalLabel: 'Pistolets Lara',            modalIcon: 'bi-crosshair' },
  { layerKey: 'accessories',        shortcut: '8',           key: '8', codes: ['Digit8', 'Numpad8'], modalLabel: 'Accessoires Lara',          modalIcon: 'bi-handbag' },
  { layerKey: 'grid',               shortcut: 'Alt+B',       key: 'b', alt: true,              modalLabel: 'Afficher / masquer la grille' },
  { layerKey: 'wireframe',          shortcut: 'W',           key: 'w',                         modalLabel: 'Wireframe coloré',                 modalIcon: 'bi-grid-3x3' },
  { layerKey: 'laraShoes',          shortcut: 'Shift+V',     key: 'v',            shift: true, modalLabel: 'Chaussures Lara' },
  { layerKey: 'laraGlasses',        shortcut: 'Shift+B',     key: 'b',            shift: true, modalLabel: 'Lunettes Lara' },
  { layerKey: 'skeleton',           shortcut: 'K',           key: 'k',                         modalLabel: 'Squelettes / Bones' },
  { layerKey: 'wallStructure',      shortcut: 'Alt+W',       key: 'w', alt: true,              modalLabel: 'Structure murale' },
  { layerKey: 'cutWalls',           shortcut: 'Alt+S',       key: 's', alt: true,              modalLabel: 'Murs coupés à 1,35 m' },
  { layerKey: 'structure',          shortcut: 'Alt+Q',       key: 'q', alt: true,              modalLabel: 'Dalle et plafond' },
  { layerKey: 'furniture',          shortcut: 'Alt+F',       key: 'f', alt: true,              modalLabel: 'Mobilier' },
  { layerKey: 'decor',              shortcut: 'Alt+D',       key: 'd', alt: true,              modalLabel: 'Décoration' },
  { layerKey: 'furnishings',        shortcut: 'Alt+H',       key: 'h', alt: true,              modalLabel: 'Habillage' },
  { layerKey: 'equipment',          shortcut: 'Alt+U',       key: 'u', alt: true,              modalLabel: 'Équipements' },
  { layerKey: 'wallEdges',          shortcut: 'Alt+A',       key: 'a', alt: true,              modalLabel: 'Arêtes des murs' },
  { layerKey: 'pillarsOnly',        shortcut: 'Alt+Shift+P', key: 'p', alt: true, shift: true, modalLabel: 'Piliers seuls' },
  { layerKey: 'inventoryGrid',      shortcut: 'Alt+I',       key: 'i', alt: true,              modalLabel: 'Grille des objets d’inventaire',   modalIcon: 'bi-box-seam' },
  { layerKey: 'measuredDimensions', shortcut: 'Alt+M',       key: 'm', alt: true,              modalLabel: 'Mesures réelles',                  modalIcon: 'bi-rulers' },
];

export const LAYER_SHORTCUT_BY_LAYER: Partial<Record<keyof LayerState, string>> = Object.fromEntries(
  LAYER_SHORTCUTS.map(entry => [entry.layerKey, entry.shortcut]),
);

export function matchLayerShortcut(e: KeyboardEvent): LayerShortcutEntry | undefined {
  if (e.ctrlKey || e.metaKey) return undefined;
  const k = e.key.toLowerCase();
  return LAYER_SHORTCUTS.find(entry => {
    if (Boolean(entry.alt) !== e.altKey) return false;
    if (Boolean(entry.shift) !== e.shiftKey) return false;
    if (k === entry.key) return true;
    if (entry.codes?.includes(e.code)) return true;
    if (entry.shift && e.code === `Key${entry.key.toUpperCase()}`) return true;
    return false;
  });
}
