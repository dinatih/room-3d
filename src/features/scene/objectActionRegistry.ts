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
  'unitree-h2-replay': { label: 'Rejouer', icon: 'bi-arrow-repeat', sceneOnly: true },
  'unitree-h2-motion': {
    label: 'Animation du H2', type: 'select', initialValue: 'idle', sceneOnly: true,
    options: [
      { value: 'idle', label: 'Repos' },
      { value: 'walking', label: 'Marche classique' },
      { value: 'thinking', label: 'Réflexion' },
    ],
  },
  'unitree-g1-replay': { label: 'Rejouer', icon: 'bi-arrow-repeat' },
  'unitree-go2-replay': { label: 'Rejouer', icon: 'bi-arrow-repeat' },
  'unitree-g1-autonomous': { label: 'Vie autonome', icon: 'bi-play-circle', sceneOnly: true },
  'unitree-go2-autonomous': { label: 'Vie autonome', icon: 'bi-play-circle', sceneOnly: true },
  'jumper-robot-autonomous': { label: 'Vie autonome', icon: 'bi-play-circle', sceneOnly: true },
  'unitree-g1-motion': {
    label: 'Animation du G1', type: 'select', initialValue: 'idle',
    options: [
      { value: 'idle', label: 'Repos' },
      { value: 'walk', label: 'Marche' },
      { value: 'wave', label: 'Faire coucou' },
      { value: 'bow', label: 'Révérence' },
      { value: 'dance', label: 'Danse' },
    ],
  },
  'unitree-go2-motion': {
    label: 'Animation du Go2', type: 'select', initialValue: 'idle',
    options: [
      { value: 'idle', label: 'Repos' },
      { value: 'trot', label: 'Trot' },
      { value: 'paw', label: 'Donner la patte' },
      { value: 'bow', label: 'Étirement' },
      { value: 'dance', label: 'Danse' },
    ],
  },
  'jumper-replay': { label: 'Rejouer', icon: 'bi-arrow-repeat' },
  'jumper-motion': {
    label: 'Animation du robot', type: 'select', initialValue: 'idle',
    options: [
      { value: 'idle', label: 'Repos' },
      { value: 'walk', label: 'Marche (recréée)' },
      { value: 'turn-left', label: 'Virage à gauche (recréé)' },
      { value: 'turn-right', label: 'Virage à droite (recréé)' },
      { value: 'hello', label: 'Faire coucou' },
      { value: 'bow', label: 'Révérence' },
      { value: 'paw', label: 'Donner la patte' },
      { value: 'salute', label: 'Salut militaire' },
      { value: 'maze', label: 'Danse Maze' },
    ],
  },
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
  'drona-kitchen-diy-slide': { label: ['Sortir Bricolage', 'Ranger Bricolage'] },
  'drona-kitchen-old-it-slide': { label: ['Sortir Old IT', 'Ranger Old IT'] },
  'drona-kitchen-main-slide': { label: ['Sortir Cuisine Principale', 'Ranger Cuisine Principale'] },
  'drona-kitchen-electronics-slide': { label: ['Sortir Électronique, Câbles', 'Ranger Électronique, Câbles'] },
  freezer: { label: ['Ouvrir', 'Fermer'] },
  'drona-ne-catchall-slide': { label: ['Sortir le fourre-tout', 'Ranger le fourre-tout'] },
  'drona-se-pyjama-slide': { label: ['Sortir les pyjamas', 'Ranger les pyjamas'] },
  'drona-se-linen-slide': { label: ['Sortir le linge de maison', 'Ranger le linge de maison'] },
  'drona-se-care-slide': { label: ['Sortir les parfums/crèmes', 'Ranger les parfums/crèmes'] },
  'drona-nw-upper-slide': { label: ['Sortir le Dröna supérieur NW', 'Ranger le Dröna supérieur NW'] },
  'drona-nw-trousers-slide': { label: ['Sortir les pantalons', 'Ranger les pantalons'] },
  'drona-ne-catchall2-slide': { label: ['Sortir le fourre-tout 2', 'Ranger le fourre-tout 2'] },
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
  'ulotte-replay': { label: 'Vie autonome', sceneOnly: true, icon: 'bi-play-circle' },
  'ulotte-motion': {
    label: 'Animation d’Ulotte', type: 'select', sceneOnly: true, initialValue: 'idle-1',
    options: [
      { value: 'idle-1', label: 'Repos' },
      { value: 'idle-2', label: 'Repos alternatif' },
      { value: 'walk', label: 'Marche' },
      { value: 'run', label: 'Course' },
      { value: 'jump', label: 'Saut' },
      { value: 'eating', label: 'Repas' },
    ],
  },
  'shiba-replay': { label: 'Rejouer', sceneOnly: true },
  'robin-bird-replay': { label: 'Rejouer' },
  'drone-pilot': { label: 'Piloter le Hornet', icon: 'bi-controller', sceneOnly: true },
  'animal-drone-fpv': { label: 'Vue Hornet', icon: 'bi-eye', sceneOnly: true },
  'drone-patrol-all': { label: '🛸 Patrouille tout le studio & jardin', sceneOnly: true },
  'drone-goto-garden': { label: '🌿 Aller au Jardin', sceneOnly: true },
  'drone-goto-living': { label: '🛋️ Aller au Salon', sceneOnly: true },
  'drone-goto-kitchen': { label: '🍳 Aller à la Cuisine', sceneOnly: true },
  'drone-goto-bathroom': { label: '🚿 Aller à la Salle de bain', sceneOnly: true },
  'drone-goto-corridor': { label: '🚪 Aller au Couloir', sceneOnly: true },
  'drone-toggle-land': { label: ['🛬 Atterrir', '🛫 Décoller'], sceneOnly: true },
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
  'scooter-steering-toggle': { label: ['Guidon 60° à gauche', 'Redresser le guidon'] },
  'lara-haircut': { label: 'Coupe de cheveux 💇‍♀️', type: 'select', options: [
    { value: 'original', label: "Coupe d'origine 👱‍♀️" },
    ...WIGS_ITEMS.map(wig => ({ value: wig.id, label: wig.name })),
  ] },
  utdrag: { label: ['Déplier', 'Rentrer'] },
};

export function getActionDef(id: string): ActionDef | undefined {
  if (ACTIONS[id]) return { id, ...ACTIONS[id] };
  if (/^animal-(robin|shiba|ulotte|jikin|tosakin|drone)-(fpv|follow)$/.test(id)) {
    const fpv = id.endsWith('-fpv');
    return { id, label: fpv ? 'Vue FPV' : 'Suivre', icon: fpv ? 'bi-eye' : 'bi-camera-video', sceneOnly: true };
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
