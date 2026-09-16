# Analyse complète du projet — room-3d

> **Auteur** : Antigravity Agent (CLI) — modèle **Claude Opus 4.6 (Thinking)** par Anthropic  
> **Date** : 2026-09-16 à 21:33 (Europe/Paris)  
> **Conversation** : `be14dc4c-fcdc-427c-a3ae-4b047a0cf239`

---

## 1. Vue d'ensemble

**room-3d** est une application web 3D interactive qui modélise un appartement réel (celui de David HERELLE, à Paris 13ème) à l'échelle 1 unité = 1 cm, avec un inventaire complet du mobilier (principalement IKEA), des personnages animés, un système d'IA comportementale, et de multiples modes de visualisation.

Le projet sert de **portfolio technique / CV interactif** : l'écran de chargement affiche le profil professionnel de l'auteur, et l'application elle-même démontre la maîtrise de React, Three.js, R3F, et du pilotage d'agents IA.

---

## 2. Stack technique

| Couche | Technologie | Version |
|--------|-------------|---------|
| **Framework UI** | React | 18.x |
| **Moteur 3D** | Three.js | 0.185.1 |
| **Binding React/3D** | @react-three/fiber (R3F) | 8.18.0 |
| **Helpers 3D** | @react-three/drei | 9.122.0 |
| **Post-processing** | @react-three/postprocessing | 2.19.1 |
| **Path tracing** | three-gpu-pathtracer | 0.0.24 |
| **Tiles 3D** | 3d-tiles-renderer | 0.4.24 |
| **État global** | Zustand | 5.0.13 |
| **CSS** | Bootstrap 5.3 + Bootstrap Icons + custom CSS |
| **Bundler** | Vite 5 |
| **Langage** | TypeScript 5.9.3 (mode strict) |
| **Perf monitoring** | r3f-perf | 7.2.3 |

### Build & Dev

```bash
npm run dev          # Vite dev server → http://localhost:5173
npm run build        # Production build (Rollup via Vite)
npx tsc --noEmit     # Type checking
```

---

## 3. Statistiques du code source (`src/`)

| Métrique | Valeur |
|----------|--------|
| **Fichiers TypeScript/TSX** | **301** |
| **Lignes de code totales** | **~53 639** |
| **Répertoires dans src/** | 23 |
| **Composants items (meubles)** | ~130 fichiers dans `items/` |

---

## 4. Architecture des dossiers

```
src/
├── main.tsx                          # Point d'entrée — createRoot + Draco decoder
├── index.css                         # Styles globaux (12 Ko)
├── types.ts                          # Interfaces partagées (Item, Dims, SceneItemProps, Category)
├── vite-env.d.ts                     # Déclarations Vite
│
├── features/
│   ├── inventory/                    # Système d'inventaire / catalogue
│   │   ├── Inventory.tsx             # Modal inventaire (lazy-loaded)
│   │   ├── inventoryData.ts          # Données du catalogue
│   │   ├── InventoryPreview.tsx      # Prévisualisation 3D des items
│   │   ├── SpatialZonePreview.tsx    # Prévisualisation des zones spatiales
│   │   ├── AnimFrameController.tsx   # Contrôle des frames d'animation
│   │   ├── previewRegistry.tsx       # Registre des previews
│   │   └── useAnimPreviewStore.ts    # Store Zustand pour les previews d'animation
│   │
│   ├── scene/                        # Cœur de la scène 3D
│   │   ├── Studio.tsx                # RACINE R3F — Canvas, lumières, fog, env map (623 lignes)
│   │   ├── config.ts                 # Constantes (@config) : ROOM_W, ROOM_D, WALL_H, layers, mur diagonal
│   │   ├── Building.tsx              # Structure du bâtiment (murs, sol, miroirs)
│   │   ├── Placements.tsx            # Placement des meubles dans la scène
│   │   ├── CameraController.tsx      # Contrôleur caméra unifié
│   │   ├── Walker.tsx                # Personnages 3D animés
│   │   ├── SidePanel.tsx             # Panneau de contrôle UI
│   │   ├── Minimap.tsx               # Mini-carte
│   │   ├── FloorPlan.tsx             # Vue plan 2D
│   │   ├── SunLight.tsx              # Éclairage solaire réaliste
│   │   ├── SkySphere.tsx             # Sphère de ciel
│   │   ├── PaperPlane.tsx            # Mode avion en papier
│   │   ├── VRMode.tsx                # Mode réalité virtuelle (WebXR)
│   │   ├── ImmersiveMode.tsx         # Mode immersif gyroscope
│   │   ├── LidarScan.tsx             # Visualisation scan LiDAR
│   │   ├── GlbReveal.tsx             # Animation de révélation GLB
│   │   ├── MeasurementTool.tsx        # Outil de mesure
│   │   ├── HoverMenu.tsx             # Menu au survol
│   │   ├── VirtualDPad.tsx           # D-Pad tactile mobile
│   │   ├── ... (50+ composants de scène)
│   │   │
│   │   ├── ai/                       # Intelligence artificielle comportementale
│   │   │   ├── agent/                # Logique d'agents autonomes
│   │   │   │   ├── agentAvoidance.ts     # Évitement de collision inter-agents
│   │   │   │   ├── agentDuoHandler.ts    # Gestion d'animations duo
│   │   │   │   ├── agentInstructionCoords.ts # Coordonnées d'instructions
│   │   │   │   ├── agentTypes.ts         # Types d'agents
│   │   │   │   └── agentWalkAnimations.ts # Animations de marche
│   │   │   ├── SpatialZone.ts            # Zones spatiales
│   │   │   ├── ZoneNodes.ts              # Noeuds de navigation
│   │   │   ├── navigationGraph.ts        # Graphe de navigation
│   │   │   ├── occupancyManager.ts       # Gestion d'occupation des zones
│   │   │   ├── furnitureObstacles.ts     # Obstacles meubles
│   │   │   ├── smartObjectRegistry.ts    # Registre d'objets interactifs
│   │   │   ├── scenarios.ts              # Scénarios comportementaux
│   │   │   ├── duoAnimations.ts          # Animations en duo
│   │   │   ├── duoSessionManager.ts      # Gestionnaire de sessions duo
│   │   │   ├── animationPacks.ts         # Packs d'animations
│   │   │   ├── useAgentController.ts     # Hook de contrôle d'agents
│   │   │   ├── AiZonesHelper.tsx         # Visualisation debug des zones IA
│   │   │   └── CollisionDebugHelper.tsx  # Visualisation debug des collisions
│   │   │
│   │   ├── animations/               # Système d'animation
│   │   │   ├── animationRegistry.ts  # Registre global des animations
│   │   │   └── animationResolver.ts  # Résolution des animations
│   │   │
│   │   ├── building/                 # Sous-composants du bâtiment
│   │   │   ├── Walls.tsx             # Murs
│   │   │   ├── Floor.tsx             # Sol
│   │   │   ├── Mirrors.tsx           # Miroirs
│   │   │   ├── DoorsPlaced.tsx       # Portes
│   │   │   ├── BermudaGround.tsx     # Herbe du jardin
│   │   │   ├── GardenFrontWallScan.tsx # Scan mur jardin
│   │   │   └── MergedStaticGroup.tsx # Optimisation géométrie statique
│   │   │
│   │   ├── camera/                   # Système caméra
│   │   │   ├── cameraConstants.ts    # Constantes caméra
│   │   │   ├── types.ts             # Types caméra
│   │   │   ├── useCameraFrameUpdate.ts   # Update par frame
│   │   │   ├── useCameraPointerEvents.ts # Événements pointer
│   │   │   └── useCameraShortcuts.ts     # Raccourcis clavier
│   │   │
│   │   ├── character/                # Système de personnage
│   │   │   ├── SingleCharacter.tsx       # Composant personnage
│   │   │   ├── CharacterBaseballCap.tsx  # Accessoire casquette
│   │   │   ├── HeartParachute.tsx        # Parachute coeur
│   │   │   ├── GroundPoint.tsx           # Point au sol
│   │   │   ├── characterLayers.ts        # Layers du personnage
│   │   │   ├── characterTypes.ts         # Types
│   │   │   ├── useCharacterAnimations.ts # Hook animations
│   │   │   └── useCharacterPhysics.ts    # Hook physique (seins, cheveux)
│   │   │
│   │   ├── items/                    # ~130 composants de meubles/objets
│   │   │   ├── Kallax*.tsx           # Étagères IKEA Kallax (8 variantes)
│   │   │   ├── Fornuft*.tsx          # Ustensiles IKEA Fornuft (4 variantes)
│   │   │   ├── Samla*.tsx            # Boîtes IKEA Samla (5 variantes)
│   │   │   ├── Trixig*.tsx           # IKEA Trixig (3 variantes)
│   │   │   ├── Toilet.tsx, Shower.tsx, Bathtub.tsx  # Sanitaires
│   │   │   ├── TV.tsx, Laptop.tsx, Phone.tsx        # Électronique
│   │   │   ├── ShibaInu.tsx, RobinBird.tsx          # Animaux
│   │   │   ├── FemaleAnatomy*.tsx                   # Modèles anatomiques
│   │   │   ├── ... (100+ items IKEA avec codes articles)
│   │   │   └── (chaque item = composant React autonome chargeant un GLB)
│   │   │
│   │   ├── placements/              # Organisation spatiale par pièce
│   │   │   ├── LivingRoomPlacements.tsx   # Séjour
│   │   │   ├── KitchenPlacements.tsx      # Cuisine
│   │   │   ├── BathroomPlacements.tsx     # Salle de bain
│   │   │   ├── CorridorPlacements.tsx     # Couloir
│   │   │   └── GardenPlacements.tsx       # Jardin / extérieur
│   │   │
│   │   ├── photo/                    # Mode photo avec ray tracing
│   │   │   └── RaytracingPhotoModal.tsx
│   │   │
│   │   ├── retargeting/             # Retargeting d'animations
│   │   │   ├── boneMappings.ts      # Mappings de bones
│   │   │   ├── boneResolver.ts      # Résolution de bones
│   │   │   ├── retargetClip.ts      # Retargeting de clips
│   │   │   └── hairChain.ts         # Chaîne de cheveux
│   │   │
│   │   ├── sidepanel/               # Panneau latéral UI
│   │   │   ├── sections/            # Sections du panneau
│   │   │   │   ├── LayersSection.tsx
│   │   │   │   ├── ViewsSection.tsx
│   │   │   │   ├── CharacterSection.tsx
│   │   │   │   ├── AnimationsSection.tsx
│   │   │   │   ├── DuoAnimationsSection.tsx
│   │   │   │   ├── InteractiveSection.tsx
│   │   │   │   └── ProfileSection.tsx
│   │   │   └── modals/              # Modales
│   │   │       ├── CvModal.tsx
│   │   │       ├── ShortcutsModal.tsx
│   │   │       └── ViewsModal.tsx
│   │   │
│   │   ├── store/                   # State management
│   │   │   └── useSceneStore.ts     # Store Zustand principal (481 lignes)
│   │   │
│   │   └── utils/                   # Utilitaires
│   │       ├── GlobalSkeletonHelpers.tsx
│   │       ├── PositionTransition.tsx
│   │       └── useFurnitureToggles.ts
│   │
│   └── ui/                          # Composants UI génériques
│       └── AppConsole.tsx           # Console de l'application
│
├── hooks/
│   └── useIsMobile.ts               # Détection mobile
│
├── scripts/                         # Scripts utilitaires TS
│
└── types/
    └── three-gpu-pathtracer.d.ts    # Déclarations types path tracer
```

---

## 5. Dimensions 3D et repères

Définis dans `src/features/scene/config.ts` :

| Constante | Valeur | Description |
|-----------|--------|-------------|
| `ROOM_W` | 316 cm | Largeur du séjour (axe X) |
| `ROOM_D` | 400 cm | Profondeur du séjour (axe Z) |
| `WALL_H` | 250 cm | Hauteur sous plafond (axe Y) |
| `DOOR_H` | 204 cm | Hauteur standard porte française |
| `KITCHEN_DEPTH` | 60 cm | Profondeur du renfoncement cuisine |
| `DIAG_ANGLE_DEG` | 120° | Angle du mur diagonal du bâtiment |

Les mesures réelles (télémètre laser) sont documentées dans le fichier config avec des constantes `MEASURED_DIST_*`.

Un objet `DiagWall` centralise toute la trigonométrie du mur diagonal avec une méthode `p(d, off)` pour calculer des points le long de ce mur.

---

## 6. Gestion de l'état (Zustand)

### Store principal : `useSceneStore`

Le store unique gère 3 catégories d'état :

#### 6.1 `furniture` — État du mobilier interactif
Portes ouvertes/fermées, lampes allumées/éteintes, TV, frigo, congélateur, volets, modes de rangement Drona...

#### 6.2 `layers` — Visibilité des couches de la scène
Structure, équipement, mobilier, voisins, LiDAR, miroirs, grille, mode plan, wireframe, X-ray, personnages, zones IA, ombres, herbe, physique des cheveux/seins, etc.

Le nombre de NPC est configurable via URL (`?npc=15`, `?npc=solo`, etc.) et persiste dans l'URL via `replaceState`.

#### 6.3 `extraStates` — Actions ponctuelles et scénarios IA
Actions comme `aiGoToilet`, `aiSitDesk1`, `aiBathtub`, `aiFullTour`...

### Communication inter-composants
Les actions UI sont propagées via `CustomEvent('furniture-toggle')` pour découpler les composants 3D du store React.

### Store secondaire : `useAnimPreviewStore`
Dédié à la prévisualisation des animations dans l'inventaire.

---

## 7. Système de layers Three.js

Couches Three.js définies dans `config.ts` :

| Layer | ID | Usage |
|-------|----|-------|
| `LAYER_STRUCTURE` | 0 | Murs, sol, plafond (défaut Three.js) |
| `LAYER_EQUIPMENT` | 11 | Sanitaires, cuisine |
| `LAYER_FURNITURE` | 12 | Meubles |
| `LAYER_NETWORKS` | 13 | Tuyauterie, électricité |
| `LAYER_NEIGHBORS` | 14 | Appartements voisins |
| `LAYER_LIDAR` | 15 | Scan LiDAR |
| `LAYER_WALKER_DETAIL` | 16 | Meshes masqués en FPS mais visibles dans miroirs |
| `LAYER_MIRRORS` | 17 | Plans de réflexion (coûteux) |
| `LAYER_WALKER` | 18 | Personnages 3D |
| `LAYER_AI_ZONES` | 19 | Zones IA debug |
| `LAYER_ANIMALS` | 20 | Animaux autonomes |

---

## 8. Composant racine : Studio.tsx

`Studio.tsx` (623 lignes) est le composant racine qui orchestre :

1. **Canvas R3F** — Frameloop `demand` (rendu à la demande), DPR adaptatif, shadows PCFSoft, tone mapping ACES
2. **Environnement PMREM** — Env map généré procéduralement (sol + mur + lumières) sans HDRI
3. **Éclairage** — Ambient light + DirectionalLight (ou SunLight réaliste)
4. **Layers 3D** — `CategoryLayerGroup` pour chaque couche
5. **Modes spéciaux** — VR (WebXR), Immersif (gyroscope), Avion en papier, LiDAR, Plan 2D
6. **Optimisation** — `FrameloopController` (pause quand idle/inventaire ouvert), `ShadowWarmup`, `AdaptiveDpr`, `PerformanceMonitor`
7. **Lazy loading** — `Inventory` et `RaytracingPhotoModal` chargés à la demande
8. **Overlays HTML** — SidePanel, Minimap, HoverOverlay, VirtualDPad, AppConsole

### Raccourcis clavier
| Touche | Action |
|--------|--------|
| `F` | Mode avion en papier |
| `G` | Grille de personnages |
| `I` | Inventaire |
| `P` | Inventaire > walkers |
| `A` | Zones IA |
| `K` | Squelettes |
| `W` | Arêtes des murs |
| `N` | Dimensions mesurées |
| `X` | Mode nu |
| `Z` / `C` | Toggle haut/bas vêtements |
| `5` | HDRI aléatoire |
| `6` | Bulle de pensée |
| `7` | Pistolets Lara |
| `8` | Accessoires |
| `0` | Cacher/afficher UI |
| `F10` | Mode photo (ray tracing) |

---

## 9. Système IA comportemental

Le dossier `ai/` implémente un système complet d'agents autonomes :

- **Zones spatiales** (`SpatialZone.ts`, `ZoneNodes.ts`) — Découpage de l'appartement en zones navigables
- **Graphe de navigation** (`navigationGraph.ts`) — Pathfinding entre zones
- **Gestion d'occupation** (`occupancyManager.ts`) — Éviter que plusieurs agents occupent le même espace
- **Évitement de collision** (`agentAvoidance.ts`) — Steering inter-agents
- **Scénarios** (`scenarios.ts`) — Comportements prédéfinis (aller aux toilettes, s'asseoir au bureau, prendre une douche, etc.)
- **Animations duo** (`duoAnimations.ts`, `duoSessionManager.ts`) — Synchronisation de deux personnages
- **Smart Objects** (`smartObjectRegistry.ts`) — Meubles interactifs avec points d'interaction
- **Obstacles** (`furnitureObstacles.ts`) — Détection et contournement du mobilier

---

## 10. Système de personnages

- **Walker.tsx** — Composant principal gérant 1 à 15 personnages simultanés
- **SingleCharacter.tsx** — Composant individuel par personnage
- **Physique** — Simulation physique des cheveux (`hairChain.ts`) et des seins (`useCharacterPhysics.ts`) avec paramètres réglables (masse, fermeté, élasticité, gravité, vent)
- **Retargeting** — Système de retargeting d'animations entre différents squelettes (`retargetClip.ts`, `boneMappings.ts`)
- **Variantes** — Plusieurs modèles de personnages avec styles différents (`LaraVariants.ts`, `walkerConfig.ts`)
- **Accessoires** — Casquette, perruque, pistolets, sac à dos, etc.

---

## 11. Modes de visualisation

| Mode | Description |
|------|-------------|
| **Orbit** | Caméra orbitale classique |
| **Walk / FPV** | Vue première personne avec déplacement |
| **Top** | Vue de dessus avec outil de mesure |
| **Plan** | Plan 2D architectural (`FloorPlan.tsx`) |
| **VR** | Réalité virtuelle WebXR |
| **Immersif** | Gyroscope mobile |
| **Avion** | Pilotage d'un avion en papier dans la scène |
| **X-Ray** | Mode rayons X |
| **Wireframe** | Mode fil de fer |
| **LiDAR** | Nuage de points laser (4 modes, opacité réglable) |
| **Photo** | Ray tracing haute qualité (`three-gpu-pathtracer`) |

---

## 12. Inventaire / Catalogue

- **~130 items** modélisés individuellement en GLB
- Chaque item est un composant React autonome dans `items/`
- Nomenclature IKEA respectée (ex : `Kallax20275814.tsx`, `Brogrund30328534.tsx`)
- Objets non-IKEA aussi présents (TV, Laptop, Phone, Scooter, animaux, anatomie, etc.)
- Placement organisé par pièce dans `placements/` (5 fichiers)
- Prévisualisation 3D dans le modal inventaire

---

## 13. Configuration Vite

- **Plugin React** (SWC / Babel)
- **Aliases de chemin** : `@/`, `@features/`, `@shared/`, `@config`
- **Port** : 5173
- **Auto-copy** : Copie d'images générées par IA au démarrage du serveur
- **Build** : Entrée unique `index.html`

---

## 14. Configuration TypeScript

- **Target** : ES2020
- **Mode strict** activé (`strict`, `noUnusedLocals`, `noUnusedParameters`)
- **JSX** : react-jsx (transformation automatique)
- **Module** : ESNext avec résolution `bundler`
- **Paths** : Même aliases que Vite

---

## 15. Points forts du projet

1. **Échelle et précision** — Modélisation à l'échelle réelle (1 unité = 1 cm) avec mesures laser documentées
2. **Richesse fonctionnelle** — ~130 meubles, 15 personnages, IA comportementale, physique, VR, ray tracing
3. **Performance** — Frameloop à la demande, DPR adaptatif, lazy loading, gestion d'idle, PerformanceMonitor
4. **Architecture modulaire** — Feature-based structure, composants autonomes, store centralisé
5. **Interactivité** — 20+ raccourcis clavier, panneau de contrôle complet, 10+ modes de visualisation

---

## 16. Points d'attention / améliorations possibles

1. **Taille du code** — 53 639 lignes et 301 fichiers dans `src/` ; certains composants `items/` pourraient être générés automatiquement s'ils suivent un pattern commun
2. **Store monolithique** — `useSceneStore.ts` (481 lignes) concentre beaucoup de logique ; un découpage en slices Zustand pourrait améliorer la lisibilité
3. **Événements CustomEvent** — Le pattern `furniture-toggle` crée un pont implicite entre React et le DOM ; à terme, le store Zustand pourrait gérer ces flux directement
4. **Vite config** — Le bloc d'auto-copie d'images utilise un chemin absolu codé en dur vers un répertoire Antigravity ; à externaliser
5. **Pas de tests** — Aucun fichier de test unitaire ou d'intégration détecté dans `src/`
6. **Types** — Le mode strict est activé, ce qui est positif ; quelques `any` subsistent dans le store

---

*Document généré automatiquement par Antigravity Agent (CLI).*
