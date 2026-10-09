import { positionState } from './positionState';
import { DOUBLE_BED_POSITIONS } from './furniturePositions';
import { getSmartObject } from './ai/smartObjectRegistry';
import { getObjectActionIds } from './objectActions';
import { WIGS_ITEMS } from '@features/inventory/inventoryData';

export interface ActionDef {
  id: string;
  label: string | [string, string] | ((value: any) => string);
  icon?: string;
  sceneOnly?: boolean;
  event?: 'door-push';
  values?: readonly (string | number)[];
  initialValue?: string | number;
  type?: 'select';
  options?: { value: string; label: string }[];
}

type ActionConfig = Omit<ActionDef, 'id'>;

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

function mannequinActions(loc: string): Record<string, ActionConfig> {
  return {
    [`mannequin-${loc}-random`]: { label: 'Aléatoire complet', icon: 'bi-shuffle' },
    [`mannequin-${loc}-wig`]: { label: 'Perruque 💇', type: 'select', options: WIGS_ITEMS.map((wig, i) => ({ value: String(i), label: wig.name })) },
    [`mannequin-${loc}-color`]: { label: 'Couleur cheveux 🎨', type: 'select', options: HAIR_COLORS },
    [`mannequin-${loc}-wind`]: { label: 'Vent 💨' },
  };
}

function positionAction(key: string): Record<string, ActionConfig> {
  return { [key]: { sceneOnly: true, label: () => {
    const p = positionState[key];
    return p ? `Position ${p.idx + 1}/${p.total}` : 'Changer position';
  } } };
}

const ACTIONS: Record<string, ActionConfig> = {
  ...mannequinActions('kallax-nw'),
  ...mannequinActions('kallax-ne'),
  ...mannequinActions('meubleT'),
  ...mannequinActions('lack'),
  ...mannequinActions('lamp'),
  ...positionAction('desk1-position'),
  ...positionAction('desk2-position'),
  ...positionAction('smorkull-position'),
  ...positionAction('airperformer-position'),
  ...positionAction('raskog-large-position'),
  eastGlassDoor: { label: 'Pousser battant droit', event: 'door-push' },
  glassDoorV2LeftOpen: { label: 'Pousser battant gauche', event: 'door-push' },
  glassDoorV2ShutterPos: { label: value => `Volet : ${value ? `${value}% fermé` : 'ouvert'}`, values: [0, 70, 90, 100], initialValue: 0 },
  entryDoor: { label: 'Pousser', event: 'door-push' },
  livingDoor: { label: 'Pousser', event: 'door-push' },
  bathroomDoor: { label: 'Pousser', event: 'door-push' },
  showerDoor: { label: 'Pousser', event: 'door-push' },
  corrDoors: { label: ['Ouvrir', 'Fermer'] },
  sdbClosetL: { label: ['Ouvrir Gauche', 'Fermer Gauche'] },
  sdbClosetR: { label: ['Ouvrir Droite', 'Fermer Droite'] },
  cbnWest: { label: ['Ouvrir', 'Fermer'] },
  cbnEast: { label: ['Ouvrir', 'Fermer'] },
  freezer: { label: ['Ouvrir', 'Fermer'] },
  fridge: { label: ['Ouvrir', 'Fermer'] },
  'fridge-crisper-toggle': { label: ['Sortir le bac', 'Rentrer le bac'] },
  ninja: { label: ['Ouvrir', 'Fermer'] },
  cabinet: { label: ['Ouvrir', 'Fermer'] },
  'wc-lid-toggle': { label: ['Ouvrir Couvercle', 'Fermer Couvercle'] },
  'wc-seat-toggle': { label: ['Ouvrir Siège', 'Fermer Siège'] },
  'wc-flush': { label: ['Appuyer sur la chasse', 'Relâcher la chasse'] },
  'lamp-toggle': { label: ['Allumer', 'Éteindre'] },
  lampBath: { label: ['Allumer SDB', 'Éteindre SDB'] },
  lampCorridor: { label: ['Allumer Couloir', 'Éteindre Couloir'] },
  'bed-double': { label: ['Mettre en lit double', 'Séparer en lits simples'] },
  'bed-position': { sceneOnly: true, label: () => {
    const p = positionState['bed-position'];
    return p ? `Position (${DOUBLE_BED_POSITIONS[p.idx]?.label ?? p.idx + 1}) →` : 'Changer position →';
  } },
  'desk-toggle': { label: ['Debout', 'Assis'] },
  'desk1-toggle': { label: ['Debout', 'Assis'] },
  'desk2-toggle': { label: ['Debout', 'Assis'] },
  'desk2-screen-toggle': { label: ['▶ Vidéo bureau / TV', '⏹ Couper vidéo'], icon: 'bi-display' },
  'shiba-replay': { label: 'Rejouer' },
  'robin-bird-replay': { label: 'Rejouer' },
  nestMini: { label: 'Ok Google 🎙️' },
  'tv-toggle': { label: ['Allumer', 'Éteindre'] },
  'bin-toggle': { label: ['Ouvrir', 'Fermer'] },
  airPerformerPower: { label: ['Allumer', 'Éteindre'] },
  airPerformerMode: { label: 'Changer Mode', values: ['auto', 'cool', 'heat', 'sleep'], initialValue: 'auto' },
  airPerformerSpeed: { label: 'Vitesse +/-', values: [3, 6, 10], initialValue: 5 },
  'character-meshes': { label: 'Meshes' },
  'sofa-arm-left': { label: ['Mettre à plat G', 'Relever G'] },
  'sofa-arm-right': { label: ['Mettre à plat D', 'Relever D'] },
  'vihals-toggle': { label: ['Plier', 'Déplier'] },
  'scooter-steering-toggle': { label: ['Guidon 30° à gauche', 'Redresser le guidon'] },
  'lara-haircut': { label: 'Coupe de cheveux 💇‍♀️', type: 'select', options: [
    { value: 'original', label: "Coupe d'origine 👱‍♀️" },
    ...WIGS_ITEMS.map(wig => ({ value: wig.id, label: wig.name })),
  ] },
  utdrag: { label: ['Déplier', 'Rentrer'] },
};

export function getActionDef(id: string): ActionDef | undefined {
  if (ACTIONS[id]) return { id, ...ACTIONS[id] };
  if (/^animal-(robin|shiba|jikin|tosakin)-(fpv|follow)$/.test(id)) {
    const fpv = id.endsWith('-fpv');
    return { id, label: fpv ? 'Vue FPV' : 'Suivre', icon: fpv ? 'bi-eye' : 'bi-camera-video' };
  }
  if (id.startsWith('select-character-')) return { id, label: '🎯 Définir comme personnage actif' };
  if (id.startsWith('smart-object:::')) {
    const [, objectId, slotId] = id.split(':::');
    const slot = getSmartObject(objectId)?.slots.find(s => s.slotId === slotId);
    return { id, label: `${slot?.isDuo ? '🛋️ Duo' : '⚡ Utiliser'} (${slot?.name || slotId || 'Interagir'})` };
  }
}

export function getActionLabel(id: string, value?: any): string {
  const action = getActionDef(id);
  if (!action) throw new Error(`Action inconnue : ${id}`);
  const label = action.label;
  return typeof label === 'function' ? label(value) : Array.isArray(label) ? (value === undefined ? label.join(' / ') : label[value ? 1 : 0]) : label;
}

export function getNextActionValue(id: string, value?: any): any {
  const action = getActionDef(id);
  if (!action) throw new Error(`Action inconnue : ${id}`);
  return action.values ? action.values[(action.values.indexOf(value ?? action.initialValue) + 1) % action.values.length] : !value;
}

export function toggleObjectAction(id: string, state: Record<string, any>, value = getNextActionValue(id, state[id])): Record<string, any> {
  const next = { ...state, [id]: value };
  if (id === 'fridge' && !value) next['fridge-crisper-toggle'] = false;
  if (id === 'fridge-crisper-toggle' && value) next.fridge = true;
  return next;
}

export function getPreviewActionIds(objectId: string): readonly string[] {
  return getObjectActionIds(objectId).filter(id => {
    const action = getActionDef(id);
    if (!action) throw new Error(`Action inconnue pour ${objectId} : ${id}`);
    return !action.sceneOnly;
  });
}
