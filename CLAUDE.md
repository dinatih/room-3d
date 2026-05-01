# Appartement 3D — React Three Fiber

Visualisation 3D interactive d'un appartement : navigation walk mode, inventaire, toggles de couches, WebXR.

## Lancement

```bash
npm install
npm run dev          # http://localhost:5173
npm run build
```

## Repère 3D

- 1 unité = 1 cm
- **X** (rouge) = largeur 3 m (0 → 300)
- **Y** (vert) = hauteur 2,5 m (0 → 250)
- **Z** (bleu) = profondeur 4 m+ (0 → 400+)
- Murs : A (X=0), B (X=ROOM_W), C (Z=0), D (Z=ROOM_D)
- `WALL_H = 250`

## Architecture R3F

Stack : React 18 + Three.js + `@react-three/fiber` + `@react-three/drei` + Vite + TypeScript.

Organisation par feature, avec aliases TypeScript/Vite :

- `@shared/*` → `src/shared/*` — code transverse (types, utils, config)
- `@features/*` → `src/features/*` — domaines fonctionnels
- `@config` → `src/shared/config.ts` — constantes de la pièce

```
src/
├── main.tsx                    # mount React
├── shared/
│   ├── config.ts               # ROOM_W, ROOM_D, WALL_H, etc.
│   ├── types.ts                # SceneItemProps (interface commune items/)
│   └── utils/
│       ├── useGLTFClone.ts     # hook : clone isolé d'un GLB
│       ├── glbUtils.ts         # removeGlbLines + glbLocalBBox
│       └── sceneItem.ts        # NOOP_ITEM, NOOP_STATE, NOOP_SIZE
└── features/
    ├── scene/                  # composition 3D
    ├── inventory/              # UI : panneau, inventaire, registry
    ├── camera/                 # contrôleurs caméra, walk/POV/VR
    └── devtools/               # FPS, stats, lidar, helpers
```

### `features/scene/`

```
Studio.tsx               # racine R3F : Canvas + lights + fog + état global UI
SceneContent.tsx         # variante minimale (utilisée dans Inventory preview)
Building.tsx             # coque architecturale : Walls + Floor + Mirrors
Placements.tsx           # placement monde de tous les meubles, items, portes,
                         #   décoration, jardin, sacs à dos, Drona standalone
Walker.tsx               # personnages animés (Lara, WalkerRed) + SkeletonHelper
GlbContext.tsx           # context React pour le toggle GLB
GlbModel.tsx             # helper de chargement GLB pour InventoryPreview
items/                   # composants items autonomes (65 fichiers, à plat)
animations/              # BuildAnimation 1-4 (chutes, montages animés)
layers/
    Grid.tsx             # grille + axes + labels de coordonnées
    XRayLayer.tsx        # toggle X-Ray (matériaux transparents)
    RedWallLayer.tsx     # toggle murs rouges
    Neighbors.tsx        # appartements voisins fantômes (mur D et mur A)
    sceneLayer.tsx       # CategoryLayerGroup + SceneLayerController
```

### `features/inventory/`

```
SidePanel.tsx            # panneau latéral : Mobilier / Affichage / Perf / Scène
Inventory.tsx            # modal inventaire complet
InventoryPreview.tsx     # prévisualisation 3D dans l'inventaire
HoverMenu.tsx            # menu contextuel au survol des objets 3D
AnimationsPanel.tsx      # panneau animations
Spinner.tsx              # spinner de chargement
Minimap.tsx              # minimap canvas 2D
FloorPlan.tsx            # plan 2D vue de dessus
inventoryData.ts         # INVENTORY : liste des objets avec dims, catégorie
registry.ts              # SCENE_REGISTRY : id → composant items/
floorplan.ts, floorData.ts, labels.ts  # données de plan
```

### `features/camera/`

```
CameraController.tsx     # walk mode (WASD + souris) + vues 2D/3D/POV
Controller.tsx           # contrôleur OrbitControls pour InventoryPreview
ImmersiveMode.tsx        # mode immersif plein écran
VRMode.tsx               # WebXR (VR/AR)
cameraState.ts           # état partagé caméra (camX, camZ, walkYaw, mirrorsHD…)
hoverState.ts            # état partagé hover (raycaster intersect, label…)
```

### `features/devtools/`

```
DevToolsCollector.tsx    # collecte stats Three.js (drawCalls, triangles, FPS)
DevToolsOverlay.tsx      # rendu HTML du panneau Perf (RENDU + SCÈNE + TOP)
LightHelpers.tsx         # helpers visuels : DirectionalLightHelper, etc.
LidarScan.tsx            # affichage point cloud lidar
devState.ts              # état partagé entre Collector et Overlay
```

### Composants items/ (`features/scene/items/`)

Chaque item est un composant autonome réutilisable. Interface commune `SceneItemProps` (`@shared/types`) :

```tsx
interface SceneItemProps {
  item:        Item;                          // données inventaire
  actionState: Record<string, boolean>;       // état des actions (ouvert/fermé…)
  onSize:      (size: THREE.Vector3) => void; // callback dimensions pour le preview
}
```

- **Coordonnées locales** : centré X/Z, Y=0 = sol (ou Y=0 = surface d'appui).
- **GLB** : `useGLTFClone` pour les instances multiples, `useGLTF` + clone manuel dans `useMemo` si nécessaire.
- **Scale + centre** calculés dans `useLayoutEffect` → `onSize` appelé en fin de setup.
- Placement monde **toujours dans le composant parent** (wrapper `<group position rotation>`), jamais hardcodé dans l'item lui-même.
- **Pattern B (scale dynamique)** : pour les items qui calculent leur scale depuis `glbLocalBBox`, **toujours** faire `scene.scale.set(1, 1, 1)` au début de `useLayoutEffect` — protège contre la re-exécution sur Suspense remount où le scene est déjà scalé.
- **`glbLocalBBox(scene)`** : drop-in replacement de `setFromObject(scene)` qui ignore les transforms du parent. À utiliser systématiquement plutôt que `setFromObject` pour éviter les corruptions sur Suspense remount.

### État UI et toggles

`Studio.tsx` gère deux objets d'état transmis à `SidePanel` :

```ts
type FurnitureState = {
  bedStacked, bedSofa, bedPosition, lampOn, laptopModel, ...
}
type LayerState = {
  structure, glb, xray, grid, dronaLabels, skeleton, redWalls, ...
}
```

Les actions UI passent par des `CustomEvent` `furniture-toggle` :

```ts
document.dispatchEvent(new CustomEvent('furniture-toggle', { detail: { key, value } }))
```

Les composants concernés (`Placements`, `Walker`, items avec état…) écoutent cet événement dans un `useEffect`. Le helper `useFurnitureToggles({eventKey: 'state-key'})` dans `Placements.tsx` factorise ce pattern.

### Couches visuelles (layers)

| Layer | Contenu |
|-------|---------|
| 0 | Défaut (Building, Walker, Mirrors) — visible dans les miroirs |
| LAYER_EQUIPMENT | Équipements sanitaires + cuisine |
| LAYER_FURNITURE | Mobilier + décoration |
| LAYER_NEIGHBORS | Voisins fantômes |
| LAYER_LIDAR | Point cloud lidar |

`XRayLayer` et `RedWallLayer` traversent la scène (`scene.traverse`) au mount/unmount pour swapper les matériaux, puis restaurent les originaux au cleanup.
