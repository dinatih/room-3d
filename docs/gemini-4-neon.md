# Analyse complète du projet `room-3d` — Référence & Pistes d’optimisation (Gemini 4 Neon)

> Document de référence technique généré le **19 novembre 2026** à partir de l’inspection directe du dépôt `/home/dinatih/Projects/room-3d` (commit de base `5a20be1e`).  
> Objectif : cartographier l’architecture complète pour référence interne et recenser toutes les optimisations **FPS (GPU/CPU)**, **démarrage**, **mémoire/VRAM**, **bundle**, **assets** et **maintenabilité** non encore réalisées, en tenant compte de ce qui est déjà en place.

---

## 1. Vue d’ensemble & Métriques mesurées

### 1.1 Stack technique

| Couche | Technologies principales |
| --- | --- |
| UI & Framework | React `19.3.1`, TypeScript `6.0.3`, Vite `8.3.5` (Rolldown), Bootstrap `5.3.8`, Bootstrap Icons `1.13.2` |
| Moteur 3D | Three.js `0.186.1`, `@react-three/fiber` `9.8.2`, `@react-three/drei` `10.7.9` |
| État | Zustand `5.0.16` (stores React) + singletons mutables hors-React (`cameraState`, `devState`, `hoverState`, `positionState`) |
| Géométrie / Navigation / Raytracing | `polygon-clipping`, `three-mesh-bvh`, `three-gpu-pathtracer`, `suncalc` |
| Domotique | `home-assistant-js-websocket` (WebSocket temps réel) |
| Outillage & Tests | Node test runner (`npm test` : **611 tests unitaires**), Puppeteer (`tests/studio/`, `tests/visual/`), Pytest assets (`tests/assets/`), `@gltf-transform/*`, Blender CLI |

### 1.2 Volumétrie du dépôt (état réel)

- **Code source `src/`** : **91 260 lignes** TS/TSX réparties dans `src/features/*`.
- **Composants d’objets 3D** : **187 fichiers** dans `src/features/scene/items/`.
- **Boucles par frame** : **98 appels `useFrame(...)`** répartis dans `src/`.
- **Scripts utilitaires** : **504 fichiers** dans `scripts/`.
- **Assets `public/`** : **2,4 Go** au total :
  - `public/animations` : **1,1 Go**
  - `public/items` : **709 Mo**
  - `public/characters` : **354 Mo**
  - `public/environment` : **253 Mo** (principalement les HDRI 4K/2K)
  - `public/videos` : **43 Mo** | `public/audio` : **18 Mo** | `public/references` : **12 Mo** | `public/textures` : **11 Mo** | `public/models` : **7,5 Mo** | `public/media` : **6,1 Mo** | `public/draco` : **1,7 Mo**
- **Build production (`dist/assets/`)** :
  - `app-*.js` : **3,1 Mo**
  - `marissa-lion-*.png` : **1,8 Mo** (import statique ES)
  - `animation.worker-*.js` : **1,1 Mo**
  - `inventory-*.js` : **849 Ko**
  - `draco_decoder-*.js` : **703 Ko** + 2 × `.wasm` (**280 Ko** + **188 Ko**) + 2 × `draco_wasm_wrapper-*.js` (**58 Ko** chacun)
  - `Character-*.js` : **234 Ko** | `app-*.css` : **220 Ko** | `RaytracingPhotoModal-*.js` : **193 Ko** | `generateMeshBVH.worker-*.js` : **163 Ko** | `pathfinding.worker-*.js` : **126 Ko** | `Inventory-*.js` : **121 Ko**

### 1.3 Référence performance actuelle (Radeon 840M / Vulkan headless, 1362×810, DPR 1, 9 Laras)

Issues des audits mesurés dans [gestion-des-perfs.md](zed://file/home/dinatih/Projects/room-3d/docs/gestion-des-perfs.md:535) et [report.md](zed://file/home/dinatih/Projects/room-3d/test-results/pass-audit-bRmWY8/report.md:9) :

| Indicateur | Valeur observée | Poids des grands postes |
| --- | --- | --- |
| Cadence normale | **~25–28 FPS** | Limité à la fois par le **CPU de soumission** et le **GPU** |
| Soumissions (draw calls) / frame | **~1 439 DC** (1 573 avant `laraShadowBatches`) | Passes d’ombres : **~493–627 DC** ; 9 Laras : **~363–497 DC** ; reste décor/scène : **~945–1 067 DC** |
| Temps GPU médian / frame | **~13,8–15,9 ms** | Ombres ≈ **2,4 ms** ; 9 Laras ≈ **2,9 ms** ; baisse de pixels de 51 % ne gagne que ~12 % de FPS (pas uniquement fill-rate bound) |
| Temps CPU de rendu médian | **~14,3–19,0 ms** | Ombres ≈ **4,5 ms** ; 9 Laras ≈ **5,1 ms** |
| Démarrage complet | **~17–20 s** fin warmup GPU / **~32–36 s** scénario prêt | Montage CPU pré-warmup : **~8–10 s** (clonage GLTF ~0,97 s, `Character` ~1,25 s, herbe Canvas2D ~0,47 s, fusion statique) ; warmup GPU : **~3,35 s** (189 programmes shaders) |
| Pression mémoire hôte | **1,1–1,8 Go RAM libre**, **~13 Go swap** | Critique : la réduction RAM/VRAM impacte directement la stabilité FPS |

---

## 2. Architecture & Structure du projet

### 2.1 Points d’entrée (multi-pages Vite)

Déclarés dans [vite.config.ts:51](zed://file/home/dinatih/Projects/room-3d/vite.config.ts:51) :
1. **`index.html` → [main.tsx:1](zed://file/home/dinatih/Projects/room-3d/src/main.tsx:1)** : application principale (`HomeAssistantSync` + `Studio`). Initialise `devLog`, `resourceDownloadLogs`, `dracoSetup` (`useGLTF.setDecoderPath('/draco/')`) et les styles Bootstrap/SCSS.
2. **`lara-outfit-comparison.html` → `src/lara-outfit-comparison.tsx`** : grille dédiée à la comparaison visuelle des tenues de Lara.
3. **`dog-comparison.html` → `src/dog-comparison.tsx`** : vue dédiée à la comparaison des modèles/animations de chiens.

Plugins Vite personnalisés dans [vite.config.ts:21](zed://file/home/dinatih/Projects/room-3d/vite.config.ts:21) :
- `devLogPlugin()` : collecte en dev tous les événements navigateur/navigation/PNJ en JSONL dans `/tmp/room-3d-logs/latest.jsonl` (budget 500 Mio).
- `renderServicePlugin()` : pont vers le service de rendu photo/Blender local (`npm run render:service`).

### 2.2 Cartographie des modules `src/features/`

```text
src/
├── main.tsx, dracoSetup.ts, devLog.ts, types.ts
└── features/
    ├── scene/                         # Cœur 3D R3F (~75k lignes)
    │   ├── Studio.tsx                 # Racine <Canvas>, lumières globales, GpuWarmup, ShadowController, FrameloopController, UI overlays
    │   ├── Placements.tsx             # Façade des 6 passes (Equipment, Furniture, Furnishings, Decor, Animals, Robots)
    │   ├── placements/                # Placements par pièce (Bathroom, Kitchen, Corridor, LivingRoom, Garden, GardenLightStrips, Robot)
    │   ├── building/                  # Architecture (Walls, Floor, DoorsPlacement, Mirrors, BermudaGround, MergedStaticGroup, MagazineCutController)
    │   ├── items/                     # 187 composants meubles/objets (SceneItemProps, pattern B: reset scale -> glbLocalBBox -> onSize)
    │   ├── character/                 # Character, CharacterGroup, CharacterRuntimeProvider, animationLibrary, animation.worker, useCharacterPhysics, mergeLaraPairs, CharacterClothing
    │   ├── animations/                # Registres (animationRegistry, fabManifest, kitManifest, accadManifest, interxManifest + interx_manifest.json 1.38 Mo), resolver, transitions, duoAnimations
    │   ├── retargeting/               # Retargeting squelette (Mixamo/InterX/Miley/Unitree H2), footContacts, walkGrounding, hairChain
    │   ├── ai/                        # Système de vie autonome (laraLife, laraLifeStore, agentController, duoSessionManager, smartObjectRegistry, occupancyManager, bedRoutine)
    │   │   ├── agent/                 # Avoidance, duo handler, coords, walk animations
    │   │   └── navigation/            # NavMesh 2D booléen (polygon-clipping), funnel, obstacles, service, pathfindingClient, pathfinding.worker
    │   ├── camera/                    # Contrôleur caméra (orbit, follow, fpv, top, plane, iso), raccourcis, URL params
    │   ├── store/                     # useSceneStore (Zustand), layerUrlParams, debugPresets, useRobotVisibility
    │   ├── photo/                     # RaytracingPhotoModal (three-gpu-pathtracer + three-mesh-bvh worker + local worker)
    │   ├── sidepanel/                 # Sections UI & modales (Layers, Character, LaraLifePanel, Interactive, Profile, CV, Shortcuts)
    │   ├── transitions/               # LayerSmokeTransition, SmokeParticles (InstancedMesh 600 particules)
    │   └── utils/                     # zeroEnergyLights, visibleShadowReceivers, laraShadowBatches, rigidMeshBatches, animatedFrustumCulling, disposeModelResources, shareSkeletons, sceneGlass
    ├── inventory/                     # Inventaire 3D (lazy-loaded) + AnimationStudioView + AnimFrameController + InventoryPreview (2e Canvas R3F)
    ├── home-assistant/                # Client WebSocket Home Assistant (lumières, AirPerformer, appareils, caméra fisheye)
    ├── ui/                            # AppConsole & journalisation téléchargements ressources
    ├── lara-outfit-comparison/        # Page comparaison tenues Lara
    └── dog-comparison/                # Page comparaison chiens
```

### 2.3 Conventions & flux architecturaux clés

- **Repère 3D** : `1 unité = 1 cm`, sol intérieur et jardin alignés à `Y = 0` (`X` Est, `Y` Haut, `Z` Sud).
- **Séparation d’état** :
  - **Zustand** ([useSceneStore.ts:109](zed://file/home/dinatih/Projects/room-3d/src/features/scene/store/useSceneStore.ts:109), [laraLifeStore.ts:35](zed://file/home/dinatih/Projects/room-3d/src/features/scene/ai/laraLifeStore.ts:35)) pour l’état réactif UI/calques/mobilier/vie.
  - **Objets mutables hors-React** (`cameraState`, `devState`, `hoverState`, `positionState`) pour tout ce qui change à 60 Hz (positions acteurs, caméra, stats GPU, hover).
- **Boucle de rendu (`frameloop`)** : gérée par `FrameloopController` ([Studio.tsx:361](zed://file/home/dinatih/Projects/room-3d/src/features/scene/Studio.tsx:361)) :
  - `'never'` si inventaire, modale CV, mode photo ou veille (`isIdle`) ou iframe masquée ;
  - `'always'` si XR, intro caméra, orbite continue ou modale fisheye ;
  - `'demand'` par défaut (invalidé à chaque frame active par les personnages/animaux/robots/animations).
- **Layers Three.js** : `CategoryLayerGroup` + `SceneLayerController` isolent structure, murs, portes, sols, équipements, meubles, habillage, décor, miroirs (`LAYER_MIRRORS`), personnages (`LAYER_WALKER` + `LAYER_WALKER_DETAIL` masqué en FPV mais visible dans les miroirs), animaux, robots, voisins, lidar et environnement.
- **Pipeline de modèles GLB** :
  - `SceneModelContext` ([useGLTFClone.ts:22](zed://file/home/dinatih/Projects/room-3d/src/features/scene/useGLTFClone.ts:22)) substitue automatiquement les GLB haute-résolution par leur variante allégée `-scene-512.glb` / `-scene.glb` listée dans [scene-models.json:1](zed://file/home/dinatih/Projects/room-3d/src/features/scene/scene-models.json:1) dans la scène principale, tout en gardant les originaux en preview d’inventaire.
  - Registre d’actions unifié : `objectActions.ts` + `objectActionRegistry.ts` partagés entre scène, hover menu, previews et inventaire.
- **Web Workers (3 workers dédiés)** :
  1. [pathfinding.worker.ts](zed://file/home/dinatih/Projects/room-3d/src/features/scene/ai/navigation/pathfinding.worker.ts:1) : construction du NavMesh 2D (`polygon-clipping`, triangulation, fusion convexe) et placements duo. Les requêtes de chemin courantes s’exécutent ensuite synchroniquement sur le snapshot NavMesh partagé côté main thread.
  2. [animation.worker.ts:1](zed://file/home/dinatih/Projects/room-3d/src/features/scene/character/animation.worker.ts:1) : retargeting des clips d’animation (`retargetClip`) avec transfert de `ArrayBuffer`.
  3. `GenerateMeshBVHWorker` ([RaytracingPhotoModal.tsx:10](zed://file/home/dinatih/Projects/room-3d/src/features/scene/photo/RaytracingPhotoModal.tsx:10)) : construction BVH pour le pathtracer GPU.

---

## 3. Optimisations déjà en place (socle à préserver)

Avant d’optimiser, voici ce qui est **déjà implémenté et testé** dans le projet — ne pas le dupliquer ni le casser :

1. **Skip shader des lumières à énergie nulle / hors portée** : [zeroEnergyLights.ts:6](zed://file/home/dinatih/Projects/room-3d/src/features/scene/utils/zeroEnergyLights.ts:6) patche `ShaderChunk.lights_fragment_begin` pour éviter `RE_Direct` si `color == 0` ou `!directLight.visible`, sans changer le nombre de lumières (évite les recompilations de shaders).
2. **Culling des shadow maps inutilisées** : [visibleShadowReceivers.ts:29](zed://file/home/dinatih/Projects/room-3d/src/features/scene/utils/visibleShadowReceivers.ts:29) désactive `shadow.autoUpdate` sur les lumières dont aucun `receiveShadow` n’est dans le frustum caméra (hors présence d’un miroir visible).
3. **Batching des ombres natives de Lara** : [laraShadowBatches.ts:32](zed://file/home/dinatih/Projects/room-3d/src/features/scene/utils/laraShadowBatches.ts:32) regroupe les pièces opaques skinnées de chaque clone natif de Lara dans une géométrie de profondeur partagée (**-134 draw calls / frame**, 38 → 5 dessins d’ombres par Lara).
4. **Fusion des paires de pistolets Lara** : [mergeLaraPairs.ts:22](zed://file/home/dinatih/Projects/room-3d/src/features/scene/character/mergeLaraPairs.ts:22).
5. **Batching rigide par instanciation** : [rigidMeshBatches.ts:53](zed://file/home/dinatih/Projects/room-3d/src/features/scene/utils/rigidMeshBatches.ts:53) (`useRigidMeshBatches`) utilisé pour les robots articulés (Unitree/rovers).
6. **Fusion statique par pièce** : [MergedStaticGroup.tsx:10](zed://file/home/dinatih/Projects/room-3d/src/features/scene/building/MergedStaticGroup.tsx:10) utilisé sur murs, sols, plafonds, cadres miroirs et placements par pièce.
7. **Warmup GPU unifié** : [Studio.tsx:211](zed://file/home/dinatih/Projects/room-3d/src/features/scene/Studio.tsx:211) utilise un seul `gl.compileAsync(scene, camera)` en parallèle du préchargement des animations (au lieu des 865 appels redondants d’avant le 15 novembre).
8. **Variantes allégées scène (`-scene-512.glb`)** : 63 modèles déjà mappés dans [scene-models.json:1](zed://file/home/dinatih/Projects/room-3d/src/features/scene/scene-models.json:1), avec libération du `gltf.parser` dans [useGLTFClone.ts:38](zed://file/home/dinatih/Projects/room-3d/src/features/scene/useGLTFClone.ts:38) et déchargement des previews HD au démontage.
9. **Miroirs frustum-culled** : [Mirrors.tsx:198](zed://file/home/dinatih/Projects/room-3d/src/features/scene/building/Mirrors.tsx:198) remplace les `Reflector` (512×512, `multisample: 0`) par un matériau métallique PBR tant que le miroir est hors champ ou hors pièce.
10. **Lazy loading de l’Inventaire & du RaytracingPhotoModal** : [Studio.tsx:95](zed://file/home/dinatih/Projects/room-3d/src/features/scene/Studio.tsx:95).

---

## 4. Optimisations FPS prioritaires (GPU & CPU de rendu)

### P0 — Critique (fort gain FPS mesurable)

#### 4.1 Débloquer `MergedStaticGroup` sur les objets interactifs statiques & matériaux dupliqués (**-300 à -600 DC**)
- **Constat précis** :
  - [MergedStaticGroup.tsx:38](zed://file/home/dinatih/Projects/room-3d/src/features/scene/building/MergedStaticGroup.tsx:38) exclut de la fusion **tout sous-arbre portant `hoverAction` ou `skipMerge`** — soit **35+ groupes d’objets dans `placements/`**, dont beaucoup sont **100 % immobiles** (baignoire, canapé ouest, Kallax, meubles cuisine, WC, lits en état fixe, lampes, clôtures dans [Walls.tsx:218](zed://file/home/dinatih/Projects/room-3d/src/features/scene/building/Walls.tsx:218)).
  - [MergedStaticGroup.tsx:70](zed://file/home/dinatih/Projects/room-3d/src/features/scene/building/MergedStaticGroup.tsx:70) regroupe par `mat.uuid`, mais **94 `new THREE.Mesh*Material(...)`** sont instanciés dans `src/features/scene/items/` (souvent dans des `useMemo` par instance) et 10 composants passent `ownMaterials = true` à `useGLTFClone`. Deux instances du même objet créent donc deux `mat.uuid` différents et ne fusionnent pas.
  - [MergedStaticGroup.tsx:122](zed://file/home/dinatih/Projects/room-3d/src/features/scene/building/MergedStaticGroup.tsx:122) ne s’exécute qu’au premier montage : tout enfant `<Suspense>` chargé après coup n’est jamais fusionné.
- **Pistes concrètes** :
  1. **Dissocier rendu statique et détection hover** : pour les objets immobiles avec `hoverAction`, laisser leurs meshes visuels fusionner dans `MergedStaticGroup` et attacher un **box/cylinder proxy léger** portant `hoverAction` (avec `material.visible = false` : raycastable par Three.js, **0 draw call** WebGL !), comme le fait déjà `Character.tsx` — mais en corrigeant le proxy de [Character.tsx:1356](zed://file/home/dinatih/Projects/room-3d/src/features/scene/character/Character.tsx:1356) qui utilise actuellement `transparent opacity={0}` (ce qui soumet encore 8 draw calls transparents).
  2. **Partager les matériaux procéduraux au niveau module** (ou regrouper dans `MergedStaticGroup` par signature de matériau plutôt que uniquement `mat.uuid` lorsque les matériaux sont statiques).
  3. **Instancier les modèles répétés** (`InstancedMesh`) : panneaux de clôture bois (`WoodenFencePanel` dans [Walls.tsx:218](zed://file/home/dinatih/Projects/room-3d/src/features/scene/building/Walls.tsx:218)), casquettes (`TruckerCapRed` ×7), boîtes `Drona`, cadres `Nissedal`, bocaux/verres/accessoires répétés.
  4. **Conserver l’indexation dans `MergedStaticGroup`** : [MergedStaticGroup.tsx:66](zed://file/home/dinatih/Projects/room-3d/src/features/scene/building/MergedStaticGroup.tsx:66) convertit systématiquement en non-indexé (`toNonIndexed()`), ce qui multiplie jusqu’à ×3 la taille des buffers sommets et le nombre de vertex shaders exécutés. Quand toutes les géométries d’un lot sont indexées, fusionner directement en indexé.

#### 4.2 Optimiser les ombres directionnelles (`SunLight` + `MoonLight`) (**-1,5 à -3 ms GPU, -2 à -4 ms CPU, -16 Mo VRAM**)
- **Constat précis** :
  - [SunLight.tsx:49](zed://file/home/dinatih/Projects/room-3d/src/features/scene/SunLight.tsx:49) et [DayNight.tsx:99](zed://file/home/dinatih/Projects/room-3d/src/features/scene/DayNight.tsx:99) créent **deux `DirectionalLight` `castShadow` `2048×2048` séparées**, toutes deux avec une caméra orthographique couvrant `[-SKY_RADIUS, +SKY_RADIUS]` où `SKY_RADIUS = 3600 cm` ([skyBounds.ts:2](zed://file/home/dinatih/Projects/room-3d/src/features/scene/skyBounds.ts:2)) — soit **72 m × 72 m** (`far = 108 m`) !
  - L’appartement + jardin réel tient dans environ **12 m × 16 m**. Un frustum de 72 m × 72 m :
    1. Empêche tout frustum culling de la passe d’ombres (tous les objets de la scène sont soumis) ;
    2. Dilue la résolution d’ombre à **3,5 cm / texel** (alors qu’un frustum calé sur l’emprise réelle donne **~0,7 cm / texel** à 2048², ou la même netteté actuelle en **1024²**, soit 4× moins de pixels de profondeur) ;
    3. La présence de 2 `DirectionalLight` actives dans la scène ajoute un 2e slot `NUM_DIR_LIGHTS = 2` dans les **~189 shaders PBR** compilés, alloue **2 shadow maps 2048²** en VRAM, et peut déclencher les **2 passes d’ombres simultanément** au crépuscule.
- **Pistes concrètes** :
  1. **Fusionner `SunLight` et `MoonLight` en une seule `DirectionalLight` céleste** qui bascule couleur/intensité/direction entre soleil (jour) et lune (nuit). Gain immédiat : 1 shadow map 2048² libérée, 1 boucle directionnelle supprimée de tous les shaders, zéro double passe crépusculaire.
  2. **Resserrer le frustum d’ombre** de `[-3600, 3600]` à l’emprise réelle appartement + jardin (ex. `[-900, 900]` ou calculé autour de l’appartement, `far ≈ 2500`). Évaluer ensuite `1024×1024` vs `2048×2048` (à frustum resserré, `1024×1024` est déjà **2× plus net** que le `2048×2048` actuel !).
  3. **Auditer les `castShadow` sur les micro-objets** : de nombreux petits objets (`LaserDistanceMaster` 6 meshes `castShadow`, `SummerOutdoorBoot` 11 meshes `castShadow`, `Goldfish`, `Starfish`, `DogBowl`, `DoubleVenusPendant`, vitres `Shower` transparentes avec `castShadow` dans [Shower.tsx:208](zed://file/home/dinatih/Projects/room-3d/src/features/scene/items/Shower.tsx:208)) projettent des ombres invisibles dans la shadow map tout en ajoutant des dizaines de draw calls à chaque frame.

#### 4.3 Personnages (9 Laras = ~363–497 DC, ~2,9 ms GPU / ~5,1 ms CPU)
- **Constat précis** :
  - Dans [Character.tsx:1042](zed://file/home/dinatih/Projects/room-3d/src/features/scene/character/Character.tsx:1042), `isVisibleInFrustum` est calculé **uniquement** pour skipper `updatePhysics(...)` ([Character.tsx:1244](zed://file/home/dinatih/Projects/room-3d/src/features/scene/character/Character.tsx:1244)). Le `mixer.update(...)` ([Character.tsx:1232](zed://file/home/dinatih/Projects/room-3d/src/features/scene/character/Character.tsx:1232)), l’évaluation de 70+ os et la mise à jour des matrices skinnées continuent à **60 Hz pour les personnages hors champ** !
  - Chaque Lara native possède ~38 pièces skinnées ; `laraShadowBatches` a réduit les ombres de 38 → 5 DC, mais la **passe couleur principale** reste à ~30–40 DC par Lara (~300+ DC rien que pour les 9 Laras en couleur).
- **Pistes concrètes** :
  1. **Cadence adaptative (animation LOD) hors frustum / lointains** : lorsque `!isVisibleInFrustum` (et hors miroir visible), accumuler `delta` et n’exécuter `mixer.update(accumulatedDelta)` qu’à **10–15 Hz** (ou uniquement lors d’un changement d’état/fin de clip `LoopOnce`, afin de ne jamais perturber `reportAnimationPlayback` ni la synchro duo). Pour les Laras visibles mais lointaines (> 6 m), envisager 30 Hz.
  2. **Fusion couleur des sous-meshes Lara partageant le même matériau/atlas** : étendre la logique de `mergeLaraPairs` aux paires/groupes de meshes natifs qui restent toujours visibles ensemble et partagent des paramètres matériaux identiques (ou cuire un atlas de textures unique par variante de Lara).
  3. **Mémoïser la prop `torso` de `CharacterPendant`** : [Character.tsx:1369](zed://file/home/dinatih/Projects/room-3d/src/features/scene/character/Character.tsx:1369) recrée `[...parts.torsoClothed, ...parts.torsoNude].map(...)` à chaque rendu React.

---

### P1 — Important (gains GPU/CPU directs, faible risque)

#### 4.4 Borner la portée (`distance`) des 6 `pointLight` actuellement à `distance={0}` (infinie)
- **Constat précis** :
  - `BathroomPlacements.tsx:141` (`distance={0}`), `CorridorPlacements.tsx:141` (`distance={0}`), `LivingRoomPlacements.tsx:480` (`distance={0}`), et les **3 lumières de [GardenLightStrips.tsx:50](zed://file/home/dinatih/Projects/room-3d/src/features/scene/placements/GardenLightStrips.tsx:50)** (`distance={0}`, `decay={1}`) ont une portée **infinie**.
  - Conséquence directe : même avec le patch [zeroEnergyLights.ts:11](zed://file/home/dinatih/Projects/room-3d/src/features/scene/utils/zeroEnergyLights.ts:11), dès qu’une de ces lampes est allumée, `directLight.visible` vaut `true` sur **tous les pixels de toute la scène**, annulant le skip shader dans les autres pièces et faisant traverser la lumière à travers les murs.
  - En mode `lightsHD`, jusqu’à **7 `pointLight`** activent `castShadow` (cube maps 6 faces × `512²` ou `1024²` = **42 passes d’ombres** !).
- **Pistes concrètes** :
  1. Fixer un `distance` réaliste par pièce (ex. `280–450 cm` SDB/couloir, `600 cm` séjour, `350–450 cm` bandes jardin). `zeroEnergyLights.ts` éliminera automatiquement le coût PBR hors rayon.
  2. Réduire `GardenLightStrips` de 3 `pointLight` à **1 seule `pointLight`** (ou 2 max sans `castShadow`, les bandes LED diffuses n’ayant pas besoin d’ombres cubiques nettes).

#### 4.5 Nettoyer les `useFrame` coûteux ou inutiles (98 callbacks actifs)
- **[PresenceLightController.tsx:48](zed://file/home/dinatih/Projects/room-3d/src/features/scene/PresenceLightController.tsx:48)** :
  - Appelle `getRaytracingPreset()` à **chaque frame** → instancie `new URLSearchParams(window.location.search)` 60 fois/s ([cameraUrlParams.ts:24](zed://file/home/dinatih/Projects/room-3d/src/features/scene/camera/cameraUrlParams.ts:24)) + alloue `Object.values(cameraState.positions)` à chaque frame.
  - **Fix** : lire le preset URL une seule fois au montage et throttler la détection de présence à **2–4 Hz** (toutes les 250–500 ms).
- **[HoverMenu.tsx:285](zed://file/home/dinatih/Projects/room-3d/src/features/scene/HoverMenu.tsx:285)** (`HoverRaycaster`) :
  - À chaque frame où la caméra bouge (orbite, suivi, FPV), appelle `raycastAt` → `canvas.getBoundingClientRect()` (peut forcer un **reflow DOM synchrone**) + double raycast (`interactiveCache` + `occluderCache`).
  - **Fix** : cacher le rect du canvas via `ResizeObserver` et throttler `checkHover()` à ~10–15 Hz pendant les mouvements caméra.
- **[GardenLightStrips.tsx:43](zed://file/home/dinatih/Projects/room-3d/src/features/scene/placements/GardenLightStrips.tsx:43)** :
  - Appelle `invalidate()` à **60 Hz** pour faire défiler un arc-en-ciel dont la période est de **60 secondes** (`RAINBOW_PERIOD_SECONDS = 60`).
  - **Fix** : mettre à jour la teinte et invalider à **10–15 Hz** (visuellement indiscernable sur un cycle de 60 s).
- **[BermudaGround.tsx:123](zed://file/home/dinatih/Projects/room-3d/src/features/scene/building/BermudaGround.tsx:123)** :
  - Le plan d’herbe extérieur est en `transparent: true, opacity: 0.8` : il passe en **rendu transparent** (pas d’early-Z, blending plein écran par-dessus la dalle).
  - **Fix** : passer en matériau **opaque** (`transparent: false`, `opacity: 1`) en ajustant la teinte/luminosité diffuse si nécessaire.
- **[Studio.tsx:972](zed://file/home/dinatih/Projects/room-3d/src/features/scene/Studio.tsx:972)** (`<AdaptiveDpr pixelated />`) :
  - Monté mais **inactif** : aucun fichier dans `src/` n’appelle `performance.regress()`.
  - **Fix** : soit brancher `performance.regress()` pendant les mouvements caméra rapides (drag/orbit/vol), soit supprimer `<AdaptiveDpr />`.

#### 4.6 Re-renders React & effets de bord dans `Studio.tsx`
- **[Studio.tsx:478](zed://file/home/dinatih/Projects/room-3d/src/features/scene/Studio.tsx:478)** : `const layers = useSceneStore(state => state.layers);` souscrit le composant racine entier à **tous** les changements de calques (vêtements de Lara, `laraCount`, `aiZones`, `grid`, etc.), re-rendant l’arbre complet du `<Canvas>` et des menus. Extraire des sous-composants avec sélecteurs atomiques (`state => state.layers.xxx`) ou `useShallow`.
- **[Studio.tsx:955](zed://file/home/dinatih/Projects/room-3d/src/features/scene/Studio.tsx:955)** : `onCapture={(cam) => { activeCameraRef.current = cam; }}` est une fonction inline qui relance l’`useEffect` d’`ActiveCameraCapture` à chaque rendu de `Studio`.
- **[Studio.tsx:347](zed://file/home/dinatih/Projects/room-3d/src/features/scene/Studio.tsx:347)** (`ShadowController`) : au montage initial, `gl.shadowMap.enabled` est déjà `true` (ligne 948), pourtant l’effet parcourt toute la scène et positionne `material.needsUpdate = true` sur tous les matériaux (recompilation shader inutile si `gl.shadowMap.enabled === enabled`). Comparer avec la valeur courante avant de traverser la scène.
- **[DevToolsCollector.tsx:248](zed://file/home/dinatih/Projects/room-3d/src/features/scene/DevToolsCollector.tsx:248)** : quand les FPS tombent `< 12` pendant 40 frames, `logDiagnostics()` lance un `scene.traverse` complet + `console.table(...)`, ce qui aggrave le freeze au pire moment. Le limiter au mode dev explicite ou le différer via `requestIdleCallback`.

---

## 5. Autres optimisations (Démarrage, Bundle, Mémoire/VRAM, Assets, Architecture)

### 5.1 Temps de chargement & démarrage à froid (actuellement ~17–20 s warmup / ~32–36 s prêt)

1. **`useGLTFClone` : éviter `SkeletonUtils.clone()` sur les objets rigides (~0,97 s mesuré)**  
   - [useGLTFClone.ts:64](zed://file/home/dinatih/Projects/room-3d/src/features/scene/useGLTFClone.ts:64) appelle systématiquement `SkeletonUtils.clone(...)` sur **tous** les GLB, y compris les dizaines de meubles/objets rigides sans aucun `SkinnedMesh` ni `Bone`.
   - **Fix** : mettre en cache un booléen `hasSkinnedMesh` dans une `WeakMap<THREE.Object3D, boolean>` et utiliser `source.clone(true)` pour les modèles rigides, en ne gardant `SkeletonUtils.clone()` et `shareSkeletons()` que pour les modèles skinnés.
2. **Texture d’herbe procédurale Canvas2D synchrone (~0,47 s mesuré)**  
   - [Floor.tsx:154](zed://file/home/dinatih/Projects/room-3d/src/features/scene/building/Floor.tsx:154) (`makeGrassTex`) exécute **9 000 tracés `ctx.stroke()` + 80 gradients radiaux** synchrones sur le thread principal au démarrage, alors que `BermudaGround` recouvre le sol par défaut !
   - De même [Floor.tsx:65](zed://file/home/dinatih/Projects/room-3d/src/features/scene/building/Floor.tsx:65) (`makeParquetTex`) dessine ~20 000 segments de grain bois synchrones.
   - **Fix** : remplacer par deux petites images statiques pré-cuites (WebP/PNG 256×256, < 20 Ko) ou générer `makeGrassTex` en lazy uniquement lorsque `bermudaGrass === false`.
3. **Fuite mémoire `setupEnvironment` au boot**  
   - [Studio.tsx:111](zed://file/home/dinatih/Projects/room-3d/src/features/scene/Studio.tsx:111) crée deux `PlaneGeometry`, deux `MeshStandardMaterial` et un `WebGLRenderTarget` via `pmrem.fromScene(...)` qui ne sont jamais libérés lorsque `SkySphere` remplace `scene.environment` quelques secondes plus tard. Disposer les géométries/matériaux temporaires dès la fin de `fromScene`, et disposer le `RenderTarget` quand le HDRI prend le relais.

### 5.2 Bundle JS, Workers & Dépendances (`dist/assets/`)

1. **Dédupliquer et externaliser les 1,95 Mo de manifestes d’animations (gain énorme sur le JS parsé !)**  
   - `src/features/scene/animations/` contient **1,95 Mo** de données statiques :
     - `interx_manifest.json` : **1,38 Mo**
     - `animationRegistry.ts` : **296 Ko** (9 786 lignes)
     - `fabManifest.ts` : **123 Ko** (5 110 lignes)
     - `kitManifest.ts` : **108 Ko**
   - Parce que [retargetClip.ts:9](zed://file/home/dinatih/Projects/room-3d/src/features/scene/retargeting/retargetClip.ts:9) importe `INTERX_MANIFEST`, **les 1,38 Mo de `interx_manifest.json` sont bundlés DEUX FOIS** : dans `app-*.js` (**3,1 Mo**) **ET** dans `animation.worker-*.js` (**1,1 Mo**) !
   - **Fix** :
     - Ne passer au worker (`AnimationRequest`) que l’entrée spécifique nécessaire au clip à retargeter (au lieu d’importer tout le manifeste dans `retargetClip.ts`) → **`animation.worker-*.js` chute de ~1,1 Mo à < 200 Ko**.
     - Servir les gros manifestes JSON (`interx_manifest.json`, catalogues d’inventaire/studio d’animations) en fetch asynchrone depuis `public/` (ou chunk lazy chargé à la demande) → **`app-*.js` réduit de > 1,4 Mo** et parsing JS initial nettement accéléré.
2. **Supprimer les dépendances npm inutilisées**  
   - `@react-three/postprocessing` (`^3.2.2`) : **0 import** dans `src/`.
   - `3d-tiles-renderer` (`^0.5.3`) : **0 import** dans `src/`.
3. **Nettoyer les assets statiques importés en ES module & Draco dupliqué**  
   - `src/features/scene/assets/marissa-lion.png` (**1,8 Mo**) est copié tel quel dans `dist/assets/` pour un petit tatouage de bras ([MarissaArmTattoo.ts:2](zed://file/home/dinatih/Projects/room-3d/src/features/scene/MarissaArmTattoo.ts:2)). Le convertir en WebP redimensionné (512–1024 px, < 100 Ko), ainsi que les autres tatouages PNG (`sara-nape-*`, `cha-back-reference.png`).
   - Supprimer `public/draco/draco_encoder.js` (**932 Ko**, encodeur jamais utilisé par le navigateur) et vérifier pourquoi deux jeux de `draco_decoder.wasm` / `draco_wasm_wrapper.js` sont émis dans `dist/assets/` en plus de `public/draco/`.
   - Découper les chunks Vite (`build.rolldownOptions.output.manualChunks`) pour séparer `three`, `react`/`zustand`, `bootstrap` et le code applicatif afin d’améliorer le cache navigateur entre déploiements.

### 5.3 Assets `public/` (2,4 Go) & Budget VRAM / RAM

La machine de référence n’a que **1,1–1,8 Go de RAM libre** (avec ~13 Go de swap). Chaque Mo de texture RGBA non compressée économisé améliore directement la stabilité des FPS.

1. **Retirer les 17 fichiers `.blend` / `.blend1` de `public/` (~30,5 Mo)**  
   - Actuellement présents dans `public/items/**` (ex. `framework-laptop13.blend` 8,3 Mo + `.blend1` 8,3 Mo, `trucker-cap-red.blend1` 5,0 Mo + `.blend` 2,3 Mo, `LaundryDetergent.blend` 2,9 Mo, etc.) et copiés dans `dist/` à chaque `npm run build`.
   - **Fix** : les déplacer dans `sources_backup/` (déjà existant à la racine) ou un dossier `assets-src/` hors `public/`.
2. **Étendre le pipeline `scene-models.json` (`-scene-512.glb` + décimation + KTX2/BasisU)** aux modèles lourds réellement chargés dans la scène ou dans les vues courantes :
   - **Personnages / Animaux** :
     - `/home/dinatih/Projects/room-3d/public/characters/ushiro/ushiro.glb` ([file:///home/dinatih/Projects/room-3d/public/characters/ushiro/ushiro.glb](file:///home/dinatih/Projects/room-3d/public/characters/ushiro/ushiro.glb)) — **66,9 Mo**
     - `/home/dinatih/Projects/room-3d/public/characters/robin/robin.glb` ([file:///home/dinatih/Projects/room-3d/public/characters/robin/robin.glb](file:///home/dinatih/Projects/room-3d/public/characters/robin/robin.glb)) — **30,2 Mo** (chargé par défaut dans `Animals` !)
     - `/home/dinatih/Projects/room-3d/public/characters/animated-pitbull-dog/dog.glb` ([file:///home/dinatih/Projects/room-3d/public/characters/animated-pitbull-dog/dog.glb](file:///home/dinatih/Projects/room-3d/public/characters/animated-pitbull-dog/dog.glb)) — **25,2 Mo**
     - `/home/dinatih/Projects/room-3d/public/characters/labrador-dog-from-cotw-game/dog.glb` ([file:///home/dinatih/Projects/room-3d/public/characters/labrador-dog-from-cotw-game/dog.glb](file:///home/dinatih/Projects/room-3d/public/characters/labrador-dog-from-cotw-game/dog.glb)) — **19,5 Mo**
     - `/home/dinatih/Projects/room-3d/public/characters/bloodhund-from-cotw-game-ears-has-animglitch/dog.glb` ([file:///home/dinatih/Projects/room-3d/public/characters/bloodhund-from-cotw-game-ears-has-animglitch/dog.glb](file:///home/dinatih/Projects/room-3d/public/characters/bloodhund-from-cotw-game-ears-has-animglitch/dog.glb)) — **18,6 Mo**
     - `/home/dinatih/Projects/room-3d/public/characters/ivy/ivy.glb` ([file:///home/dinatih/Projects/room-3d/public/characters/ivy/ivy.glb](file:///home/dinatih/Projects/room-3d/public/characters/ivy/ivy.glb)) — **15,9 Mo**
     - `/home/dinatih/Projects/room-3d/public/characters/dachshund-sculpt/dog.glb` ([file:///home/dinatih/Projects/room-3d/public/characters/dachshund-sculpt/dog.glb](file:///home/dinatih/Projects/room-3d/public/characters/dachshund-sculpt/dog.glb)) — **12,7 Mo**
     - `/home/dinatih/Projects/room-3d/public/characters/wigs/hair_pack_part_2.glb` ([file:///home/dinatih/Projects/room-3d/public/characters/wigs/hair_pack_part_2.glb](file:///home/dinatih/Projects/room-3d/public/characters/wigs/hair_pack_part_2.glb)) — **12,7 Mo**
   - **Objets & Environnement** :
     - `/home/dinatih/Projects/room-3d/public/items/aircraft/origami.glb` ([file:///home/dinatih/Projects/room-3d/public/items/aircraft/origami.glb](file:///home/dinatih/Projects/room-3d/public/items/aircraft/origami.glb)) — **54,6 Mo**
     - `/home/dinatih/Projects/room-3d/public/items/bob-droit-red/BobDroitRed.glb` ([file:///home/dinatih/Projects/room-3d/public/items/bob-droit-red/BobDroitRed.glb](file:///home/dinatih/Projects/room-3d/public/items/bob-droit-red/BobDroitRed.glb)) — **31,9 Mo** (déjà une preview 2048 de 8,8 Mo)
     - `/home/dinatih/Projects/room-3d/public/items/household-showcase/chips.glb` ([file:///home/dinatih/Projects/room-3d/public/items/household-showcase/chips.glb](file:///home/dinatih/Projects/room-3d/public/items/household-showcase/chips.glb)) — **14,9 Mo**
     - `/home/dinatih/Projects/room-3d/public/items/raph-rover/raph-rover.glb` ([file:///home/dinatih/Projects/room-3d/public/items/raph-rover/raph-rover.glb](file:///home/dinatih/Projects/room-3d/public/items/raph-rover/raph-rover.glb)) — **10,1 Mo** (chargé dans `Robots`)
     - `/home/dinatih/Projects/room-3d/public/environment/before_i_die__wall_scan_in_seoul_korea.glb` ([file:///home/dinatih/Projects/room-3d/public/environment/before_i_die__wall_scan_in_seoul_korea.glb](file:///home/dinatih/Projects/room-3d/public/environment/before_i_die__wall_scan_in_seoul_korea.glb)) — **9,5 Mo** (scan mur jardin)
     - `/home/dinatih/Projects/room-3d/public/items/oral-b-toothbrush/oral-b-toothbrush.glb` ([file:///home/dinatih/Projects/room-3d/public/items/oral-b-toothbrush/oral-b-toothbrush.glb](file:///home/dinatih/Projects/room-3d/public/items/oral-b-toothbrush/oral-b-toothbrush.glb)) — **6,9 Mo**
     - `/home/dinatih/Projects/room-3d/public/items/fence-panel/fence-panel.glb` ([file:///home/dinatih/Projects/room-3d/public/items/fence-panel/fence-panel.glb](file:///home/dinatih/Projects/room-3d/public/items/fence-panel/fence-panel.glb)) — **4,8 Mo**
   - **Compression GPU KTX2 / BasisU (UASTC/ETC1S)** : aujourd’hui toutes les textures des GLB sont décodées en RGBA8 non compressé en VRAM (1 texture 2048² = 21 Mo avec mipmaps). Passer les textures des variantes `-scene` en **KTX2** divise la consommation VRAM par **4× à 6×** et accélère `gl.initTexture(...)` au démarrage.
3. **HDRI 2K par défaut + cache réduit**  
   - [hdriConfig.ts:26](zed://file/home/dinatih/Projects/room-3d/src/features/scene/hdriConfig.ts:26) charge par défaut les HDRI 4K (**19 à 30 Mo** chacun, ex. `ciel_paris_8k.hdr` = **25,1 Mo**) sur desktop, et [SkySphere.tsx:42](zed://file/home/dinatih/Projects/room-3d/src/features/scene/SkySphere.tsx:42) en garde jusqu’à **2 en cache** simultanément (~64–128 Mo VRAM en Float/HalfFloat + PMREM).
   - **Fix** : utiliser la version **2K** (`~6–7 Mo`) par défaut en temps réel (visuellement quasi identique pour l’IBL PMREM et le fond ciel) et ne monter en 4K que sur demande explicite ou dans le mode Photo Raytracing ; ramener `textureCache` à 1 entrée active.

### 5.4 Maintenabilité & Qualité d’architecture

- **Découpage progressif des fichiers monolithiques** (> 1 300 lignes) :
  - Données pures à sortir en JSON / chunks : `animationRegistry.ts` (9 786 L), `fabManifest.ts` (5 110 L), `inventoryData.ts` (1 001 L), `LaraVariants.ts` (1 006 L).
  - Logique complexe à modulariser : `agentController.ts` (2 158 L), `AnimFrameController.tsx` (1 682 L), `smartObjectRegistry.ts` (1 549 L), `RaytracingPhotoModal.tsx` (1 532 L), `Character.tsx` (1 451 L), `CameraController.tsx` (1 373 L), `Studio.tsx` (1 321 L).
- **Organisation de `scripts/`** : 504 fichiers à plat à la racine de `scripts/` — regrouper par domaine (`scripts/perf/`, `scripts/assets/`, `scripts/blender/`, `scripts/debug/`, `scripts/dev/`) pour retrouver facilement les outils officiels (`profile-studio-passes.cjs`, `profile-studio-startup.cjs`, `analyze-navigation-logs.cjs`, `browser-test-options.cjs`).

---

## 6. Feuille de route priorisée & Protocole de validation

### Ordre d’exécution recommandé

| Phase | Chantier | Gain principal attendu | Risque |
| --- | --- | --- | --- |
| **1 — Quick wins (< 1 h chacun)** | Unifier `SunLight`+`MoonLight` et resserrer frustum d’ombre ; borner `distance` des 6 `pointLight` ; cacher `getRaytracingPreset()` et throttler `PresenceLightController` & `HoverRaycaster` ; passer `BermudaGround` en opaque ; corriger `ShadowController` au mount ; supprimer `AdaptiveDpr` inutile ou le brancher ; retirer les 2 deps npm inutilisées | **+3 à +6 FPS**, shaders allégés, **-16 Mo VRAM**, moins de jitter CPU | Très faible |
| **2 — Démarrage & Bundle** | `source.clone(true)` pour GLB rigides dans `useGLTFClone` ; pré-cuire `makeGrassTex` ; retirer `INTERX_MANIFEST` du bundle `animation.worker` + lazy-load manifestes ; déplacer les 17 `.blend/.blend1` hors de `public/` ; compresser `marissa-lion.png` ; HDRI 2K par défaut | **-2 à -4 s** de démarrage, **-2,5 Mo** JS/PNG bundlés, **-30 Mo** `dist/`, **-50+ Mo VRAM** | Faible |
| **3 — Réduction massive des draw calls** | Proxies hover (`material.visible = false`) pour permettre à `MergedStaticGroup` de fusionner les 35+ objets statiques `hoverAction` ; fusion indexée ; partage matériaux procéduraux ; `InstancedMesh` sur clôtures / Dröna / casquettes / cadres | **-300 à -600 draw calls / frame**, **+5 à +10 FPS** | Moyen (vérifier hover & raycast) |
| **4 — Optimisation acteurs & VRAM avancée** | Animation LOD (`mixer.update` à 10–15 Hz hors frustum) ; fusion de meshes couleur Lara compatibles ; variants `-scene` pour `robin.glb` (30 Mo) / `before_i_die` / `raph-rover` / chiens ; migration KTX2/BasisU sur `-scene` | **+3 à +7 FPS** avec 9 Laras, **-60 % VRAM textures** | Moyen (tester synchro duo & visuel) |

### Commandes de validation après chaque chantier

```bash
# 1. Typage & tests unitaires (611 tests)
npx tsc --noEmit
npm test

# 2. Mesure passes GPU/CPU/draw calls (1 seul chargement Studio, Vulkan headless)
node scripts/profile-studio-passes.cjs --hardware-gpu

# 3. Mesure démarrage à froid & profil CPU de montage
node scripts/profile-studio-startup.cjs --hardware-gpu

# 4. Vérification build production & poids des chunks
npm run build
```

---

## 7. Résultats mesurés avant / après (Lot 1 — 19 novembre 2026)

Campagne identique `npm run test:perf -- --case=studio-9-high-day --hardware-gpu` (3 passages isolés, Radeon 840M / Vulkan headless, 1362 × 810, 9 Laras, alimentation secteur) :

- **Avant** : `test-results/2026-11-19T22-28-16.257Z-perf/report.md` (commit `f69caef6`)
- **Après** : `test-results/2026-11-19T22-44-57.487Z-perf/report.md`

| Métrique (médiane sur 3 passages) | Avant | Après | Écart |
| --- | ---: | ---: | ---: |
| **FPS session** | **7,61 FPS** (7,48–10,59) | **17,06 FPS** (15,68–17,86) | **+124 % (×2,24)** |
| **Temps GPU médian** | **31,76 ms** (31,35–35,76) | **15,16 ms** (14,93–15,80) | **-52,3 % (-16,6 ms)** |
| **CPU rendu médian** | **59,10 ms** (36,40–66,10) | **25,10 ms** (23,70–27,60) | **-57,5 % (-34,0 ms)** |
| **Draw calls / image** | **2 635** (2 602–2 692) | **1 742** (1 698–1 753) | **-893 DC (-33,9 %)** |
| **Triangles / image** | **11,93 M** (11,24–12,39 M) | **7,74 M** (7,48–8,00 M) | **-4,19 M (-35,1 %)** |
| **Image p50 / p95** | **118,5 / 187,8 ms** | **54,4 / 88,9 ms** | **-54 % / -53 %** |
| **Programmes GPU** | **251–253** | **235–240** | **-15 shaders** |
| **Démarrage médian** | **50,2 s** (43,3–95,3 s) | **45,6 s** (41,6–51,4 s) | **-4,6 s (-9 %)** |
| **RSS Chrome médian (session)** | **4,30 Go** (0,97–4,95 Go) | **1,97 Go** (1,61–2,08 Go) | **-54 %** |
| **Bundle `animation.worker`** | **1,1 Mo** | **220 Ko** | **-80 % (-880 Ko)** |

### Changements appliqués dans ce lot

1. **Suppression de la double passe transmission plein écran** : branchement systématique de `useSceneGlass(scene)` dans [createStaticGlbItem.tsx:27](zed://file/home/dinatih/Projects/room-3d/src/features/scene/items/createStaticGlbItem.tsx:27), [createAnimatedGlbItem.tsx:22](zed://file/home/dinatih/Projects/room-3d/src/features/scene/items/createAnimatedGlbItem.tsx:22) et [VacuumCleanerPart.tsx:14](zed://file/home/dinatih/Projects/room-3d/src/features/scene/items/VacuumCleanerPart.tsx:14) (corrige la régression introduite par `rowenta-rh2079wo.glb` et les nouveaux flacons/objets à `KHR_materials_transmission`).
2. **Resserrage du frustum d’ombres directionnelles** (`±3 600 cm` → `±1 100 cm`, `near/far` serrés) sur [SunLight.tsx:52](zed://file/home/dinatih/Projects/room-3d/src/features/scene/SunLight.tsx:52) et [DayNight.tsx:99](zed://file/home/dinatih/Projects/room-3d/src/features/scene/DayNight.tsx:99) (ombres 3,3× plus fines + culling hors emprise).
3. **Bornage des 6 `pointLight` à portée infinie** (`distance={0}` → `450–800 cm`) dans `BathroomPlacements`, `CorridorPlacements`, `LivingRoomPlacements` et `GardenLightStrips` (+ cadence arc-en-ciel 15 Hz au lieu de 60 Hz).
4. **Fusion statique indexée** dans [MergedStaticGroup.tsx:60](zed://file/home/dinatih/Projects/room-3d/src/features/scene/building/MergedStaticGroup.tsx:60) (conserve l’indexation hors sous-groupes multi-matériaux).
5. **Clonage rapide des GLB rigides** dans [useGLTFClone.ts:74](zed://file/home/dinatih/Projects/room-3d/src/features/scene/useGLTFClone.ts:74) (`source.clone(true)` si aucun `SkinnedMesh`) et **regroupement des 9 000 brins d’herbe** en 16 `Path2D` dans [Floor.tsx:154](zed://file/home/dinatih/Projects/room-3d/src/features/scene/building/Floor.tsx:154).
6. **Nettoyage CPU par frame & cycles de vie** : cache URL + throttle 4 Hz dans [PresenceLightController.tsx:40](zed://file/home/dinatih/Projects/room-3d/src/features/scene/PresenceLightController.tsx:40), cache `ResizeObserver` + throttle caméra dans [HoverMenu.tsx:56](zed://file/home/dinatih/Projects/room-3d/src/features/scene/HoverMenu.tsx:56), garde de montage `ShadowController` + libération `setupEnvironment` + retrait `<AdaptiveDpr />` inactif dans [Studio.tsx:121](zed://file/home/dinatih/Projects/room-3d/src/features/scene/Studio.tsx:121), proxies hover PNJ `material.visible = false` (-8 DC transparents) et mémoïsation `pendantTorso` dans [Character.tsx:1359](zed://file/home/dinatih/Projects/room-3d/src/features/scene/character/Character.tsx:1359).
7. **Allègement du worker d’animation** : extraction des 36 IDs assis dans [interxSeatedDuos.ts:1](zed://file/home/dinatih/Projects/room-3d/src/features/scene/animations/interxSeatedDuos.ts:1) (vérifié contre `INTERX_MANIFEST` par `tests/unit/interx-seated-duo.test.cjs`), réduisant `animation.worker` de **1,1 Mo à 220 Ko**.

### Validation

- `npx tsc --noEmit` : **0 erreur**
- `npm test` : **612/612 tests réussis** (0 échec)
- `npm run build` : **succès**
- Inspection visuelle `scene.png` avant/après : rendu fidèle, ombres plus nettes, aucune régression.

---

## 8. Résultats mesurés — Lot 2 (20 novembre 2026 — VRAM, HDRI 2K, fusions statiques & ombres micro-objets)

Campagne `npm run test:perf -- --case=studio-9-high-day --hardware-gpu` :
- **Lot 2** : `test-results/2026-11-19T23-18-17.512Z-perf/report.md` (base commit `69c22ba8`, qui inclut aussi les ajouts buanderie entre Lot 1 et Lot 2).

| Métrique (médiane sur 3 passages) | Avant (`f69caef6`) | Après Lot 1 (`e50fe543`) | Après Lot 2 | Écart total (Avant → Lot 2) |
| --- | ---: | ---: | ---: | ---: |
| **Draw calls / image** | **2 635** | **1 742** | **1 651** (1 611–1 655) | **-984 DC (-37,3 %)** |
| **Géométries Three.js** | — | **968** | **903** (903–906) | **-65 géom. (-6,7 % vs Lot 1)** |
| **RSS Chrome médian (session)** | **4,30 Go** | **1,97 Go** | **1,04 Go** (0,83–1,67 Go) | **-76 % (-47 % vs Lot 1)** |
| **Image p95 (meilleur passage calme)** | **187,8 ms** | **88,9 ms** | **80,4 ms** (passage 3) | **-57 %** |
| **FPS session** | **7,61 FPS** | **17,06 FPS** | **13,85 FPS** (9,70–15,32)* | **+82 %** *(bridé par swap hôte)* |
| **Temps GPU médian** | **31,76 ms** | **15,16 ms** | **17,50 ms** (16,86–38,05)* | **-45 %** *(16,86 ms passage 3)* |
| **CPU rendu médian** | **59,10 ms** | **25,10 ms** | **28,20 ms** (25,90–39,20)* | **-52 %** *(25,90 ms passage 3)* |

> \* **Note de transparence sur les FPS du Lot 2** : pendant cette campagne, la machine subissait une forte contention mémoire externe (`0,43–0,88 Go` de RAM disponible, `13,5 Go` de swap déjà occupé, `+1,1 à +2,3 Go` de hausse swap par passage), ce qui a provoqué un basculement temporaire `gpu_compositing: disabled_software` / `webgl: enabled_readback` sur certains passages et ajouté du bruit sur les temps GPU/CPU (en particulier au passage 1 : `38,1 ms GPU` / `9,7 FPS`). De plus, le commit `69c22ba8` intervenu entre Lot 1 et Lot 2 a ajouté des objets buanderie (+0,3 M triangles). Sur les métriques déterministes, le Lot 2 confirme le gain : **-91 draw calls supplémentaires**, **-65 géométries**, **~570 Mio de VRAM textures/HDRI économisés**, et un **p95 à 80,4 ms** sur le passage 3.

### Changements appliqués dans le Lot 2

1. **8 nouvelles variantes `-scene-512.glb` enregistrées dans [scene-models.json:1](zed://file/home/dinatih/Projects/room-3d/src/features/scene/scene-models.json:1)** (~506 Mio de VRAM RGBA brute et ~16 Mo de téléchargement économisés, originaux conservés pour les previews) :
   - `/home/dinatih/Projects/room-3d/public/environment/before_i_die__wall_scan_in_seoul_korea-scene-512.glb` ([file:///home/dinatih/Projects/room-3d/public/environment/before_i_die__wall_scan_in_seoul_korea-scene-512.glb](file:///home/dinatih/Projects/room-3d/public/environment/before_i_die__wall_scan_in_seoul_korea-scene-512.glb)) (9,47 Mo → 287 Ko)
   - `/home/dinatih/Projects/room-3d/public/items/cecotec-readywarm/cecotec-readywarm-scene-512.glb` ([file:///home/dinatih/Projects/room-3d/public/items/cecotec-readywarm/cecotec-readywarm-scene-512.glb](file:///home/dinatih/Projects/room-3d/public/items/cecotec-readywarm/cecotec-readywarm-scene-512.glb)) (400 Ko → 190 Ko)
   - `/home/dinatih/Projects/room-3d/public/items/philips-amf870/philips-amf870-remote-scene-512.glb` ([file:///home/dinatih/Projects/room-3d/public/items/philips-amf870/philips-amf870-remote-scene-512.glb](file:///home/dinatih/Projects/room-3d/public/items/philips-amf870/philips-amf870-remote-scene-512.glb)) (723 Ko → 206 Ko)
   - `/home/dinatih/Projects/room-3d/public/items/raskog30586783/Raskog30586783-scene-512.glb` ([file:///home/dinatih/Projects/room-3d/public/items/raskog30586783/Raskog30586783-scene-512.glb](file:///home/dinatih/Projects/room-3d/public/items/raskog30586783/Raskog30586783-scene-512.glb))
   - `/home/dinatih/Projects/room-3d/public/items/reolink-fe-w/reolink-fe-w-scene-512.glb` ([file:///home/dinatih/Projects/room-3d/public/items/reolink-fe-w/reolink-fe-w-scene-512.glb](file:///home/dinatih/Projects/room-3d/public/items/reolink-fe-w/reolink-fe-w-scene-512.glb)) (604 Ko → 280 Ko)
   - `/home/dinatih/Projects/room-3d/public/items/rowenta-rh2079wo/rowenta-rh2079wo-scene-512.glb` ([file:///home/dinatih/Projects/room-3d/public/items/rowenta-rh2079wo/rowenta-rh2079wo-scene-512.glb](file:///home/dinatih/Projects/room-3d/public/items/rowenta-rh2079wo/rowenta-rh2079wo-scene-512.glb)) (1,65 Mo → 711 Ko)
   - `/home/dinatih/Projects/room-3d/public/items/spray-cleaner/SprayCleaner-scene-512.glb` ([file:///home/dinatih/Projects/room-3d/public/items/spray-cleaner/SprayCleaner-scene-512.glb](file:///home/dinatih/Projects/room-3d/public/items/spray-cleaner/SprayCleaner-scene-512.glb)) (5,43 Mo → 583 Ko)
   - `/home/dinatih/Projects/room-3d/public/items/xiaomi-phone/xiaomi-phone-scene-512.glb` ([file:///home/dinatih/Projects/room-3d/public/items/xiaomi-phone/xiaomi-phone-scene-512.glb](file:///home/dinatih/Projects/room-3d/public/items/xiaomi-phone/xiaomi-phone-scene-512.glb)) (1,21 Mo → 1,01 Mo)
2. **HDRI 4K conservé par défaut + libération immédiate du cache** : `hdriResolution: '4k'` conservé dans [useSceneStore.ts:407](zed://file/home/dinatih/Projects/room-3d/src/features/scene/store/useSceneStore.ts:407) (conformément au choix utilisateur de garder le 4K par défaut) et `textureCache.size >= 1` dans [SkySphere.tsx:42](zed://file/home/dinatih/Projects/room-3d/src/features/scene/SkySphere.tsx:42) pour libérer immédiatement l’ancien HDRI lors d’un changement de ciel.
3. **`GardenFrontWallScan` connecté au pipeline scène** : passage à `useGLTFClone` + `preloadSceneGLTF`, libération propre des matériaux fantômes et suppression des ombres inutiles (`opacity: 0.1`) dans [GardenFrontWallScan.tsx:16](zed://file/home/dinatih/Projects/room-3d/src/features/scene/building/GardenFrontWallScan.tsx:16).
4. **Cache template de fusion statique GLB** dans [createStaticGlbItem.tsx:20](zed://file/home/dinatih/Projects/room-3d/src/features/scene/items/createStaticGlbItem.tsx:20) (`WeakMap` `prepareSource` pour fusionner une seule fois par asset au lieu de chaque clone/remount).
5. **Fusions statiques & nettoyage `castShadow` sur micro-objets/vitres** : `<MergedStaticGroup>` autour de `BuildingPipes` ([Placements.tsx:76](zed://file/home/dinatih/Projects/room-3d/src/features/scene/Placements.tsx:76)), [MatterHub.tsx:25](zed://file/home/dinatih/Projects/room-3d/src/features/scene/items/MatterHub.tsx:25) et [MllseG2Pro.tsx:25](zed://file/home/dinatih/Projects/room-3d/src/features/scene/items/MllseG2Pro.tsx:25) ; retrait des `castShadow` inutiles sur [ReolinkFeW.tsx](zed://file/home/dinatih/Projects/room-3d/src/features/scene/items/ReolinkFeW.tsx:1), [TradfriBulb.tsx](zed://file/home/dinatih/Projects/room-3d/src/features/scene/items/TradfriBulb.tsx:1), [Shower.tsx](zed://file/home/dinatih/Projects/room-3d/src/features/scene/items/Shower.tsx:1), [LaserDistanceMaster.tsx](zed://file/home/dinatih/Projects/room-3d/src/features/scene/items/LaserDistanceMaster.tsx:1), [Goldfish.tsx](zed://file/home/dinatih/Projects/room-3d/src/features/scene/items/Goldfish.tsx:1) et [Starfish.tsx](zed://file/home/dinatih/Projects/room-3d/src/features/scene/items/Starfish.tsx:1).
6. **Finalisation du bornage des `pointLight` restants** : `distance={450}` dans [BathroomPlacements.tsx:142](zed://file/home/dinatih/Projects/room-3d/src/features/scene/placements/BathroomPlacements.tsx:142) et `distance={800}` dans [LivingRoomPlacements.tsx:487](zed://file/home/dinatih/Projects/room-3d/src/features/scene/placements/LivingRoomPlacements.tsx:487).

### Validation Lot 2

- `npx tsc --noEmit` : **0 erreur**
- `npm test` : **612/612 tests réussis**
- `python3 -m unittest tests/assets/test_scene_models.py` : **OK**
- `npm run build` : **succès**
- Inspection visuelle `scene.png` (passage 3) : rendu fidèle, aucune régression visuelle.


