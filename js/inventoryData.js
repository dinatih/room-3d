// =============================================
// INVENTORY DATA — furniture, GLB objects, tech
// dims: { w, d, h } in cm (w=X, d=Z, h=Y)
// scenePos: { x, z } approximate center in scene coords
// glbPath: optional path to GLB file for 3D preview
// =============================================

export const INVENTORY = [

  // ── STORAGE ──────────────────────────────
  { id: 'kallax-ne-2x1',    name: 'Kallax 2×1 (NE)',                brand: 'IKEA',     category: 'storage',   qty: 1,  dims: { w: 75.5, d: 39,   h: 73   }, scenePos: { x: 280,  z: 38   }, notes: 'Empilée avec 2×2 au coin C+B' },
  { id: 'kallax-ne-2x2',    name: 'Kallax 2×2 (NE)',                brand: 'IKEA',     category: 'storage',   qty: 1,  dims: { w: 75.5, d: 39,   h: 149  }, scenePos: { x: 280,  z: 38   }, notes: 'Sur 2×1 NE, boîtes Drona' },
  { id: 'kallax-se-2x1',    name: 'Kallax 2×1 pivotée (SE)',        brand: 'IKEA',     category: 'storage',   qty: 2,  dims: { w: 75.5, d: 39,   h: 75.5 }, scenePos: { x: 281,  z: 320  }, notes: '2 unités empilées, rotation 90°' },
  { id: 'kallax-nw-2x1',    name: 'Kallax 2×1 pivotée (NW)',        brand: 'IKEA',     category: 'storage',   qty: 1,  dims: { w: 75.5, d: 39,   h: 75.5 }, scenePos: { x: 20,   z: 38   }, notes: 'Base tour NW' },
  { id: 'kallax-nw-1x1-a',  name: 'Kallax 1×1 pivotée (NW-milieu)',brand: 'IKEA',     category: 'storage',   qty: 1,  dims: { w: 45.5, d: 39,   h: 75.5 }, scenePos: { x: 20,   z: 38   }, notes: 'Milieu tour NW' },
  { id: 'kallax-nw-1x1-b',  name: 'Kallax 1×1 pivotée (NW-haut)',  brand: 'IKEA',     category: 'storage',   qty: 1,  dims: { w: 45.5, d: 39,   h: 75.5 }, scenePos: { x: 20,   z: 38   }, notes: 'Haut tour NW' },
  { id: 'kallax-sw-2x2',    name: 'Kallax 2×2 (niche)',             brand: 'IKEA',     category: 'storage',   qty: 2,  dims: { w: 75.5, d: 39,   h: 149  }, scenePos: { x: -20,  z: 300  }, notes: 'Remplie de Drona' },
  { id: 'kallax-sw-2x1',    name: 'Kallax 2×1 (niche, haut)',       brand: 'IKEA',     category: 'storage',   qty: 1,  dims: { w: 75.5, d: 39,   h: 73   }, scenePos: { x: -20,  z: 300  }, notes: 'Haut de la pile cuisine' },
  { id: 'drona-box',         name: 'Boîte Drona',                   brand: 'IKEA',     category: 'storage',   qty: 25, dims: { w: 33,   d: 38,   h: 33   }, scenePos: { x: 150,  z: 200  }, notes: 'Réparties dans les Kallax', glbPath: 'media/ikea_DRONA_black.glb' },
  { id: 'shelf-lack',        name: 'Étagère LACK',                  brand: 'IKEA',     category: 'storage',   qty: 1,  dims: { w: 26,   d: 110,  h: 5    }, scenePos: { x: 13,   z: 225  }, notes: 'Murale, mur A, 110cm le long de Z' },
  { id: 'basket-fniss',      name: 'Corbeille FNISS',               brand: 'IKEA',     category: 'storage',   qty: 2,  dims: { w: 28,   d: 28,   h: 28   }, scenePos: { x: 110,  z: 500  }, notes: '1 SDB, 1 séjour' },
  { id: 'meuble-t',          name: 'Bibliothèque (MeubleT)',         brand: '',         category: 'storage',   qty: 1,  dims: { w: 100,  d: 40,   h: 50   }, scenePos: { x: 240,  z: 30   }, notes: 'Procédural, mur C' },
  { id: 'vasque-sdb',        name: 'Ensemble vasque SDB',            brand: '',         category: 'storage',   qty: 1,  dims: { w: 63,   d: 48.5, h: 176  }, scenePos: { x: 112,  z: 488  }, notes: 'Meuble suspendu 60×47×50cm + plan vasque + lavabo + robinet + miroir 63×90cm + lampe LED' },

  // ── FURNITURE ────────────────────────────
  { id: 'utaker-lower',      name: 'Utåker - Lit bas',              brand: 'IKEA',     category: 'furniture', qty: 1,  dims: { w: 205,  d: 83,   h: 30   }, scenePos: { x: 290,  z: 88   }, notes: 'Empilable, matelas 200×80cm bleu' },
  { id: 'utaker-upper',      name: 'Utåker - Lit haut',             brand: 'IKEA',     category: 'furniture', qty: 1,  dims: { w: 205,  d: 83,   h: 30   }, scenePos: { x: 290,  z: 88   }, notes: 'Empilable, matelas 200×80cm blanc' },
  { id: 'desk-bollsidan-1',  name: 'Bureau assis-debout 1',         brand: 'IKEA',     category: 'furniture', qty: 1,  dims: { w: 68,   d: 36,   h: 70   }, scenePos: { x: 22,   z: 83   }, notes: 'Bollsidan, surface 68×36cm' },
  { id: 'desk-bollsidan-2',  name: 'Bureau assis-debout 2',         brand: 'IKEA',     category: 'furniture', qty: 1,  dims: { w: 68,   d: 36,   h: 70   }, scenePos: { x: 200,  z: 170  }, notes: 'Bollsidan, laptop + téléphone + mug' },
  { id: 'smorkull-chair',    name: 'Chaise de bureau Smörkull',     brand: 'IKEA',     category: 'furniture', qty: 1,  dims: { w: 67,   d: 67,   h: 128  }, scenePos: { x: 50,   z: 151  }, notes: 'Rouge, hauteur 128cm', glbPath: 'media/smorkull.glb' },
  { id: 'sunnersta',         name: 'Desserte SUNNERSTA',            brand: 'IKEA',     category: 'furniture', qty: 1,  dims: { w: 36,   d: 56,   h: 90   }, scenePos: { x: 282,  z: 300  }, notes: 'Roulante, têtes de mannequin dessus', glbPath: 'media/sunnersta_trolley_ikea.glb' },
  { id: 'bath-chest',        name: 'Coffre banc YITAHOME 100 Gal', brand: 'YITAHOME', category: 'furniture', qty: 1,  dims: { w: 122,  d: 55,   h: 62   }, scenePos: { x: 70,   z: -90  }, notes: 'Gris, jardin derrière canapé ouest' },
  { id: 'viggja',            name: 'Desserte VIGGJA',               brand: 'IKEA',     category: 'furniture', qty: 1,  dims: { w: 37,   d: 50,   h: 74   }, scenePos: { x: 100,  z: -125 }, notes: 'Jardin, à côté canapé ouest', glbPath: 'media/viggja.glb' },
  { id: 'sofa-red-1',        name: 'Canapé de jardin (grand)',      brand: '',         category: 'furniture', qty: 1,  dims: { w: 60,   d: 160,  h: 90   }, scenePos: { x: 300,  z: -110 }, notes: 'Rouge, côté est, avec accoudoirs' },
  { id: 'sofa-red-2',        name: 'Canapé de jardin (petit)',      brand: '',         category: 'furniture', qty: 1,  dims: { w: 60,   d: 100,  h: 100  }, scenePos: { x: 130,  z: -90  }, notes: 'Rouge, sans accoudoirs' },
  { id: 'folding-chair',     name: 'Chaise pliante VIHALS',         brand: 'IKEA',     category: 'furniture', qty: 1,  dims: { w: 43,   d: 47,   h: 80   }, scenePos: { x: -50,  z: 350  }, notes: 'Rouge, jardin, procédurale' },

  // ── TECH ─────────────────────────────────
  { id: 'tv',                name: 'Télévision murale',              brand: '',         category: 'tech',      qty: 1,  dims: { w: 70,   d: 2,    h: 40   }, scenePos: { x: 275,  z: 25   }, notes: '70×40cm, orientée vers le séjour' },
  { id: 'laptop',            name: 'Framework Laptop 13"',           brand: 'Framework',category: 'tech',      qty: 1,  dims: { w: 29.7, d: 22.8, h: 1.55 }, scenePos: { x: 200,  z: 170  }, notes: 'AMD Ryzen AI 5 340, 2256×1504 13", bureau 2' },
  { id: 'phone',             name: 'Téléphone OnePlus Nord 4',       brand: 'OnePlus',  category: 'tech',      qty: 1,  dims: { w: 7.5,  d: 16.2, h: 0.8  }, scenePos: { x: 222,  z: 172  }, notes: 'Coque rouge, bureau 2' },
  { id: 'scooter',           name: 'Trottinette Xiaomi 4',           brand: 'Xiaomi',   category: 'tech',      qty: 1,  dims: { w: 50,   d: 50,   h: 113  }, scenePos: { x: 282,  z: 460  }, notes: 'Guidon déplié, couloir', glbPath: 'media/xiaomi_electric_scooter_4.glb' },

  // ── KITCHEN ──────────────────────────────
  { id: 'counter',           name: 'Plan de travail',                brand: '',         category: 'kitchen',   qty: 1,  dims: { w: 100,  d: 60,   h: 3    }, scenePos: { x: 75,   z: 420  }, notes: 'Blanc, avec trou évier' },
  { id: 'cabinet-wood',      name: 'Placard cuisine',                brand: '',         category: 'kitchen',   qty: 1,  dims: { w: 40,   d: 60,   h: 90   }, scenePos: { x: 60,   z: 420  }, notes: 'Blanc, porte gris-bleu #607d8b' },
  { id: 'fridge',            name: 'Réfrigérateur',                  brand: '',         category: 'kitchen',   qty: 1,  dims: { w: 60,   d: 60,   h: 90   }, scenePos: { x: 100,  z: 420  }, notes: 'Blanc cassé' },
  { id: 'sink-boholmen',     name: 'Évier BOHOLMEN 1 bac',          brand: 'IKEA',     category: 'kitchen',   qty: 1,  dims: { w: 30,   d: 47,   h: 15   }, scenePos: { x: 60,   z: 420  }, notes: 'Inox, avec robinet' },
  { id: 'stove',             name: 'Plaques de cuisson (double)',    brand: '',         category: 'kitchen',   qty: 1,  dims: { w: 50,   d: 40,   h: 1    }, scenePos: { x: 100,  z: 420  }, notes: '2 foyers électriques' },
  { id: 'pizza-oven',        name: 'Four à pizza',                   brand: '',         category: 'kitchen',   qty: 1,  dims: { w: 20,   d: 20,   h: 19   }, scenePos: { x: -20,  z: 300  }, notes: 'Sur Kallax cuisine', glbPath: 'media/pizza_oven.glb' },
  { id: 'freezer',           name: 'Congélateur CHIQ CSD46D4E',     brand: 'CHIQ',     category: 'kitchen',   qty: 1,  dims: { w: 45,   d: 47,   h: 50   }, scenePos: { x: 47,   z: 236  }, notes: 'Noir, niche séjour' },

  // ── BATHROOM ─────────────────────────────
  { id: 'shower',            name: 'Douche',                         brand: '',         category: 'bathroom',  qty: 1,  dims: { w: 70,   d: 70,   h: 200  }, scenePos: { x: 25,   z: 635  }, notes: 'Cuve 20cm + vitrage translucide' },
  { id: 'toilet',            name: 'WC',                             brand: '',         category: 'bathroom',  qty: 1,  dims: { w: 40,   d: 40,   h: 75   }, scenePos: { x: 10,   z: 481  }, notes: 'Avec réservoir et siège torus' },
  { id: 'vanity',            name: 'Meuble vasque suspendu',         brand: '',         category: 'bathroom',  qty: 1,  dims: { w: 60,   d: 47,   h: 50   }, scenePos: { x: 106,  z: 485  }, notes: 'Blanc, vasque 35×25cm + robinet' },
  { id: 'bathroom-cabinets', name: 'Meubles muraux SDB',             brand: 'IKEA',     category: 'bathroom',  qty: 2,  dims: { w: 40,   d: 37,   h: 60   }, scenePos: { x: 20,   z: 485  }, notes: 'Blanc' },
  { id: 'water-heater',      name: 'Ballon eau chaude 100L',         brand: '',         category: 'bathroom',  qty: 1,  dims: { w: 40,   d: 40,   h: 80   }, scenePos: { x: 0,    z: 480  }, notes: 'Cylindrique, vertical' },
  { id: 'bathtub',           name: 'Baignoire',                      brand: '',         category: 'bathroom',  qty: 1,  dims: { w: 150,  d: 70,   h: 50   }, scenePos: { x: 120,  z: -250 }, notes: 'Coins arrondis, jardin' },

  // ── CLOTHING ─────────────────────────────
  { id: 'mackapar',          name: 'Portant MACKAPÄR',               brand: 'IKEA',     category: 'clothing',  qty: 1,  dims: { w: 77,   d: 32,   h: 200  }, scenePos: { x: 32,   z: 300  }, notes: 'Avec 2 vêtements + casquette', glbPath: 'media/mackapar_ikea.glb' },
  { id: 'jumpsuit',          name: 'Combinaison mécanicien',         brand: '',         category: 'clothing',  qty: 1,  dims: { w: 40,   d: 40,   h: 150  }, scenePos: { x: 32,   z: 300  }, notes: 'Rouge, suspendue', glbPath: 'media/mechanic_jumpsuit.glb' },
  { id: 'salopette',         name: 'Salopette noire',                brand: '',         category: 'clothing',  qty: 1,  dims: { w: 6,    d: 40,   h: 150  }, scenePos: { x: 42,   z: 300  }, notes: 'Noire, suspendue', glbPath: 'media/salopette-noir.glb' },
  { id: 'baseball-cap',      name: 'Casquette baseball',             brand: '',         category: 'clothing',  qty: 3,  dims: { w: 25,   d: 20,   h: 15   }, scenePos: { x: 40,   z: 300  }, notes: '3 casquettes rouges sur portant', glbPath: 'media/baseball_cap.glb' },
  { id: 'business-suit',     name: 'Costume',                        brand: '',         category: 'clothing',  qty: 1,  dims: { w: 50,   d: 30,   h: 170  }, scenePos: { x: 150,  z: 200  }, notes: 'Sur walking man', glbPath: 'media/man_black_business_suit.glb' },
  { id: 'realistic-cloths',  name: 'Tenue réaliste',                 brand: '',         category: 'clothing',  qty: 1,  dims: { w: 40,   d: 40,   h: 170  }, scenePos: { x: 260,  z: -250 }, notes: 'Rouge, près baignoire', glbPath: 'media/realistic_human_cloths.glb' },
  { id: 'backpack',          name: 'Sac à dos',                      brand: '',         category: 'clothing',  qty: 1,  dims: { w: 40,   d: 17,   h: 43   }, scenePos: { x: 8,    z: 258  }, notes: 'Rouge procédural, mur A' },
  { id: 'sneaker',           name: 'Sneakers',                       brand: '',         category: 'clothing',  qty: 2,  dims: { w: 30,   d: 12,   h: 12   }, scenePos: { x: 5,    z: 240  }, notes: 'Paire, mur A niche', glbPath: 'media/sneaker.glb' },

  // ── DECOR / MISC ─────────────────────────
  { id: 'mirror-nissedal-a', name: 'Miroir Nissedal (mur A)',        brand: 'IKEA',     category: 'decor',     qty: 4,  dims: { w: 40,   d: 2,    h: 160  }, scenePos: { x: 5,    z: 130  }, notes: '4 miroirs mur A, Reflector' },
  { id: 'mirror-nissedal-d', name: 'Miroir Nissedal (mur D)',        brand: 'IKEA',     category: 'decor',     qty: 3,  dims: { w: 40,   d: 2,    h: 160  }, scenePos: { x: 150,  z: 400  }, notes: '3 miroirs mur D, Reflector' },
  { id: 'rail-mulig',        name: 'Tringle MULIG',                  brand: 'IKEA',     category: 'decor',     qty: 1,  dims: { w: 26,   d: 80,   h: 3    }, scenePos: { x: 26,   z: 130  }, notes: 'Blanc, 3 pantalons rouges' },
  { id: 'mug',               name: 'Mug rouge',                      brand: '',         category: 'decor',     qty: 1,  dims: { w: 8,    d: 8,    h: 9.5  }, scenePos: { x: 178,  z: 163  }, notes: 'Bureau 2' },
  { id: 'mannequin-head',    name: 'Tête de mannequin',              brand: '',         category: 'decor',     qty: 3,  dims: { w: 41,   d: 22,   h: 45   }, scenePos: { x: 150,  z: 200  }, notes: '1 Sunnersta, 1 Kallax NW, 1 LACK' },
  { id: 'air-performer',     name: 'Dyson Air Performer',            brand: 'Philips',  category: 'decor',     qty: 1,  dims: { w: 20,   d: 20,   h: 100  }, scenePos: { x: 150,  z: 200  }, notes: 'Ventilateur/purificateur' },
  { id: 'lamp-ola',          name: 'Lampe OLA',                      brand: 'IKEA',     category: 'decor',     qty: 1,  dims: { w: 30,   d: 30,   h: 120  }, scenePos: { x: 150,  z: 200  }, notes: 'Sur pied, toggle ON/OFF', glbPath: 'media/ikea_lamp_ola.glb' },
  { id: 'altappen-lantern',  name: 'Lanterne ALTAPPEN',              brand: 'IKEA',     category: 'decor',     qty: 1,  dims: { w: 22,   d: 22,   h: 35   }, scenePos: { x: 100,  z: -125 }, notes: 'Jardin, desserte Viggja', glbPath: 'media/ikea_Altappen_single.glb' },
  { id: 'potted-palm',       name: 'Palmier en pot',                 brand: '',         category: 'decor',     qty: 1,  dims: { w: 60,   d: 60,   h: 150  }, scenePos: { x: 100,  z: -150 }, notes: 'Jardin, entre canapé et desserte', glbPath: 'media/potted_palm.glb' },
];

export const CATEGORIES = [
  { id: 'all',      label: 'Tout' },
  { id: 'storage',  label: 'Rangement' },
  { id: 'furniture',label: 'Mobilier' },
  { id: 'tech',     label: 'Tech' },
  { id: 'kitchen',  label: 'Cuisine' },
  { id: 'bathroom', label: 'Salle d\'eau' },
  { id: 'clothing', label: 'Vêtements' },
  { id: 'decor',    label: 'Déco' },
];
