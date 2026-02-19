# Appartement LEGO 3D

Visualisation 3D d'un appartement en briques LEGO avec Three.js.

## Historique

Le projet a commencé comme un **fichier unique `lego-room.html`** de ~1770 lignes : HTML, CSS, et tout le JavaScript Three.js dans un seul `<script type="module">`. Pratique pour prototyper, mais devenu difficile à maintenir au fur et à mesure que la scène s'enrichissait (murs, meubles, miroirs, grille...).

Le fichier a été découpé en **17 ES Modules** séparés dans `js/`, chacun responsable d'une partie de la scène. Le HTML ne conserve que le markup, le CSS, l'importmap CDN et un `<script src="js/main.js">`. Pas de bundler, pas de build step : les modules natifs du navigateur suffisent.

**Contrepartie** : la version monolithique pouvait s'ouvrir directement en `file://` dans le navigateur. Avec les ES Modules séparés, il faut obligatoirement un serveur HTTP local (les navigateurs bloquent les imports de modules en `file://` pour raisons de sécurité CORS). Voir la section [Lancement](#lancement).

## Architecture

Le projet utilise des **ES Modules** natifs (pas de bundler), avec un `importmap` CDN pour Three.js.

### Structure des fichiers

```
room-3d/
├── lego-room.html          # HTML + CSS + importmap + <script type="module" src="js/main.js">
└── js/
    ├── main.js              # Point d'entrée : imports, animate loop, resize
    ├── config.js            # Constantes (ROOM_W, BRICK_H, KALLAX_*, FLOOR_Y, COLORS, etc.)
    ├── scene.js             # Scene, camera, renderer, controls, lights, env map
    ├── brickHelpers.js      # fillRow, addBrickX, addBrickZ, addFloorBrick, allBricks
    ├── walls.js             # buildWallWithOpenings + 4 murs + niche + cuisine walls
    ├── kitchen.js           # Mobilier cuisine (plan de travail, frigo, évier, plaques)
    ├── drona.js             # dronaMat, addDronaBoxes
    ├── kallax.js            # buildKallaxUnit + 4 Kallax (2x3, 2x 1x4, 2x5) + Drona
    ├── bed.js               # Lit Utaker + matelas + couverture + polochons
    ├── mirrors.js           # 3x Nissedal mur D + 4x Nissedal mur A (Reflector)
    ├── chair.js             # Chaise SMÖRKULL
    ├── desks.js             # addBollsidan + 2 appels
    ├── mackapar.js          # Portant + vêtements
    ├── decor.js             # Drona déco, congélateur CHIQ, étagère LACK, tringle MULIG, TV, desserte
    ├── corridor.js          # Couloir studio, placard coulissant, mur diagonal + porte entrée
    ├── bathroom.js          # SDB : murs, porte vitrée, douche, WC, vasque, chauffe-eau
    ├── floor.js             # Sol LEGO (séjour, niche, porte, jardin) + parquet
    ├── instancedMeshes.js   # InstancedMesh builder + studs + ground plane
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
├── brickHelpers.js ← config.js
├── walls.js ← config.js, brickHelpers.js, THREE
├── kitchen.js ← config.js, THREE
├── drona.js ← THREE
├── kallax.js ← config.js, drona.js, THREE
├── bed.js ← config.js, THREE
├── mirrors.js ← config.js, THREE, Reflector
├── chair.js ← config.js, THREE
├── desks.js ← THREE
├── mackapar.js ← config.js, THREE
├── decor.js ← config.js, drona.js, THREE
├── corridor.js ← config.js, brickHelpers.js, labels.js, THREE
├── bathroom.js ← config.js, brickHelpers.js, labels.js, THREE
├── floor.js ← config.js, brickHelpers.js
├── instancedMeshes.js ← config.js, THREE
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

## Repère 3D

- 1 stud = 10cm
- **X** (rouge) = largeur 3m (0→30 studs)
- **Y** (vert) = hauteur 2.5m (0→25 studs)
- **Z** (bleu) = profondeur 4m (0→40 studs)
- Murs : A (X=0), B (X=30), C (Z=0), D (Z=40)

## Lancement

Servir via un serveur HTTP local (les ES modules ne fonctionnent pas en `file://`) :

```bash
python3 -m http.server 8000
# ou
ruby -run -e httpd . -p 8000
```

Puis ouvrir http://localhost:8000/lego-room.html
