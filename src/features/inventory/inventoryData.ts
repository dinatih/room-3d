// =============================================
// INVENTORY DATA — port de js/ui/inventoryData.js
// dims: { w, d, h } en cm (w=X, d=Z, h=Y)
// =============================================

export interface InventoryItem {
  id: string;
  name: string;
  brand: string;
  category: string;
  qty: number;
  dims: { w: number; d: number; h: number };
  notes?: string;
  glbPath?: string;
  actions?: string[];
}

export interface StorageSpace {
  id: string;
  name: string;
  dims: { w: number; d: number; h: number };
  notes?: string;
  actions?: string[];
}

export interface Category {
  id: string;
  label: string;
}

export const INVENTORY: InventoryItem[] = [

  // ── STORAGE ──────────────────────────────────────────────────────────────────
  { id: 'kallax-ne-2x1',    name: 'Kallax 2×1 (NE)',                brand: 'IKEA',     category: 'storage',   qty: 1,  dims: { w: 77, d: 39, h: 41 }, notes: 'Empilée avec 2×2 au coin C+B',    glbPath: 'media/KALLAX etag 77x41 blanc.glb' },
  { id: 'kallax-ne-2x2',    name: 'Kallax 2×2 (NE)',                brand: 'IKEA',     category: 'storage',   qty: 1,  dims: { w: 77, d: 39, h: 77 }, notes: 'Sur 2×1 NE, boîtes Drona',        glbPath: 'media/KALLAX etag 77x77 blanc.glb' },
  { id: 'kallax-se-2x1',    name: 'Kallax 2×1 pivotée (SE)',        brand: 'IKEA',     category: 'storage',   qty: 2,  dims: { w: 77, d: 39, h: 41 }, notes: '2 unités empilées, rotation 90°',  glbPath: 'media/KALLAX etag 77x41 blanc.glb' },
  { id: 'kallax-nw-2x1',    name: 'Kallax 2×1 pivotée (NW)',        brand: 'IKEA',     category: 'storage',   qty: 1,  dims: { w: 77, d: 39, h: 41 }, notes: 'Base tour NW',                    glbPath: 'media/KALLAX etag 77x41 blanc.glb' },
  { id: 'kallax-nw-1x1-a',  name: 'Kallax 1×1 pivotée (NW-milieu)',brand: 'IKEA',     category: 'storage',   qty: 1,  dims: { w: 42, d: 39, h: 41 }, notes: 'Milieu tour NW', glbPath: 'media/KALLAX etag 42x41 blanc.glb' },
  { id: 'kallax-nw-1x1-b',  name: 'Kallax 1×1 pivotée (NW-haut)',  brand: 'IKEA',     category: 'storage',   qty: 1,  dims: { w: 42, d: 39, h: 41 }, notes: 'Haut tour NW',   glbPath: 'media/KALLAX etag 42x41 blanc.glb' },
  { id: 'kallax-sw-2x2',    name: 'Kallax 2×2 (niche)',             brand: 'IKEA',     category: 'storage',   qty: 2,  dims: { w: 77, d: 39, h: 77 }, notes: 'Remplie de Drona',          glbPath: 'media/KALLAX etag 77x77 blanc.glb' },
  { id: 'kallax-sw-2x1',    name: 'Kallax 2×1 (niche, haut)',       brand: 'IKEA',     category: 'storage',   qty: 1,  dims: { w: 77, d: 39, h: 41 }, notes: 'Haut de la pile cuisine',   glbPath: 'media/KALLAX etag 77x41 blanc.glb' },
  { id: 'shelf-lack',        name: 'Étagère LACK',                  brand: 'IKEA',     category: 'storage',   qty: 1,  dims: { w: 110,  d: 26,   h: 5    }, notes: 'Murale, mur A', glbPath: 'media/LACK étagère murale 110x26 blanc.glb' },
  { id: 'basket-fniss',      name: 'Corbeille FNISS',               brand: 'IKEA',     category: 'storage',   qty: 2,  dims: { w: 28,   d: 28,   h: 28   }, notes: '1 SDB, 1 séjour',             glbPath: 'media/FNISS poubelle 10 l blanc.glb' },
  { id: 'dimpa',             name: 'Sac DIMPA',                     brand: 'IKEA',     category: 'storage',   qty: 5,  dims: { w: 68,   d: 27,   h: 67   }, notes: '5 sacs séjour mur C',          glbPath: 'media/DIMPA.glb' },
  { id: 'rail-mulig',        name: 'Tringle MULIG',                 brand: 'IKEA',     category: 'storage',   qty: 1,  dims: { w: 60,   d: 26,   h: 16   }, notes: 'Blanc',                        glbPath: 'media/MULIG.glb' },
  { id: 'meuble-t',          name: 'Bibliothèque (MeubleT)',         brand: '',         category: 'storage',   qty: 1,  dims: { w: 100,  d: 40,   h: 50   }, notes: 'Procédural, mur C' },
  { id: 'drona',             name: 'Boîte DRONA',                   brand: 'IKEA',     category: 'storage',   qty: 29, dims: { w: 33,   d: 38,   h: 33   }, notes: 'Dans les Kallax NE/SE/NW/cuisine, Mackapär, meubles SDB et cuisine', glbPath: 'media/DRÖNA.glb' },

  // ── FURNITURE ────────────────────────────────────────────────────────────────
  { id: 'utaker-lower',     name: 'Utåker - Lit bas',               brand: 'IKEA',     category: 'furniture', qty: 1, dims: { w: 205,  d: 83,   h: 30   }, notes: 'Empilable, matelas 200×80cm bleu' },
  { id: 'utaker-upper',     name: 'Utåker - Lit haut',              brand: 'IKEA',     category: 'furniture', qty: 1, dims: { w: 205,  d: 83,   h: 30   }, notes: 'Empilable, matelas 200×80cm blanc' },
  { id: 'desk-bollsidan-1', name: 'Bureau assis-debout 1',          brand: 'IKEA',     category: 'furniture', qty: 1, dims: { w: 68,   d: 36,   h: 70   }, notes: 'Bollsidan, surface 68×36cm' },
  { id: 'desk-bollsidan-2', name: 'Bureau assis-debout 2',          brand: 'IKEA',     category: 'furniture', qty: 1, dims: { w: 68,   d: 36,   h: 70   }, notes: 'Bollsidan, laptop + téléphone + mug' },
  { id: 'smorkull-chair',   name: 'Chaise de bureau Smörkull',      brand: 'IKEA',     category: 'furniture', qty: 1, dims: { w: 66,   d: 65,   h: 108  }, notes: 'Rouge', glbPath: 'media/SMÖRKULL.glb' },
  { id: 'sunnersta',        name: 'Desserte SUNNERSTA',             brand: 'IKEA',     category: 'furniture', qty: 1, dims: { w: 36,   d: 56,   h: 90   }, notes: 'Roulante, têtes de mannequin dessus', glbPath: 'media/sunnersta_trolley_ikea.glb' },
  { id: 'chest-bench',      name: 'Coffre banc YITAHOME 100 Gal',  brand: 'YITAHOME', category: 'furniture', qty: 1, dims: { w: 122,  d: 55,   h: 62   }, notes: 'Gris, jardin derrière canapé ouest' },
  { id: 'viggja',           name: 'Desserte VIGGJA',                brand: 'IKEA',     category: 'furniture', qty: 1, dims: { w: 37,   d: 50,   h: 74   }, notes: 'Jardin, à côté canapé ouest', glbPath: 'media/viggja.glb' },
  { id: 'armrest-sofa',     name: 'Canapé de jardin (grand)',       brand: '',         category: 'furniture', qty: 1, dims: { w: 60,   d: 160,  h: 90   }, notes: 'Rouge, côté est, avec accoudoirs' },
  { id: 'armless-sofa',     name: 'Canapé de jardin (petit)',       brand: '',         category: 'furniture', qty: 1, dims: { w: 60,   d: 100,  h: 100  }, notes: 'Rouge, sans accoudoirs' },

  // ── TECH ─────────────────────────────────────────────────────────────────────
  { id: 'tv',               name: 'Télévision murale',              brand: '',          category: 'tech',     qty: 1, dims: { w: 70,   d: 2,    h: 40   }, notes: '70×40cm, orientée vers le séjour' },
  { id: 'laptop',           name: 'Framework Laptop 13"',           brand: 'Framework', category: 'tech',     qty: 1, dims: { w: 29.7, d: 22.8, h: 1.55 }, notes: 'AMD Ryzen AI 5 340, 2256×1504 13", bureau 2' },
  { id: 'phone',            name: 'Téléphone OnePlus Nord 4',       brand: 'OnePlus',   category: 'tech',     qty: 1, dims: { w: 7.5,  d: 16.2, h: 0.8  }, notes: 'Coque rouge, bureau 2' },
  { id: 'scooter',          name: 'Trottinette Xiaomi 4',           brand: 'Xiaomi',    category: 'tech',     qty: 1, dims: { w: 50,   d: 50,   h: 113  }, notes: 'Guidon déplié, couloir', glbPath: 'media/xiaomi_electric_scooter_4.glb' },
  { id: 'air-performer',    name: 'Air Performer',                  brand: 'Philips',   category: 'tech',     qty: 1, dims: { w: 20,   d: 20,   h: 100  }, notes: 'Ventilateur/purificateur' },

  // ── KITCHEN ──────────────────────────────────────────────────────────────────
  { id: 'counter',          name: 'Plan de travail',                brand: '',         category: 'kitchen',   qty: 1, dims: { w: 100,  d: 60,   h: 3    }, notes: 'Blanc, avec trou évier' },
  { id: 'cabinet-wood',     name: 'METOD Rangement 40×60×80',       brand: 'IKEA',     category: 'kitchen',   qty: 1, dims: { w: 40,   d: 60,   h: 80   }, notes: 'Blanc', glbPath: 'media/METOD Rangement blanc 40x60x80 cm.glb' },
  { id: 'fridge',           name: 'LAGAN Réfrigérateur 113 l',      brand: 'IKEA',     category: 'kitchen',   qty: 1, dims: { w: 60,   d: 63,   h: 172  }, notes: 'Blanc, comp. congélateur', glbPath: 'media/LAGAN Réfrigérateur av comp congélateur indépendant-blanc 97-16 l.glb' },
  { id: 'sink-boholmen',    name: 'Évier BOHOLMEN 1 bac',          brand: 'IKEA',     category: 'kitchen',   qty: 1, dims: { w: 30,   d: 47,   h: 15   }, notes: 'Inox, avec robinet' },
  { id: 'stove',            name: 'Plaque VÄLBILDAD',               brand: 'IKEA',     category: 'kitchen',   qty: 1, dims: { w: 29,   d: 52,   h: 5    }, notes: 'Induction', glbPath: 'media/VÄLBILDAD.glb' },
  { id: 'pizza-oven',       name: 'Four à pizza',                   brand: '',         category: 'kitchen',   qty: 1, dims: { w: 20,   d: 20,   h: 19   }, notes: 'Sur Kallax cuisine', glbPath: 'media/pizza_oven.glb' },
  { id: 'freezer',          name: 'Congélateur CHIQ CSD46D4E',     brand: 'CHIQ',     category: 'kitchen',   qty: 1, dims: { w: 45,   d: 47,   h: 50   }, notes: 'Noir, niche séjour', glbPath: 'media/TILLREDA Réfrigérateur indépendant-blanc 43 l.glb' },

  // ── BATHROOM ─────────────────────────────────────────────────────────────────
  { id: 'bathroom-cabinet-west', name: 'Meuble bas SDB ouest',       brand: 'IKEA',     category: 'bathroom',  qty: 1, dims: { w: 40,   d: 37,   h: 60   }, notes: 'METOD 40×37×60, blanc', glbPath: 'media/METOD Rangement mural blanc 40x37x60 cm.glb' },
  { id: 'bathroom-cabinet-east', name: 'Meuble bas SDB est',         brand: 'IKEA',     category: 'bathroom',  qty: 1, dims: { w: 40,   d: 37,   h: 60   }, notes: 'METOD 40×37×60, blanc', glbPath: 'media/METOD Rangement mural blanc 40x37x60 cm.glb' },
  { id: 'shower',           name: 'Receveur de douche 90×90',       brand: '',         category: 'bathroom',  qty: 1, dims: { w: 90,   d: 90,   h: 15   }, notes: 'Shower tray + VALLAMOSSE barre douchette + mitigeur thermostatique', glbPath: 'media/Shower tray 90x90cm.glb' },
  { id: 'toilet',           name: 'WC President Horizontal Outlet', brand: '',         category: 'bathroom',  qty: 1, dims: { w: 40,   d: 70,   h: 80   }, notes: 'Sortie horizontale', glbPath: 'media/president_toilet_horizontal_outlet.glb' },
  { id: 'vasque-sdb',       name: 'HAVBÄCK-ORRSJÖN 62×49×69 cm',   brand: 'IKEA',     category: 'bathroom',  qty: 1, dims: { w: 62,   d: 49,   h: 69   }, notes: 'Meuble avec tiroirs, vasque, mitigeur blanc', glbPath: 'media/HAVBÄCK - ORRSJÖN Meuble avec tiroirs-vasque-mitigeur blanc 62x49x69 cm.glb' },
  { id: 'water-heater',     name: 'Ballon eau chaude 100L',         brand: '',         category: 'bathroom',  qty: 1, dims: { w: 40,   d: 40,   h: 80   }, notes: 'Cylindrique, vertical' },
  { id: 'bathtub',          name: 'Baignoire',                      brand: '',         category: 'bathroom',  qty: 1, dims: { w: 150,  d: 70,   h: 50   }, notes: 'Coins arrondis, jardin' },

  // ── CLOTHING ─────────────────────────────────────────────────────────────────
  { id: 'mackapar',         name: 'Portant MACKAPÄR',               brand: 'IKEA',     category: 'clothing',  qty: 1, dims: { w: 77,  d: 32,  h: 200 }, notes: 'Avec 2 vêtements + casquette', glbPath: 'media/mackapar_ikea.glb' },
  { id: 'salopette',        name: 'Salopette noire',                brand: '',         category: 'clothing',  qty: 1, dims: { w: 6,   d: 40,  h: 150 }, notes: 'Noire, suspendue', glbPath: 'media/salopette-noir.glb' },
  { id: 'baseball-cap',     name: 'Casquette baseball',             brand: '',         category: 'clothing',  qty: 3, dims: { w: 25,  d: 20,  h: 15  }, notes: '3 casquettes rouges sur portant', glbPath: 'media/baseball_cap.glb' },
  { id: 'backpack',         name: 'Sac à dos',                      brand: '',         category: 'clothing',  qty: 1, dims: { w: 40,  d: 17,  h: 43  }, notes: 'Rouge procédural, mur A' },
  { id: 'sneaker',          name: 'Sneakers',                       brand: '',         category: 'clothing',  qty: 2, dims: { w: 30,  d: 12,  h: 12  }, notes: 'Paire, mur A niche', glbPath: 'media/sneaker.glb' },
  { id: 'jordan-hex-mule', name: 'Jordan Hex Mule SP',             brand: 'Nike/Jordan', category: 'clothing', qty: 1, dims: { w: 20,  d: 28.5, h: 9.4 }, notes: 'University Red, taille 44.5, FJ0603-600' },

  // ── DECOR ─────────────────────────────────────────────────────────────────────
  { id: 'mirror-nissedal-a',name: 'Miroir Nissedal 40×150 (mur A)', brand: 'IKEA',     category: 'decor',     qty: 4, dims: { w: 40,  d: 5,   h: 150 }, notes: 'Mur A, Reflector', glbPath: 'media/NISSEDAL miroir 40x150 noir.glb' },
  { id: 'mirror-nissedal-d',name: 'Miroir Nissedal 65×65 (mur D)',  brand: 'IKEA',     category: 'decor',     qty: 3, dims: { w: 65,  d: 5,   h: 65  }, notes: 'Mur D, Reflector',  glbPath: 'media/NISSEDAL miroir 65x65 noir.glb' },
  { id: 'mug',              name: 'Mug rouge',                      brand: '',         category: 'decor',     qty: 1, dims: { w: 8,   d: 8,   h: 9.5 }, notes: 'Bureau 2' },
  { id: 'mannequin-head',   name: 'Tête de mannequin',              brand: '',         category: 'decor',     qty: 3, dims: { w: 41,  d: 22,  h: 45  }, notes: '1 Sunnersta, 1 Kallax NW, 1 LACK' },
  { id: 'lamp-ola',         name: 'Lampe OLA',                      brand: 'IKEA',     category: 'decor',     qty: 1, dims: { w: 30,  d: 30,  h: 120 }, notes: 'Sur pied, meuble TV', glbPath: 'media/ikea_lamp_ola.glb' },
  { id: 'altappen-lantern', name: 'Lanterne ALTAPPEN',              brand: 'IKEA',     category: 'decor',     qty: 1, dims: { w: 22,  d: 22,  h: 35  }, notes: 'Jardin, desserte Viggja', glbPath: 'media/ikea_Altappen_single.glb' },
  { id: 'altappen-rug',     name: 'Dalle terrasse ALTAPPEN',        brand: 'IKEA',     category: 'decor',     qty: 40, dims: { w: 30,  d: 30,  h: 2   }, notes: 'Jardin, dalles assemblées' },
  { id: 'potted-palm',      name: 'Palmier en pot',                 brand: '',         category: 'decor',     qty: 1, dims: { w: 60,  d: 60,  h: 150 }, notes: 'Jardin, entre canapé et desserte', glbPath: 'media/potted_palm.glb' },
  { id: 'palm-leaf',        name: 'Feuille de palmier artificielle', brand: '',        category: 'decor',     qty: 1, dims: { w: 40,  d: 40,  h: 80  }, notes: 'Plante artificielle Palm_Leaf1', glbPath: 'media/Palm_Leaf1.glb' },
  { id: 'jogging-suit',     name: 'Jogging suit',                   brand: '',         category: 'clothing',  qty: 1, dims: { w: 40,  d: 20,  h: 170 }, notes: 'Jardin, près de la baignoire', glbPath: 'media/realistic_human_cloths.glb' },

  // ── PORTES ────────────────────────────────────────────────────────────────────
  { id: 'door-entry',       name: 'Porte d\'entrée',                brand: '',         category: 'doors',     qty: 1, dims: { w: 90,  d: 4,   h: 204 }, notes: 'Rouge, mur diagonal, poignée L + knob rouge' },
  { id: 'door-living',      name: 'Porte séjour',                   brand: '',         category: 'doors',     qty: 1, dims: { w: 83,  d: 4,   h: 204 }, notes: 'Blanche, mur D, poignée L double face' },
  { id: 'door-sdb',         name: 'Porte SDB',                      brand: '',         category: 'doors',     qty: 1, dims: { w: 4,   d: 83,  h: 204 }, notes: 'Blanche, mur couloir, poignée L double face' },
  { id: 'door-glass',       name: 'Porte-fenêtre',                  brand: '',         category: 'doors',     qty: 1, dims: { w: 160, d: 5,   h: 190 }, notes: 'Double battant PVC blanc, vitrage, seuil 20cm', actions: ['eastDoor'] },
];

export const STORAGE_SPACES: StorageSpace[] = [
  { id: 'kallax-ne-stack', name: 'Kallax NE',       dims: { w: 75.5, d: 39, h: 222 }, notes: 'Coin mur C+B — 2×1 bas + 2×2 haut empilés, 6 Drona + 1 dessus' },
  { id: 'kallax-se-stack', name: 'Kallax SE',       dims: { w: 75.5, d: 39, h: 151 }, notes: 'Mur B sud — 2× (2×1 pivoté), 4 Drona + meuble en T dessus' },
  { id: 'kallax-nw-stack', name: 'Kallax NW',       dims: { w: 75.5, d: 39, h: 227 }, notes: 'Coin mur A+C — tour 2×1 + 1×1 + 1×1 pivotés, 4 Drona' },
  { id: 'kallax-sw-stack', name: 'Kallax cuisine',  dims: { w: 75.5, d: 39, h: 371 }, notes: 'Niche mur D — 2×2 + 2×2 + 2×1 empilés, 4 Drona dans le bas' },
  { id: 'mackapar-stack',  name: 'Mackapär',        dims: { w: 77,   d: 32, h: 200 }, notes: 'Portant niche — combinaison + salopette + 2 Drona en haut' },
  { id: 'sunnersta-stack', name: 'Sunnersta',       dims: { w: 36,   d: 56, h: 90  }, notes: 'Desserte roulante — mannequin + casquette' },
  { id: 'cuisine-stack',   name: 'Cuisine',         dims: { w: 100,  d: 60, h: 93  }, notes: 'Plan de travail, évier, plaques, frigo, meuble bas, meuble haut + 3 Drona' },
  { id: 'corridor-closet', name: 'Placard couloir', dims: { w: 60,   d: 50, h: 250 }, notes: 'Porte pivotante + 3 étagères', actions: ['corrDoors'] },
  { id: 'sdb-closet',      name: 'Placard SDB',     dims: { w: 110,  d: 60, h: 250 }, notes: 'Double porte coulissante + étagère triangulaire 170cm (X=70→180, Z=600→660)' },
];

export const CATEGORIES: Category[] = [
  { id: 'all',          label: 'Tout' },
  { id: 'actionnable',  label: '⚡ Actionnable' },
  { id: 'storage',      label: 'Rangement' },
  { id: 'furniture',    label: 'Mobilier' },
  { id: 'tech',         label: 'Tech' },
  { id: 'kitchen',      label: 'Cuisine' },
  { id: 'bathroom',     label: 'Salle d\'eau' },
  { id: 'clothing',     label: 'Vêtements' },
  { id: 'decor',        label: 'Déco' },
  { id: 'doors',        label: 'Portes' },
  { id: 'glbs',         label: '🎲 GLBs' },
];
