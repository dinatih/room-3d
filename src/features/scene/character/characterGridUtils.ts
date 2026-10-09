import { CHARACTERS, isCharacterVisibleInMode, type LaraCountMode } from '../characterConfig';
import { useCharacterGridStore } from './useCharacterGridStore';
import { useSceneStore } from '@features/scene/store/useSceneStore';

export const CHARACTER_GRID_CONFIG = {
  cols: 5,
  colSpacing: 120,      // 120 cm entre chaque personnage sur l'axe X
  rowSpacing: 220,      // 220 cm entre chaque rangée sur l'axe Y
  baseY: 400,           // Hauteur des pieds de la rangée du bas (au-dessus du plafond à 250 cm)
  baseZ: 200,           // Position Z centrale dans la pièce
  characterHeight: 175, // Hauteur moyenne d'un personnage (cm)
  centerX: 150,         // Centre X de la pièce (ROOM_W = 300 cm)
  fov: 50,              // FOV vertical de la caméra
} as const;

function getGridLayout(total: number) {
  const { duo, partnerId } = useCharacterGridStore.getState();
  const [offsetX, offsetY, offsetZ] = duo?.offsetB ?? [0, 0, 0];
  const store = useSceneStore.getState();
  const leaders = CHARACTERS.filter(char => isCharacterVisibleInMode(char.id,
    store.layers.laraCount ?? 4, store.activeCharacterId, store.layers.extraCharacters ?? false,
    store.activeExtraIds, store.activeMainIds));
  const leaderHeight = Math.max(CHARACTER_GRID_CONFIG.characterHeight, ...leaders.map(char => char.height));
  const partnerHeight = duo ? CHARACTERS.find(char => char.id === partnerId)?.height ?? leaderHeight : 0;
  const minY = Math.min(0, offsetY);
  const pairHeight = Math.max(leaderHeight, offsetY + partnerHeight) - minY;
  const colSpacing = CHARACTER_GRID_CONFIG.colSpacing + Math.abs(offsetX);
  const rowSpacing = Math.max(CHARACTER_GRID_CONFIG.rowSpacing,
    pairHeight + CHARACTER_GRID_CONFIG.rowSpacing - CHARACTER_GRID_CONFIG.characterHeight);
  const rows = Math.ceil(Math.max(1, total) / CHARACTER_GRID_CONFIG.cols);
  const cols = Math.min(CHARACTER_GRID_CONFIG.cols, Math.max(1, total));
  return {
    colSpacing, rowSpacing,
    width: cols * colSpacing,
    height: (rows - 1) * rowSpacing + pairHeight,
    depth: CHARACTER_GRID_CONFIG.colSpacing + Math.abs(offsetZ),
    centerX: CHARACTER_GRID_CONFIG.centerX + offsetX / 2,
    centerY: CHARACTER_GRID_CONFIG.baseY + minY + ((rows - 1) * rowSpacing + pairHeight) / 2,
    centerZ: CHARACTER_GRID_CONFIG.baseZ + offsetZ / 2,
  };
}

/**
 * Calcule les coordonnées (X, Y, Z) d'un personnage dans la grille dynamique par lignes de 5.
 * Rangée 0 = rangée du haut (ordre de lecture standard), dernière rangée = rangée du bas (à baseY).
 */
export function getCharacterGridPosition(index: number, total: number = 1): { x: number; y: number; z: number } {
  const { cols, baseY, baseZ, centerX } = CHARACTER_GRID_CONFIG;
  const { colSpacing, rowSpacing } = getGridLayout(total);
  const safeTotal = Math.max(1, total);
  const totalRows = Math.ceil(safeTotal / cols);
  const row = Math.floor(index / cols);
  const col = index % cols;

  // Calcul X : centré horizontalement
  let targetX: number;
  if (totalRows === 1) {
    // Si une seule rangée (1 à 5 personnages), on centre exactement cette rangée sur centerX
    const activeCols = Math.min(cols, safeTotal);
    const colOffset = (activeCols - 1) / 2;
    targetX = centerX + (col - colOffset) * colSpacing;
  } else {
    // Si plusieurs rangées, alignement strict sur 5 colonnes (colonne 2 = centre X)
    targetX = centerX + (col - 2) * colSpacing;
  }

  // Calcul Y : la rangée 0 est en haut, la dernière rangée est posée à baseY (400 cm)
  const rowFromBottom = (totalRows - 1) - row;
  const targetY = baseY + rowFromBottom * rowSpacing;

  return { x: targetX, y: targetY, z: baseZ };
}

/**
 * Calcule l'index central d'une grille de personnages.
 * Rangée du milieu et colonne du milieu (colonne 2 pour 5 colonnes).
 */
export function getCharacterGridCenterIndex(total: number): number {
  if (total <= 1) return 0;
  const cols = CHARACTER_GRID_CONFIG.cols;
  const totalRows = Math.ceil(total / cols);
  if (totalRows === 1) {
    return Math.floor((total - 1) / 2);
  }
  const midRow = Math.floor(totalRows / 2);
  const midCol = Math.floor(cols / 2);
  const candidate = midRow * cols + midCol;
  if (candidate < total) {
    return candidate;
  }
  return Math.floor((total - 1) / 2);
}

/**
 * Calcule les coordonnées 3D cibles (au niveau du buste/centre) du personnage actif au centre de la grille.
 */
export function getCharacterGridActiveTarget(total?: number): [number, number, number] {
  const count = total ?? getActiveSceneCharactersCount();
  const centerIdx = getCharacterGridCenterIndex(count);
  const pos = getCharacterGridPosition(centerIdx, count);
  const store = useSceneStore.getState();
  const activeChar = CHARACTERS.find(c => c.id === store.activeCharacterId);
  const charH = activeChar?.height ?? CHARACTER_GRID_CONFIG.characterHeight;

  const { duo } = useCharacterGridStore.getState();
  if (duo?.offsetB) {
    const [offsetX, offsetY, offsetZ] = duo.offsetB;
    return [
      pos.x + offsetX / 2,
      Math.round(pos.y + charH * 0.5 + offsetY / 2),
      pos.z + offsetZ / 2,
    ];
  }

  return [pos.x, Math.round(pos.y + charH * 0.5), pos.z];
}

/**
 * Calcule la cible (target sur le personnage actif au centre) et la position caméra pour cadrer la grille.
 */
export function getCharacterGridCameraView(total?: number): {
  pos: [number, number, number];
  target: [number, number, number];
  zoom?: number;
} {
  const count = total ?? getActiveSceneCharactersCount();
  const { width: gridWidth, height: gridHeight, depth, centerZ } = getGridLayout(count);
  const { fov } = CHARACTER_GRID_CONFIG;
  const target = getCharacterGridActiveTarget(count);

  // Ratio d'aspect de la fenêtre
  const aspect = typeof window !== 'undefined' && window.innerHeight > 0
    ? window.innerWidth / window.innerHeight
    : 16 / 9;

  // Calcul de la distance caméra requise pour englober toute la grille (avec 25% de marge)
  const halfFovRad = (fov / 2) * (Math.PI / 180);
  const tanHalfFovV = Math.tan(halfFovRad);
  const tanHalfFovH = tanHalfFovV * aspect;

  const padding = 1.25;
  const distV = (gridHeight * padding * 0.5) / tanHalfFovV;
  const distH = (gridWidth * padding * 0.5) / tanHalfFovH;
  const cameraDistance = Math.max(distV, distH, 350);

  const pos: [number, number, number] = [target[0], target[1], Math.round(centerZ + depth / 2 + cameraDistance)];

  return { pos, target };
}

/**
 * Retourne le nombre actuel de personnages visibles dans la scène.
 */
export function getActiveSceneCharactersCount(state?: {
  layers: { laraCount?: LaraCountMode; extraCharacters?: boolean };
  activeCharacterId: string;
  activeExtraIds?: string[];
  activeMainIds?: string[];
}): number {
  const store = state ?? useSceneStore.getState();
  const laraCount = store.layers.laraCount ?? (typeof window !== 'undefined' && window.innerWidth <= 768 ? 2 : 15);
  const extraCharacters = store.layers.extraCharacters ?? false;
  const activeMainIds = (store as any).activeMainIds;
  return CHARACTERS.filter(char =>
    isCharacterVisibleInMode(char.id, laraCount, store.activeCharacterId, extraCharacters, store.activeExtraIds, activeMainIds)
  ).length;
}

/**
 * Émet l'événement camera-view pour orienter et cadrer la caméra de face sur la grille de personnages.
 */
export function frameCharacterGridCamera(total?: number, projection: 'persp' | 'ortho' = 'persp'): void {
  const count = total ?? getActiveSceneCharactersCount();
  const view = getCharacterGridCameraView(count);
  useSceneStore.getState().setActiveCameraPos('front');
  useSceneStore.getState().setCameraProjection(projection);
  if (projection === 'persp') {
    useSceneStore.getState().setOrbitMouseMode('rotate');
  }
  document.dispatchEvent(new CustomEvent('camera-view', { detail: { ...view, key: 'front', projection } }));
}

export type CharacterGridOrthoViewKey = 'front' | 'back' | 'left' | 'right' | 'top' | 'bottom';

export interface CharacterGridOrthoView {
  key: CharacterGridOrthoViewKey;
  label: string;
  shortLabel: string;
  icon: string;
  shortcut: string;
  numpadShortcut: string;
  pos: [number, number, number];
  target: [number, number, number];
  up: [number, number, number];
  viewH: number;
}

/**
 * Calcule l'ensemble des 6 vues orthographiques canoniques pour la grille de personnages :
 * Face, Derrière (Dos), Côté Gauche, Côté Droit, Dessus, Dessous.
 */
export function getCharacterGridOrthoViews(total?: number): Record<CharacterGridOrthoViewKey, CharacterGridOrthoView> {
  const count = total ?? getActiveSceneCharactersCount();
  const { width: gridWidth, height: gridHeight, depth: gridDepth } = getGridLayout(count);
  const target = getCharacterGridActiveTarget(count);
  const [centerX, centerY, baseZ] = target;

  const aspect = typeof window !== 'undefined' && window.innerHeight > 0
    ? window.innerWidth / window.innerHeight
    : 16 / 9;

  const padding = 1.3;
  const viewH = Math.round(Math.max(gridHeight * padding, gridDepth * padding, (gridWidth * padding) / aspect, (gridDepth * padding) / aspect, 450));
  const dist = Math.max(1500, gridWidth, gridHeight, gridDepth);

  return {
    front: {
      key: 'front',
      label: 'Face',
      shortLabel: 'Face',
      icon: '👤',
      shortcut: 'Alt+1',
      numpadShortcut: 'Num 1',
      pos: [centerX, centerY, baseZ + dist],
      target,
      up: [0, 1, 0],
      viewH,
    },
    back: {
      key: 'back',
      label: 'Derrière',
      shortLabel: 'Derrière',
      icon: '🔙',
      shortcut: 'Alt+2',
      numpadShortcut: 'Ctrl+1',
      pos: [centerX, centerY, baseZ - dist],
      target,
      up: [0, 1, 0],
      viewH,
    },
    left: {
      key: 'left',
      label: 'Côté Gauche',
      shortLabel: 'Côté G',
      icon: '◀️',
      shortcut: 'Alt+3',
      numpadShortcut: 'Ctrl+3',
      pos: [centerX - dist, centerY, baseZ],
      target,
      up: [0, 1, 0],
      viewH,
    },
    right: {
      key: 'right',
      label: 'Côté Droit',
      shortLabel: 'Côté D',
      icon: '▶️',
      shortcut: 'Alt+4',
      numpadShortcut: 'Num 3',
      pos: [centerX + dist, centerY, baseZ],
      target,
      up: [0, 1, 0],
      viewH,
    },
    top: {
      key: 'top',
      label: 'Dessus',
      shortLabel: 'Dessus',
      icon: '⬇️',
      shortcut: 'Alt+7',
      numpadShortcut: 'Num 7',
      pos: [centerX, centerY + dist, baseZ],
      target,
      up: [0, 0, -1],
      viewH,
    },
    bottom: {
      key: 'bottom',
      label: 'Dessous',
      shortLabel: 'Dessous',
      icon: '⬆️',
      shortcut: 'Alt+9',
      numpadShortcut: 'Ctrl+7',
      pos: [centerX, centerY - dist, baseZ],
      target,
      up: [0, 0, 1],
      viewH,
    },
  };
}

/**
 * Émet l'événement camera-ortho-view pour basculer en projection orthographique et cadrer la grille sous l'angle choisi.
 */
export function frameCharacterGridOrtho(viewKey: CharacterGridOrthoViewKey, total?: number): void {
  const views = getCharacterGridOrthoViews(total);
  const v = views[viewKey];
  if (!v) return;
  document.dispatchEvent(new CustomEvent('camera-ortho-view', { detail: v }));
}
