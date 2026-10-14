/**
 * inventoryUrlParams.ts — Helpers pour analyser et synchroniser l'URL avec l'état de l'Inventaire.
 * 
 * Supporte :
 *  - ?inventory ou ?inventaire (ouvre l'inventaire)
 *  - ?inventory=characters ou ?inventaire=personnages (ouvre l'inventaire sur une catégorie spécifique)
 *  - ?inv=animations ou ?category=animations ou ?cat=animations
 */
import { CATEGORIES } from './inventoryData';

export interface InventoryUrlState {
  open: boolean;
  category: string;
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
    };
  } catch {
    return { open: false, category: 'all' };
  }
}

export function updateUrlInventory(open: boolean, category?: string) {
  if (typeof window === 'undefined') return;
  try {
    const url = new URL(window.location.href);
    const params = url.searchParams;

    if (!open) {
      params.delete('inventory');
      params.delete('inventaire');
      params.delete('inv');
      params.delete('category');
      params.delete('cat');
    } else {
      const cat = category ? resolveCategoryId(category) ?? category : 'all';
      if (cat && cat !== 'all') {
        params.set('inventory', cat);
      } else {
        params.set('inventory', '1');
      }
      params.delete('inventaire');
      params.delete('inv');
      params.delete('category');
      params.delete('cat');
    }

    window.history.replaceState({}, '', url.toString());
  } catch (e) {
    console.warn('[updateUrlInventory] Failed to update URL params', e);
  }
}
