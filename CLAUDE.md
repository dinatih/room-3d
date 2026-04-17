# Appartement 3D — React Three Fiber

Visualisation 3D interactive d'un appartement : navigation walk mode, inventaire, toggles de couches, WebXR.

## Versions

| Version | Dossier | Statut |
|---------|---------|--------|
| **React Three Fiber** | `r3f/` | **Active — version principale** |
| Vanilla Three.js | `js/` | Archive — voir `js/README.md` |

## Lancement R3F

```bash
cd r3f
npm install
npm run dev          # http://localhost:5173
npm run dev:studio   # ouvre /studio.html directement
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

### Entrée de scène

```
r3f/src/
├── main.tsx              # mount React
├── types.ts              # SceneItemProps (interface commune items/)
└── utils/
    ├── useGLTFClone.ts   # hook : clone isolé d'un GLB (évite mutation partagée)
    └── glbUtils.ts       # removeGlbLines (nettoie les LineSegments des GLBs)
```

### Composants scène (`r3f/src/components/scene/`)

```
Studio.tsx          # Canvas R3F : lights, fog, tone mapping, état global UI
│
├── structure/      # Géométrie architecturale (portée sur LAYER_STRUCTURE)
│   ├── Walls.tsx       # 4 murs + niche + ouvertures
│   ├── Floor.tsx       # Parquet, carrelage, dalles, plafond
│   ├── Doors.tsx       # Panneaux de portes + poignées
│   ├── Kitchen.tsx     # Plan de travail, frigo, évier, plaques
│   └── Neighbors.tsx   # Bâtiment voisin extérieur
│
├── Furniture.tsx       # Meubles procéduraux placés (Kallax, TV, bureaux, lit…)
├── Furnishings.tsx     # Meubles avec état (portes, tiroirs, lit empilé/canapé…)
├── Placements.tsx      # Placement monde de tous les objets décoratifs
│                       #   FurniturePlacements → layers.furniture (LACK, MULIG, Fniss…)
│                       #   GlbPlacements       → layers.glb (scooter, chaise, Sneakers…)
├── Backpacks.tsx       # Sacs à dos procéduraux
├── DronaBoxes.tsx      # Boîtes DRONA + labels
├── Garden.tsx          # Mobilier jardin (procédural + GLB)
├── Mirrors.tsx         # Miroirs Reflector (MirrorSDB, Nissedal)
├── Walker.tsx          # Personnages animés (Lara, WalkerRed) + SkeletonHelper
│
├── XRayLayer.tsx       # Toggle couche X-Ray (matériaux transparents)
├── RedWallLayer.tsx    # Toggle murs rouges
├── GridLayer.tsx       # Grille + axes + labels de coordonnées
├── FloorPlan.tsx       # Plan 2D
├── Minimap.tsx         # Minimap canvas 2D
│
├── SidePanel.tsx       # UI : panneau Mobilier / Affichage / DevTools
├── HoverMenu.tsx       # Menu contextuel au survol des objets 3D
├── Inventory.tsx       # Modal inventaire
├── InventoryPreview.tsx# Prévisualisation 3D dans l'inventaire
├── CameraController.tsx# Walk mode (WASD + souris) + vues 2D/3D/POV
│
├── registry.ts         # SCENE_REGISTRY : id → composant items/ (pour inventaire)
└── inventoryData.ts    # INVENTORY : liste de tous les objets avec dims, catégorie…
```

### Composants items/ (`r3f/src/components/scene/items/`)

Chaque item est un composant autonome réutilisable :

```tsx
// Interface commune SceneItemProps (types.ts)
interface SceneItemProps {
  item:        any;                          // données inventaire
  actionState: Record<string, boolean>;      // état des actions (ouvert/fermé…)
  onSize:      (size: THREE.Vector3) => void;// callback dimensions pour le preview
}
```

- **Coordonnées locales** : centré X/Z, Y=0 = sol (ou Y=0 = surface d'appui pour les items posés).
- **GLB** : `useGLTFClone` pour les instances multiples, `useGLTF` + clone manuel dans `useMemo` si nécessaire.
- **Scale + centre** calculés dans `useLayoutEffect` → `onSize` appelé en fin de setup.
- Placement monde **toujours dans le composant parent** (wrapper `<group position rotation>`), jamais hardcodé dans l'item lui-même.

### État UI et toggles

`Studio.tsx` gère deux objets d'état transmis à `SidePanel` :

```ts
type FurnitureState = {
  bedStacked, bedSofa, bedPosition, lampOn, ...
}
type LayerState = {
  structure, glb, xray, grid, dronaLabels, skeleton, redWalls, ...
}
```

Les actions UI passent par des `CustomEvent` `furniture-toggle` :

```ts
document.dispatchEvent(new CustomEvent('furniture-toggle', { detail: { key, value } }))
```

Les composants concernés (`Furnishings`, `Placements`, `Walker`…) écoutent cet événement dans un `useEffect`.

### Couches visuelles (layers)

| Layer | Contenu |
|-------|---------|
| 0 | Tout (défaut) |
| LAYER_STRUCTURE | Murs, sol, portes |
| LAYER_GLB | Objets GLB |
| LAYER_FURNITURE | Meubles procéduraux |

`XRayLayer` et `RedWallLayer` traversent la scène (`scene.traverse`) au mount/unmount pour swapper les matériaux, puis restaurent les originaux au cleanup.
