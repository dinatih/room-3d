# Version vanilla Three.js — Archive

Cette version est conservée comme référence historique. La version active du projet est **R3F** (`r3f/`).

## Historique

Le projet a commencé comme un fichier unique `lego-room.html` de ~1770 lignes. Il a été découpé en ES Modules natifs dans `js/`, puis organisé en sous-dossiers thématiques.

**Important** : les ES Modules nécessitent un serveur HTTP local (`file://` bloqué par CORS).

## Lancement

```bash
ruby server.rb        # HTTP :8080 + HTTPS :8443
# ou
python3 -m http.server 8000
```

Ouvrir http://localhost:8080/lego-room.html

## Architecture

ES Modules natifs (pas de bundler), `importmap` CDN pour Three.js.

```
js/
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
│   ├── shoehatrack.js # Range-chaussures
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

## Conventions

- Chaque module de mobilier exporte une fonction `buildXxx(scene)`.
- Les constantes globales sont centralisées dans `config.js`.
- `buildOnLayer(buildFn, layer)` dans `main.js` tague les objets sur le bon layer Three.js.
- Les murs utilisent `BoxGeometry`. La fonction `panel()` locale assigne `LAYER_STRUCTURE` via `userData.layerOverride`.
- Les fichiers GLB sont dans `media/`, chargés via le `gltfLoader` partagé (`utils/loaders.js`).
- `ui/events.js` exporte `initEvents({ gridGroup, floorPlanGroup, buildingChildren })`.

## Mode marche (Walk mode)

| Touche | Action |
|--------|--------|
| Flèches / WASD | Déplacement horizontal |
| ← → | Pivoter gauche/droite |
| Ctrl + ↑↓ | Incliner la caméra (pitch) |
| Alt + ↑↓ | Monter/descendre la caméra |
| Clic gauche + glisser | Regarder librement |
| Échap | Quitter le mode marche |
