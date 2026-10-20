/**
 * inventoryUrlParams.ts — Helpers pour analyser et synchroniser l'URL avec l'état de l'Inventaire.
 * 
 * Supporte :
 *  - ?inventory ou ?inventaire (ouvre l'inventaire)
 *  - ?inventory=characters ou ?inventaire=personnages (ouvre l'inventaire sur une catégorie spécifique)
 *  - ?inv=animations ou ?category=animations ou ?cat=animations
 *  - &item=<id> pour une fiche, &animation=<id>&animationMode=solo|duo pour le studio
 */
import { CATEGORIES } from './inventoryData';

export type InventoryUrlTarget = { type: 'item'; id: string } | { type: 'animation'; id: string; mode: 'solo' | 'duo' };

export interface InventoryUrlState {
  open: boolean;
  category: string;
  target?: InventoryUrlTarget;
}

// Normalise les alias français / raccourcis vers les id de catégories officiels
const CATEGORY_ALIASES: Record<string, string> = {
  // Personnages
  characters: 'characters',
  character: 'characters',
  personnages: 'characters',
  personnage: 'characters',
  pnj: 'characters',
  perso: 'characters',
  persos: 'characters',

  // Animations
  animations: 'animations',
  animation: 'animations',
  anim: 'animations',
  anims: 'animations',

  // Actionnable
  actionnable: 'actionnable',
  actionnables: 'actionnable',
  action: 'actionnable',
  actions: 'actionnable',

  // Espaces & Pièces
  spaces: 'spaces',
  space: 'spaces',
  espaces: 'spaces',
  espace: 'spaces',
  pieces: 'spaces',
  piece: 'spaces',
  zones: 'spaces',
  zone: 'spaces',

  // Portes
  doors: 'doors',
  door: 'doors',
  portes: 'doors',
  porte: 'doors',

  // Rangement
  storage: 'storage',
  rangement: 'storage',
  rangements: 'storage',

  // Mobilier
  furniture: 'furniture',
  mobilier: 'furniture',
  meubles: 'furniture',
  meuble: 'furniture',

  // Tech
  tech: 'tech',

  // Cuisine
  kitchen: 'kitchen',
  cuisine: 'kitchen',

  // Salle de bain
  bathroom: 'bathroom',
  sdb: 'bathroom',
  'salle-de-bain': 'bathroom',

  // Vêtements
  clothing: 'clothing',
  vetements: 'clothing',
  vetement: 'clothing',

  // Déco
  decor: 'decor',
  deco: 'decor',

  // Consommables
  consumable: 'consumable',
  consumables: 'consumable',
  consommables: 'consumable',
  consommable: 'consumable',

  // Perruques
  wigs: 'wigs',
  wig: 'wigs',
  perruques: 'wigs',
  perruque: 'wigs',

  // GLBs
  glbs: 'glbs',
  glb: 'glbs',

  // Tout
  all: 'all',
  tout: 'all',
};

export function resolveCategoryId(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const clean = raw.trim().toLowerCase();
  if (CATEGORY_ALIASES[clean]) {
    return CATEGORY_ALIASES[clean];
  }
  const match = CATEGORIES.find(c => c.id.toLowerCase() === clean);
  return match ? match.id : null;
}

export function parseUrlInventory(): InventoryUrlState {
  if (typeof window === 'undefined') {
    return { open: false, category: 'all' };
  }

  try {
    let search = window.location.search;
    if (!search && window.location.hash.includes('?')) {
      search = window.location.hash.substring(window.location.hash.indexOf('?'));
    }
    const params = new URLSearchParams(search);

    // Paramètres possibles : ?inventory=..., ?inventaire=..., ?inv=...
    const invVal = params.get('inventory') ?? params.get('inventaire') ?? params.get('inv');
    const catVal = params.get('category') ?? params.get('cat') ?? params.get('page');

    const isOpen =
      params.has('inventory') ||
      params.has('inventaire') ||
      params.has('inv') ||
      Boolean(catVal && resolveCategoryId(catVal));

    let resolvedCat = 'all';

    if (invVal && invVal !== '1' && invVal !== 'true' && invVal !== 'open') {
      const directCat = resolveCategoryId(invVal);
      if (directCat) resolvedCat = directCat;
    }

    if (catVal) {
      const explicitCat = resolveCategoryId(catVal);
      if (explicitCat) resolvedCat = explicitCat;
    }

    return {
      open: isOpen,
      category: resolvedCat,
      target: params.has('animation')
        ? { type: 'animation', id: params.get('animation')!, mode: params.get('animationMode') === 'duo' ? 'duo' : 'solo' }
        : params.has('item') ? { type: 'item', id: params.get('item')! } : undefined,
    };
  } catch {
    return { open: false, category: 'all' };
  }
}

export function inventoryUrl(state: InventoryUrlState, href = window.location.href): string {
  const url = new URL(href);
  const keys = ['inventory', 'inventaire', 'inv', 'category', 'cat', 'item', 'animation', 'animationMode'];
  const clean = (params: URLSearchParams) => {
    keys.forEach(key => params.delete(key));
    if (resolveCategoryId(params.get('page'))) params.delete('page');
  };
  clean(url.searchParams);
  const hashQuery = url.hash.indexOf('?');
  if (hashQuery >= 0) {
    const params = new URLSearchParams(url.hash.slice(hashQuery + 1));
    clean(params);
    url.hash = url.hash.slice(0, hashQuery) + (params.size ? `?${params}` : '');
  }
  if (state.open) {
    url.searchParams.set('inventory', state.category === 'all' ? '1' : state.category);
    if (state.target?.type === 'item') url.searchParams.set('item', state.target.id);
    if (state.target?.type === 'animation') {
      url.searchParams.set('animation', state.target.id);
      url.searchParams.set('animationMode', state.target.mode);
    }
  }
  return url.toString();
}

export function updateUrlInventory(open: boolean, category = 'all', target?: InventoryUrlTarget, history: 'push' | 'replace' = 'push') {
  const href = inventoryUrl({ open, category, target });
  if (href !== window.location.href) window.history[history === 'push' ? 'pushState' : 'replaceState'](window.history.state, '', href);
}
