# Appartement LEGO 3D

Visualisation 3D d'un appartement en briques LEGO avec Three.js.

## Historique

Le projet a commencé comme un **fichier unique `lego-room.html`** de ~1770 lignes : HTML, CSS, et tout le JavaScript Three.js dans un seul `<script type="module">`. Pratique pour prototyper, mais devenu difficile à maintenir au fur et à mesure que la scène s'enrichissait (murs, meubles, miroirs, grille...).

Le fichier a été découpé en **30 ES Modules** séparés dans `js/`, chacun responsable d'une partie de la scène. Le HTML ne conserve que le markup, le CSS, l'importmap CDN et un `<script src="js/main.js">`. Pas de bundler, pas de build step : les modules natifs du navigateur suffisent.

**Contrepartie** : la version monolithique pouvait s'ouvrir directement en `file://` dans le navigateur. Avec les ES Modules séparés, il faut obligatoirement un serveur HTTP local (les navigateurs bloquent les imports de modules en `file://` pour raisons de sécurité CORS). Voir la section [Lancement](#lancement).

## Architecture

Le projet utilise des **ES Modules** natifs (pas de bundler), avec un `importmap` CDN pour Three.js.

### Structure des fichiers

```
room-3d/
├── lego-room.html          # HTML + CSS + importmap + <script type="module" src="js/main.js">
├── server.rb               # Serveur HTTP local Ruby (HTTP + HTTPS)
└── js/
    ├── main.js              # Point d'entrée : scene setup, toggles, VR, resize
    ├── config.js            # Constantes (ROOM_W, WALL_H, NUM_LAYERS, BRICK_H, COLORS, etc.)
    ├── scene.js             # Scene, camera, renderer, OrbitControls, lights, env map
    ├── cameraManager.js     # Walk mode (WASD), vues 2D/3D/POV, render-on-demand
    ├── buildAnimation.js    # Animation brique-par-brique (tri par Y, InstancedMesh)
    ├── brickHelpers.js      # fillRow, addBrickX, addBrickZ, addFloorBrick, allBricks
    ├── materials.js         # Matériaux partagés entre modules
    ├── instancedMeshes.js   # InstancedMesh builder + studs + ground plane
    ├── walls.js             # buildWallWithOpenings + 4 murs + niche + cuisine walls
    ├── floor.js             # Sol LEGO (séjour, niche, porte, jardin) + parquet
    ├── corridor.js          # Couloir studio, placard coulissant, mur diagonal + porte entrée
    ├── bathroom.js          # SDB : murs, porte vitrée, douche, WC, vasque, chauffe-eau
    ├── kitchen.js           # Mobilier cuisine (plan de travail, frigo, évier, plaques)
    ├── drona.js             # dronaMat, addDronaBoxes
    ├── kallax.js            # buildKallaxUnit + 4 Kallax (2x3, 2x 1x4, 2x5) + Drona
    ├── bed.js               # Lit Utaker + matelas + couverture + polochons
    ├── mirrors.js           # 3x Nissedal mur D + 4x Nissedal mur A (Reflector)
    ├── chair.js             # Chaise SMÖRKULL
    ├── desks.js             # addBollsidan + 2 bureaux assis/debout
    ├── laptop.js            # Laptop + smartphone + mug (sur desk2Surface)
    ├── tv.js                # Téléviseur mural
    ├── mackapar.js          # Portant + vêtements
    ├── sunnersta.js         # Desserte SUNNERSTA
    ├── scooter.js           # Trottinette électrique
    ├── garden.js            # Canapé + mobilier jardin
    ├── decor.js             # Drona déco, congélateur CHIQ, étagère LACK, tringle MULIG
    ├── grid.js              # Axes, grille, labels, makeTextSprite
    ├── labels.js            # Font loader + makeText (TextGeometry)
    ├── minimap.js           # Minimap interactive (canvas 2D)
    └── floorplan.js         # Plan 2D (Three.js, toggle)
```

### Graphe de dépendances

```
main.js
├── config.js
├── scene.js ← config.js, THREE, OrbitControls
├── cameraManager.js ← config.js, scene.js, THREE, OrbitControls
├── buildAnimation.js ← cameraManager.js, THREE
├── brickHelpers.js ← config.js
├── instancedMeshes.js ← config.js, THREE
├── walls.js ← config.js, brickHelpers.js, THREE
├── floor.js ← config.js, brickHelpers.js
├── corridor.js ← config.js, brickHelpers.js, labels.js, THREE
├── bathroom.js ← config.js, brickHelpers.js, labels.js, THREE
├── kitchen.js ← config.js, THREE
├── drona.js ← THREE
├── kallax.js ← config.js, drona.js, THREE
├── bed.js ← config.js, THREE
├── mirrors.js ← config.js, THREE, Reflector
├── chair.js ← config.js, THREE
├── desks.js ← THREE
├── laptop.js ← desks.js, scene.js, THREE
├── tv.js ← config.js, scene.js, THREE
├── mackapar.js ← config.js, THREE
├── sunnersta.js ← config.js, THREE
├── scooter.js ← THREE
├── garden.js ← THREE
├── decor.js ← config.js, drona.js, THREE
├── grid.js ← config.js, THREE
├── labels.js ← THREE
├── minimap.js ← config.js
└── floorplan.js ← config.js, labels.js, THREE
```

### Conventions

- Chaque module de mobilier exporte une fonction `buildXxx(scene)`.
- `floor.js` exporte `buildFloor(allBricks)` (push directement dans le tableau).
- `instancedMeshes.js` exporte `buildInstancedMeshes(scene, allBricks)`.
- `drona.js` exporte `addDronaBoxes(scene, cx, cz, ...)` (scene en 1er paramètre).
- `allBricks` est le tableau partagé défini dans `brickHelpers.js`.
- Les constantes globales (dimensions, couleurs) sont centralisées dans `config.js`.
- `addBrickX` et `addBrickZ` acceptent un paramètre optionnel `rotY = 0` (rotation en Y, utilisé pour le mur diagonal via InstancedMesh).
- `addBrickX` et `addBrickZ` **auto-génèrent une plaque de 10cm** (`WALL_PLATE_H`) au-dessus de la dernière couche (`layer === NUM_LAYERS - 1`), sans appel supplémentaire dans les appelants.
- `buildOnLayer(buildFn, layer)` dans main.js traverse tout l'arbre de la scène (et non juste les enfants directs) pour tagger les layers correctement.

## Repère 3D

- 1 stud = 10cm
- **X** (rouge) = largeur 3m (0→30 studs)
- **Y** (vert) = hauteur 2.5m (0→25 studs)
- **Z** (bleu) = profondeur 4m (0→40 studs)
- Murs : A (X=0), B (X=30), C (Z=0), D (Z=40)

## Hauteur des murs

`WALL_H = 250cm` = 8 couches × `BRICK_H = 30cm` + 1 plaque `WALL_PLATE_H = 10cm`.
`NUM_LAYERS = 8` est explicite (non dérivé de `WALL_H / BRICK_H`).

## Mode marche (Walk mode)

Raccourcis clavier en mode walking (`cameraManager.js`) :

| Touche | Action |
|--------|--------|
| Flèches / WASD | Déplacement horizontal |
| ← → | Pivoter gauche/droite |
| Ctrl + ↑↓ | Incliner la caméra (pitch) |
| Alt + ↑↓ | Monter/descendre la caméra |
| Clic gauche + glisser | Regarder librement |
| Échap | Quitter le mode marche |

## Lancement

Servir via un serveur HTTP local (les ES modules ne fonctionnent pas en `file://`) :

```bash
ruby server.rb
# ou
python3 -m http.server 8000
```

Puis ouvrir http://localhost:8080/lego-room.html
HTTPS disponible sur https://localhost:8443/lego-room.html
