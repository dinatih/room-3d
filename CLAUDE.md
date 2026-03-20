# Appartement LEGO 3D

Visualisation 3D d'un appartement avec Three.js.

## Historique

Le projet a commencé comme un **fichier unique `lego-room.html`** de ~1770 lignes. Il a été découpé en ES Modules séparés dans `js/`, puis organisé en sous-dossiers thématiques. Les murs sont en `BoxGeometry` solides (plus de système LEGO/InstancedMesh).

**Important** : les ES Modules nécessitent un serveur HTTP local (`file://` bloqué par CORS). Voir [Lancement](#lancement).

## Architecture

ES Modules natifs (pas de bundler), `importmap` CDN pour Three.js.

### Structure des fichiers

```
room-3d/
├── lego-room.html       # HTML + CSS + importmap + <script src="js/main.js">
├── server.rb            # Serveur HTTP local Ruby (HTTP + HTTPS)
├── media/               # Fichiers GLB (modèles 3D)
└── js/
    ├── main.js          # Point d'entrée : construction de la scène
    ├── config.js        # Constantes globales (ROOM_W, WALL_H, COLORS, LAYERS…)
    ├── scene.js         # Scene, camera, renderer, OrbitControls, lights
    ├── cameraManager.js # Walk mode (WASD), vues 2D/3D/POV, render-on-demand
    │
    ├── utils/
    │   ├── loaders.js   # GLTFLoader + DRACOLoader partagés
    │   └── mergeUtils.js# mergeGlbByMaterial (optimisation GLB)
    │
    ├── structure/       # Géométrie architecturale
    │   ├── walls.js     # 4 murs + niche + ouvertures
    │   ├── floor.js     # Parquet, carrelage, dalles, plafond, sol extérieur
    │   ├── corridor.js  # Couloir, placard coulissant, mur diagonal
    │   ├── doors.js     # Panneaux de portes 3D + poignées
    │   ├── bathroom.js  # SDB : murs, douche, placard
    │   ├── vasque.js    # Meuble-vasque + miroir Reflector + lampe LED
    │   ├── wc.js        # WC + abattant
    │   └── kitchen.js   # Plan de travail, frigo, évier, plaques
    │
    ├── furniture/       # Meubles identifiables
    │   ├── bed.js       # Lit Utåker (GLB + procédural)
    │   ├── kallax.js    # Étagères KALLAX
    │   ├── drona.js     # Boîtes DRONA (GLB)
    │   ├── desks.js     # 2 bureaux assis/debout
    │   ├── laptop.js    # Laptop + smartphone + mug
    │   ├── tv.js        # Téléviseur mural
    │   ├── meubleT.js   # Meuble TV BESTÅ
    │   ├── mirrors.js   # Miroirs Nissedal (Reflector)
    │   ├── chair.js     # Chaise SMÖRKULL (GLB)
    │   ├── mackapar.js  # Portant MACKAPÄR (GLB)
    │   ├── sunnersta.js # Desserte SUNNERSTA (GLB)
    │   ├── lamp.js      # Lampe OLA (GLB)
    │   ├── airPerformer.js # Purificateur d'air
    │   ├── altappen.js  # Tapis ALTAPPEN (GLB)
    │   ├── garden.js    # Mobilier jardin (GLB)
    │   └── vihals.js    # Chaises jardin VIHOLMEN
    │
    ├── decor/           # Objets décoratifs et accessoires
    │   ├── decor.js     # Congélateur, étagère LACK, tringle MULIG
    │   ├── scooter.js   # Trottinette électrique (GLB)
    │   ├── backpacks.js # Sacs à dos
    │   ├── casquettes.js# Casquettes (GLB)
    │   ├── shoehatrack.js# Range-chaussures
    │   ├── sneakers.js  # Sneakers (GLB)
    │   └── walkingMan.js# Personnage marchant (GLB)
    │
    └── ui/              # Interface et outils de visualisation
        ├── events.js    # Tous les event handlers (toggles, VR, vues, x-ray…)
        ├── labels.js    # Font loader + makeText (TextGeometry)
        ├── grid.js      # Axes, grille, labels de coordonnées
        ├── minimap.js   # Minimap interactive (canvas 2D)
        ├── floorplan.js # Plan 2D (Three.js, toggle)
        ├── inventory.js # Panneau inventaire (modal + aperçu 3D)
        ├── inventoryData.js # Données inventaire (INVENTORY, CATEGORIES)
        ├── hoverMenu.js # Menu contextuel au survol des objets 3D
        ├── devtools.js  # Outils de développement en scène
        └── celShading.js# Effet cel-shading (toggle)
```

### Conventions

- Chaque module de mobilier exporte une fonction `buildXxx(scene)`.
- Les constantes globales (dimensions, couleurs, layers) sont centralisées dans `config.js`.
- `buildOnLayer(buildFn, layer)` dans `main.js` tague les objets créés pendant un build sur le bon layer Three.js. Les objets peuvent surcharger via `userData.layerOverride`.
- Les murs utilisent `BoxGeometry` (panneaux solides). La fonction locale `panel()` dans chaque module structure assigne automatiquement `LAYER_STRUCTURE` via `userData.layerOverride`.
- Les fichiers GLB sont dans `media/`, chargés via le `gltfLoader` partagé (`utils/loaders.js`).
- `ui/events.js` exporte `initEvents({ gridGroup, floorPlanGroup, buildingChildren })` — appelé en fin de `main.js` après la construction complète de la scène.

## Repère 3D

- 1 unité = 10cm
- **X** (rouge) = largeur 3m (0 → 300)
- **Y** (vert) = hauteur 2.5m (0 → 250)
- **Z** (bleu) = profondeur 4m+ (0 → 400+)
- Murs : A (X=0), B (X=ROOM_W), C (Z=0), D (Z=ROOM_D)

## Hauteur des murs

`WALL_H = 250cm`.

## Mode marche (Walk mode)

Raccourcis clavier (`cameraManager.js`) :

| Touche | Action |
|--------|--------|
| Flèches / WASD | Déplacement horizontal |
| ← → | Pivoter gauche/droite |
| Ctrl + ↑↓ | Incliner la caméra (pitch) |
| Alt + ↑↓ | Monter/descendre la caméra |
| Clic gauche + glisser | Regarder librement |
| Échap | Quitter le mode marche |

## Lancement

```bash
ruby server.rb
# ou
python3 -m http.server 8000
```

Puis ouvrir http://localhost:8080/lego-room.html
HTTPS disponible sur https://localhost:8443/lego-room.html
