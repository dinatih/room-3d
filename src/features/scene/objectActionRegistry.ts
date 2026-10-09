import { useSceneStore } from './store/useSceneStore';
import { positionState } from './positionState';
import { DOUBLE_BED_POSITIONS } from './furniturePositions';
import { getSmartObject } from './ai/smartObjectRegistry';
import { getObjectActionIds } from './objectActions';
import { WIGS_ITEMS } from '@features/inventory/inventoryData';

export interface ActionDef {
  btnLabel?: string | (() => string);
  icon?: string;
  toggleKey: string;
  previewStateKey?: string;
  previewLabels?: [string, string];
  preview?: boolean;
  previewEvent?: string;
  previewCycle?: readonly (string | number)[];
  previewInitialValue?: string | number;
  type?: 'button' | 'select';
  options?: { value: string; label: string }[];
}


const mappedWigOptions = WIGS_ITEMS.map((wig, i) => ({
  value: i.toString(),
  label: wig.name
}));

const HAIR_COLORS = [
  { value: 'naturel', label: 'Naturel 🟫' },
  { value: 'noir', label: 'Noir ⚫' },
  { value: 'brun', label: 'Brun 🟫' },
  { value: 'chatain', label: 'Châtain 🟤' },
  { value: 'blond', label: 'Blond 🌟' },
  { value: 'roux', label: 'Roux 🦊' },
  { value: 'blanc', label: 'Blanc ❄️' },
  { value: 'bleu', label: 'Bleu 💙' },
  { value: 'vert', label: 'Vert 💚' },
  { value: 'rouge', label: 'Rouge ❤️' },
  { value: 'rose', label: 'Rose 🌸' },
  { value: 'violet', label: 'Violet 💜' },
  { value: 'arc-en-ciel', label: 'Arc-en-ciel 🌈' },
];

function makeMannequinActions(loc: string): Record<string, ActionDef> {
  return {
    [`mannequin-${loc}-random`]: { btnLabel: 'Aléatoire complet', icon: 'bi-shuffle', toggleKey: `mannequin-${loc}-random` },
    [`mannequin-${loc}-wig`]: { btnLabel: 'Perruque 💇', toggleKey: `mannequin-${loc}-wig`, type: 'select', options: mappedWigOptions },
    [`mannequin-${loc}-color`]: { btnLabel: 'Couleur cheveux 🎨', toggleKey: `mannequin-${loc}-color`, type: 'select', options: HAIR_COLORS },
    [`mannequin-${loc}-wind`]: { btnLabel: 'Vent 💨', toggleKey: `mannequin-${loc}-wind` },
  };
}

function makePositionAction(key: string): Record<string, ActionDef> {
  return {
    [key]: {
      preview: false,
      btnLabel: () => {
        const p = positionState[key];
        return p ? `Position ${p.idx + 1}/${p.total}` : 'Changer position';
      },
      toggleKey: key,
    },
  };
}

const MANNEQUIN_ACTIONS: Record<string, ActionDef> = {
  ...makeMannequinActions('kallax-nw'),
  ...makeMannequinActions('kallax-ne'),
  ...makeMannequinActions('meubleT'),
  ...makeMannequinActions('lack'),
  ...makeMannequinActions('lamp'),
};

const POSITION_ACTIONS: Record<string, ActionDef> = {
  ...makePositionAction('desk1-position'),
  ...makePositionAction('desk2-position'),
  ...makePositionAction('smorkull-position'),
  ...makePositionAction('airperformer-position'),
  ...makePositionAction('raskog-large-position'),
};

const ACTIONS: Record<string, ActionDef> = {
  'desk-toggle': {
    btnLabel: 'Assis / Debout', toggleKey: 'desk-toggle',
    previewLabels: ['Debout', 'Assis']
  },
  'vihals-toggle': {
    btnLabel: 'Plier / Déplier', toggleKey: 'vihals-toggle',
    previewLabels: ['Plier', 'Déplier']
  },
  'scooter-steering-toggle': {
    btnLabel: 'Tourner / Redresser le guidon', toggleKey: 'scooter-steering-toggle',
    previewLabels: ['Guidon 30° à gauche', 'Redresser le guidon']
  },
  ...MANNEQUIN_ACTIONS,
  ...POSITION_ACTIONS,

  eastGlassDoor: {
    btnLabel: 'Pousser battant droit',
    toggleKey: 'eastGlassDoor',
    previewLabels: ['Pousser battant droit', 'Pousser battant droit'],
    previewStateKey: 'east-glass-door-toggle',
    previewEvent: 'east-glass-door-toggle'
  },
  glassDoorLeftOpen: {
    btnLabel: 'Pousser battant gauche', toggleKey: 'glassDoorV2LeftOpen',
    previewEvent: 'glass-door-v2-left-open',
    previewLabels: ['Pousser battant gauche', 'Pousser battant gauche']
  },
  glassDoorShutter: {
    btnLabel: () => {
      const pos = useSceneStore.getState().furniture.glassDoorV2ShutterPos;
      return pos === 0 ? 'Volet : OUVERT' : pos === 100 ? 'Volet : FERMÉ' : `Volet : ${pos}% FERMÉ`;
    },
    toggleKey: 'glassDoorV2ShutterPos',
    previewStateKey: 'glass-door-v2-shutter-pos',
    previewLabels: ['Volet : ouvert', 'Volet : fermé']
  },
  entryDoor: {
    btnLabel: 'Pousser', toggleKey: 'entryDoor',
    previewLabels: ['Pousser', 'Pousser'],
    previewStateKey: 'entry-door-toggle',
    previewEvent: 'entry-door-toggle'
  },
  livingDoor: {
    btnLabel: 'Pousser', toggleKey: 'livingDoor',
    previewLabels: ['Pousser', 'Pousser'],
    previewStateKey: 'living-door-toggle',
    previewEvent: 'living-door-toggle'
  },
  bathroomDoor: {
    btnLabel: 'Pousser', toggleKey: 'bathroomDoor',
    previewLabels: ['Pousser', 'Pousser'],
    previewStateKey: 'bathroom-door-toggle',
    previewEvent: 'bathroom-door-toggle'
  },
  showerDoor: {
    btnLabel: 'Ouvrir / Fermer', toggleKey: 'showerDoor',
    previewLabels: ['Ouvrir', 'Fermer'],
    previewStateKey: 'shower-door-toggle'
  },
  corrDoors: {
    btnLabel: 'Ouvrir / Fermer', toggleKey: 'corrDoors',
    previewLabels: ['Ouvrir', 'Fermer'],
    previewStateKey: 'corr-doors-toggle'
  },
  sdbClosetL: {
    btnLabel: 'Ouvrir / Fermer Gauche', toggleKey: 'sdbClosetL',
    previewLabels: ['Ouvrir Gauche', 'Fermer Gauche'],
    previewStateKey: 'sdb-closet-l-toggle'
  },
  sdbClosetR: {
    btnLabel: 'Ouvrir / Fermer Droite', toggleKey: 'sdbClosetR',
    previewStateKey: 'sdb-closet-r-toggle',
    previewLabels: ['Ouvrir Droite', 'Fermer Droite']
  },
  cbnWest: {
    btnLabel: 'Ouvrir / Fermer', toggleKey: 'cbnWest',
    previewLabels: ['Ouvrir', 'Fermer'],
    previewStateKey: 'cbn-west-toggle'
  },
  cbnEast: {
    btnLabel: 'Ouvrir / Fermer', toggleKey: 'cbnEast',
    previewLabels: ['Ouvrir', 'Fermer'],
    previewStateKey: 'cbn-east-toggle'
  },
  freezer: {
    btnLabel: 'Ouvrir / Fermer', toggleKey: 'freezer',
    previewLabels: ['Ouvrir', 'Fermer'],
    previewStateKey: 'freezer-toggle'
  },
  fridge: {
    btnLabel: 'Ouvrir / Fermer', toggleKey: 'fridge',
    previewLabels: ['Ouvrir', 'Fermer'],
    previewStateKey: 'fridge-toggle'
  },
  'fridge-crisper-toggle': {
    btnLabel: () => useSceneStore.getState().extraStates['fridge-crisper-toggle'] ? 'Rentrer le bac' : 'Sortir le bac', toggleKey: 'fridge-crisper-toggle',
    previewLabels: ['Sortir le bac', 'Rentrer le bac']
  },
  ninja: {
    btnLabel: 'Ouvrir / Fermer', toggleKey: 'ninja',
    previewLabels: ['Ouvrir', 'Fermer'],
    previewStateKey: 'ninja-toggle'
  },
  cabinet: {
    btnLabel: 'Ouvrir / Fermer', toggleKey: 'cabinet',
    previewLabels: ['Ouvrir', 'Fermer'],
    previewStateKey: 'cabinet-toggle'
  },
  'wc-lid-toggle': {
    btnLabel: 'Ouvrir / Fermer Couvercle', toggleKey: 'wc-lid-toggle',
    previewLabels: ['Ouvrir Couvercle', 'Fermer Couvercle']
  },
  'wc-seat-toggle': {
    btnLabel: 'Ouvrir / Fermer Siège', toggleKey: 'wc-seat-toggle',
    previewLabels: ['Ouvrir Siège', 'Fermer Siège']
  },
  'wc-flush': {
    btnLabel: 'Appuyer sur la chasse', toggleKey: 'wc-flush',
    previewLabels: ['Appuyer sur la chasse', 'Relâcher la chasse']
  },
  'lamp-toggle': { btnLabel: 'Allumer / Éteindre', toggleKey: 'lampOn' },
  lampBath: { btnLabel: () => useSceneStore.getState().furniture.lampBath ? 'Éteindre SDB' : 'Allumer SDB', toggleKey: 'lampBath' },
  lampCorridor: { btnLabel: () => useSceneStore.getState().furniture.lampCorridor ? 'Éteindre Couloir' : 'Allumer Couloir', toggleKey: 'lampCorridor' },
  'bed-double': {
    btnLabel: () => useSceneStore.getState().furniture.bedDouble ? 'Lits séparés' : 'Lit double', toggleKey: 'bed-double',
    previewLabels: ['Mettre en lit double', 'Séparer en lits simples']
  },
  'bed-position': {
    btnLabel: () => {
      const p = positionState['bed-position'];
      return p ? `Position (${DOUBLE_BED_POSITIONS[p.idx]?.label ?? p.idx + 1}) →` : 'Changer position →';
    }, toggleKey: 'bed-position',
    previewLabels: ['Position lit double →', 'Position lit double →'],
    preview: false
  },
  'desk1-toggle': {
    btnLabel: 'Assis / Debout', toggleKey: 'desk1-toggle',
    previewLabels: ['Debout', 'Assis']
  },
  'desk2-toggle': {
    btnLabel: 'Assis / Debout', toggleKey: 'desk2-toggle',
    previewLabels: ['Debout', 'Assis']
  },
  'desk2-screen-toggle': {
    btnLabel: () => {
      const s = useSceneStore.getState();
      const on = s.desk2ScreenActive || s.extraStates.desk2Screen;
      return on ? '⏹️ Couper Vidéo' : '▶ Vidéo Bureau / TV';
    },
    toggleKey: 'desk2-screen-toggle',
    icon: 'bi-display',
    previewLabels: ['▶ Vidéo bureau / TV', '⏹ Couper vidéo']
  },
  'shiba-replay': { btnLabel: 'Rejouer', toggleKey: 'shiba-replay' },
  'robin-bird-replay': { btnLabel: 'Rejouer', toggleKey: 'robin-bird-replay' },
  'nestMini': {
    btnLabel: 'Ok Google', toggleKey: 'nestMini',
    previewLabels: ['Ok Google 🎙️', 'Ok Google 🎙️']
  },
  'tv-toggle': {
    btnLabel: 'Allumer / Éteindre', toggleKey: 'tvOn',
    previewLabels: ['Allumer', 'Éteindre']
  },
  'bin': {
    btnLabel: 'Ouvrir / Fermer', toggleKey: 'bin-toggle',
    previewLabels: ['Ouvrir', 'Fermer'],
    previewStateKey: 'bin-toggle'
  },
  airPerformerPower: { btnLabel: 'Allumer / Éteindre', toggleKey: 'airPerformerPower' },
  airPerformerMode: { btnLabel: 'Changer Mode', toggleKey: 'airPerformerMode', previewCycle: ['auto', 'cool', 'heat', 'sleep'], previewInitialValue: 'auto' },
  airPerformerSpeed: { btnLabel: 'Vitesse +/-', toggleKey: 'airPerformerSpeed', previewCycle: [3, 6, 10], previewInitialValue: 5 },
  'character-meshes': { btnLabel: 'Meshes', toggleKey: 'character-meshes' },
  'sofa-arm-left': {
    btnLabel: 'Accoudoir Gauche', toggleKey: 'sofaArmLeft',
    previewLabels: ['Mettre à plat G', 'Relever G']
  },
  'sofa-arm-right': {
    btnLabel: 'Accoudoir Droit', toggleKey: 'sofaArmRight',
    previewLabels: ['Mettre à plat D', 'Relever D']
  },
  'lara-haircut': {
    btnLabel: 'Coupe de cheveux 💇‍♀️', toggleKey: 'lara-haircut', type: 'select', options: [
      { value: 'original', label: 'Coupe d\'origine 👱‍♀️' },
      ...WIGS_ITEMS.map(wig => ({
        value: wig.id,
        label: wig.name
      }))
    ]
  },
  utdrag: {
    btnLabel: () => useSceneStore.getState().extraStates.utdrag ? 'Rentrer la hotte' : 'Déplier la hotte',
    toggleKey: 'utdrag',
    previewLabels: ['Déplier', 'Rentrer'],
    previewStateKey: 'utdrag-toggle'
  },
};
// Helper to resolve action definition (supports dynamic actions like select-character-*)
export function getActionDef(actionId: string): ActionDef | undefined {
  if (/^animal-(robin|shiba|jikin|tosakin)-(fpv|follow)$/.test(actionId)) {
    const fpv = actionId.endsWith('-fpv');
    return { btnLabel: fpv ? 'Vue FPV' : 'Suivre', icon: fpv ? 'bi-eye' : 'bi-camera-video', toggleKey: actionId };
  }
  if (ACTIONS[actionId]) return ACTIONS[actionId];
  if (actionId.startsWith('select-character-')) {
    return {
      btnLabel: '🎯 Définir comme personnage actif',
      toggleKey: actionId,
    };
  }
  if (actionId.startsWith('smart-object:::')) {
    // Format : smart-object:::{objectId}:::{slotId}
    const [, objectId, slotId] = actionId.split(':::');
    const obj = getSmartObject(objectId);
    const slot = obj?.slots.find(s => s.slotId === slotId);
    const slotName = slot?.name || slotId || 'Interagir';
    const prefix = slot?.isDuo ? '🛋️ Duo' : '⚡ Utiliser';
    return {
      btnLabel: `${prefix} (${slotName})`,
      toggleKey: actionId,
    };
  }
  return undefined;
}

/** Preview state uses the component's prop key, independently of the scene store. */
export function togglePreviewAction(id: string, state: Record<string, any>): Record<string, any> {
  const action = getActionDef(id);
  if (!action) throw new Error(`Action inconnue : ${id}`);
  const key = action.previewStateKey ?? id;
  const value = action.previewCycle
    ? action.previewCycle[(action.previewCycle.indexOf(state[key] ?? action.previewInitialValue) + 1) % action.previewCycle.length]
    : id === 'glassDoorShutter'
      ? ((state[key] ?? 0) === 0 ? 70 : state[key] === 70 ? 90 : state[key] === 90 ? 100 : 0)
      : !state[key];
  const next = { ...state, [key]: value };
  if (id === 'fridge' && !value) next['fridge-crisper-toggle'] = false;
  if (id === 'fridge-crisper-toggle' && value) next['fridge-toggle'] = true;
  return next;
}

export function getPreviewActionLabel(id: string, state: Record<string, any>): string {
  const action = getActionDef(id);
  if (!action) throw new Error(`Action inconnue : ${id}`);
  const value = state[action.previewStateKey ?? id];
  if (id === 'glassDoorShutter') return `Volet : ${value ? `${value}% fermé` : 'ouvert'}`;
  if (action.previewLabels) return action.previewLabels[value ? 1 : 0];
  return typeof action.btnLabel === 'function' ? action.btnLabel() : action.btnLabel ?? id;
}

export function getPreviewActionIds(objectId: string): readonly string[] {
  return getObjectActionIds(objectId).filter(id => {
    const action = getActionDef(id);
    if (!action) throw new Error(`Action inconnue pour ${objectId} : ${id}`);
    return action.preview !== false;
  });
}
