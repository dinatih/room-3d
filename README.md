# room-3d — Appartement 3D interactif

> **TL;DR** — Visualisation 3D en temps réel de mon appartement, construite depuis zéro (~300 commits). Démarré comme un prototype LEGO en fichier unique, évolué vers ES Modules + Three.js, puis migré vers React Three Fiber. Projet personnel et portfolio technique documenté commit par commit.

→ **[Demo live](https://dinatih.github.io/room-3d/lego-room.html)**

---

## Ce que c'est

Un outil que j'utilise **vraiment au quotidien** : planifier les positions des meubles, visualiser l'éclairage, gérer l'inventaire de mes affaires. Et en même temps, un terrain d'expérimentation technique documenté commit par commit.

---

## Stack technique

| Couche | Technologie | Pourquoi |
|---|---|---|
| Rendu 3D | **React Three Fiber** + Three.js r170 | Composants déclaratifs, state React, interactivité propre |
| Build | **Vite + TypeScript** | TSX, HMR, typage |
| Modèles 3D | **GLB + Draco** | Compression ×3, chargement GLTF standard |
| *(archive)* | ES Modules natifs + importmap | Version vanilla conservée dans `js/` |

---

## Architecture du projet

```
room-3d/
├── src/
│   ├── types.ts              # SceneItemProps (interface commune items/)
│   ├── utils/                # useGLTFClone, glbUtils
│   └── components/scene/
│       ├── Studio.tsx        # Canvas R3F : lights, état global UI
│       ├── structure/        # Murs, sol, portes, cuisine…
│       ├── items/            # ~50 composants autonomes (1 objet = 1 fichier)
│       ├── registry.ts       # id → composant items/ (preview inventaire)
│       └── inventoryData.ts  # ~120 items avec dims, catégorie, scenePos…
└── media/                # Modèles GLB (compressés Draco)
```

---

## Lancement

```bash
npm install && npm run dev   # http://localhost:5173
```

---

## Journal de décisions techniques

Le vrai README. Pas une liste de features : le *pourquoi* de chaque virage.

---

### Phase 1 — Prototype LEGO (février 2026)

**Commit initial** : un seul fichier `lego-room.html` de ~1 700 lignes. L'idée de départ était de représenter l'appartement avec des briques LEGO — chaque brique = un `InstancedMesh`, 1 unité = 1 stud (1,6 cm). Animation brique par brique, couches par matériau.

**Pourquoi LEGO ?** C'est visuellement clair pour planifier un espace — les briques donnent une échelle intuitive, comme du papier quadrillé en 3D.

**Limite vite atteinte** : ajouter une ouverture de porte impliquait de recalculer toute la géométrie brick par brick. Ajouter un mur diagonal (l'appartement en a un) devenait ingérable.

---

### Phase 2 — Refactoring ES Modules (17 → 30+ modules)

```
819f0c3  Refactor: split monolithic lego-room.html into 17 ES modules
```

**Décision** : découper le fichier unique en ES Modules natifs, sans bundler.

**Pourquoi pas Vite/webpack tout de suite ?** Zéro friction. Un `importmap` + un serveur HTTP local suffisent. Les modules se rechargent directement dans le navigateur. Pour un projet solo d'expérimentation, pas de build step = pas de blocage mental.

**Résultat** : `js/structure/`, `js/furniture/`, `js/decor/`, `js/ui/` — chaque module exporte une fonction `buildXxx(scene)`. Convention simple, facile à tenir sur la durée.

---

### Phase 3 — Abandon des briques LEGO (mars 2026)

```
ad83213  Remove LEGO brick system: replace all walls with solid BoxGeometry panels
```

**Pourquoi ?** Après avoir ajouté une niche dans le mur, une porte-fenêtre, un couloir en diagonale — le système de briques était devenu une contrainte. Recalculer quelles briques enlever pour chaque ouverture était une source constante de bugs.

**Remplacement** : panneaux `BoxGeometry` solides via une fonction locale `panel()`. Plus flexibles, plus rapides à rendre. L'esthétique "LEGO" devient des studs décoratifs `InstancedMesh` par-dessus — séparation nette entre géométrie structurelle et apparence.

**Ce que ça m'a appris** : une abstraction qui semble bonne au départ peut devenir un obstacle quand le scope grandit. Mieux vaut la remplacer tôt que de l'accumuler.

---

### Phase 4 — Performance : GLB, Draco, draw calls (mars 2026)

Le projet accumule des objets GLB (meubles IKEA, vêtements, scooter). Deux problèmes émergent :

**Problème 1 — Taille** : les GLBs bruts totalisent ~54 Mo.
```
6a483c9  Draco compress 10 GLBs + shared DRACOLoader (54 MB → 16 MB)
```
Solution : compression Draco via `gltf-pipeline`. Ratio ×3 sur la géométrie.

**Problème 2 — Draw calls** : 500+ calls pour une scène normale.
```
0967a98  Merge GLB sub-meshes by material to reduce draw calls
```
Solution : `mergeGlbByMaterial()` dans `utils/mergeUtils.js` — fusionne toutes les géométries partageant le même matériau. Passe de ~547 à ~200 draw calls.

**Ce que ça m'a appris** : le panel `devtools.js` (FPS + draw calls en temps réel, intégré dans la scène) a été indispensable pour mesurer avant/après. Optimiser sans mesurer = improviser.

---

### Phase 5 — Fonctionnalités UI avancées (mars–avril 2026)

#### Minimap interactive

Canvas 2D superposé, avec suivi du personnage (position + orientation), mode plein écran avec mise à l'échelle dynamique, plan annoté.

La difficulté : toutes les dimensions du canvas (épaisseur des lignes, taille des icônes, polices) doivent scaler quand on passe en plein écran. Solution : facteur `scale = canvas.width / SMALL_W`, appliqué à chaque appel de rendu.

#### Hover menu avec occlusion réelle

```
553baad  Fix hover menu showing through opaque obstacles
```

Le menu contextuel apparaissait sur des objets cachés derrière un mur. Fix : raycast sur *toute* la scène (pas seulement les objets interactifs), s'arrêter au premier hit opaque.

```js
const allHits = raycaster.intersectObjects(scene.children, true);
for (const hit of allHits) {
  if (isTransparent(hit.object.material)) continue;
  if (hit.object.userData.brickType === 'ceiling') continue; // vue du dessus
  const action = resolveAction(hit.object);
  if (action) showMenu(action);
  break; // premier hit opaque = fin du rayon
}
```

#### Centralisation des données (floorData.js)

```
2b48e7f  Factorize floor plan data into floorData.js shared by minimap and floorplan
```

`floorplan.js` et `minimap.js` avaient chacun leurs coordonnées hardcodées pour les mêmes murs. Solution : `ROOMS`, `WALL_LABELS`, `DIMENSIONS` centralisés dans `floorData.js`. Une seule source de vérité, les deux modules importent et itèrent.

#### Z-fighting entre voisins

```
cafe5a6  Add 0.5cm gap between neighbors and main apartment to fix z-fighting
```

Quand deux faces sont exactement coplanaires, le GPU scintille. Solution : décaler les appartements voisins de 0,5 cm. Imperceptible visuellement, élimine le problème.

```js
_groupWest.position.x = -ROOM_W - 30.5;  // était -30
```

---

### Phase 6 — Migration React Three Fiber (avril 2026, terminée)

**Le constat** : la preview 3D de l'inventaire gère manuellement un `WebGLRenderer`, une boucle `requestAnimationFrame`, des contrôles orbitaux maison, des event listeners sur le canvas. C'est ~120 lignes de code impératif pour afficher un objet qui tourne.

**Avec R3F :**

```tsx
// SceneContent.tsx — ce qui remplace les 120 lignes
export function SceneContent({ item, actionState }: Props) {
  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight position={[200, 400, 300]} intensity={1.3} />
      <Controller size={...} />         {/* OrbitControls + camera fit */}
      <GlbModel path={item.glbPath} />  {/* Suspense, centrage, onSize */}
    </>
  );
}
```

**Pourquoi pas R3F dès le début ?**

Deux raisons honnêtes :

1. **Le projet vanilla ES Modules fonctionne sans build step** — pour itérer vite sur la géométrie et les positions, ne pas avoir à lancer `npm run dev` était un vrai confort.

2. **R3F brille sur l'UI réactive** — dès qu'un composant 3D doit synchroniser son état avec un composant HTML (bouton, liste, filtre), React devient naturel. La preview inventaire est exactement ce cas. Et une fois la preview migrée, il était logique de migrer toute la scène.

**La démonstration concrète — le congélateur interactif :**

```tsx
// Freezer.tsx — traduction déclarative de la géométrie procédurale de decor.js
export function Freezer({ actionState, onSize }: SceneItemProps) {
  const isOpen  = actionState['freezer-toggle'] ?? false;
  const doorRef = useRef<THREE.Group>(null!);

  useFrame(() => {
    const target = isOpen ? Math.PI / 2 : 0;
    doorRef.current.rotation.y += (target - doorRef.current.rotation.y) * 0.12;
  });

  return (
    <group>
      {/* carcasse, étagères, pieds… */}
      <group ref={doorRef} position={[FRZ_D/2, 0, -FRZ_W/2]}>
        <mesh position={[0, FRZ_H/2, FRZ_W/2]}>
          <boxGeometry args={[FRZ_T, FRZ_H-2, FRZ_W-FRZ_T]} />
          <meshStandardMaterial color="#1a1a1a" />
        </mesh>
      </group>
    </group>
  );
}
```

| `decor.js` (impératif) | `Freezer.tsx` (déclaratif) |
|---|---|
| `addP(FRZ_T, FRZ_H, FRZ_W, ...)` | `<Panel sx={FRZ_T} sy={FRZ_H} .../>` |
| `freezerDoorGroup.rotation.y = π/2` | `useFrame(() => doorRef.current.rotation.y += lerp...)` |
| `registerHoverAction('freezer-toggle', ...)` | `<button onClick={() => toggle('freezer-toggle')}>` |

**Pattern registry** : chaque objet interactif s'enregistre par `item.id`, sans toucher au reste de la scène :

```ts
// registry.ts — ~50 composants enregistrés
export const SCENE_REGISTRY: Record<string, ComponentType<SceneItemProps>> = {
  'freezer':   Freezer,
  'kallax':    Kallax,
  'sneaker':   Sneakers,
  // …
};
```

**Résultat** : la scène complète est en R3F. La version vanilla (`js/`) est conservée comme archive.

---

## Fonctionnalités actuelles

| Feature | Détail |
|---|---|
| Navigation | Walk mode WASD, vue 2D dessus, perspective, POV, WebXR VR |
| Structure | Murs, niche, couloir diagonal, cuisine, SDB, WC |
| Meubles | ~50 items/ components (procéduraux + GLB IKEA) |
| Interactivité | Hover menu, toggles portes/tiroirs/lit, murs rouges, X-Ray |
| Inventaire | ~120 items, preview 3D interactive (registry), filtres, recherche |
| Minimap | Canvas 2D temps réel, plein écran, suivi personnage |
| Floorplan | Plan 2D coté |
| Couches visuelles | Structure / GLB / Mobilier + toggles X-Ray, murs rouges, grille |
| Voisins | Appartements est/ouest semi-transparents |
| Dev Tools | FPS graph, draw calls, stats mémoire, tailles GLB |
| Personnage | Walking man animé (Lara 2026) + SkeletonHelper toggle |

---

## Ce qui vient

- [ ] Éclairage dynamique (heure du jour)
- [ ] Plan 2D interactif (cliquer un meuble → zoom scène)

---

## Contexte personnel

Ce projet a démarré parce que j'emménageais dans un nouvel appartement et que je voulais visualiser les configurations de meubles avant d'acheter. Les outils existants (IKEA Kreativ, Planner 5D) ne modélisent pas les contraintes spécifiques de mon appartement — la niche asymétrique, le mur diagonal, la cuisine en galley.

Construire le mien était plus rapide que de contourner les limitations des outils existants. Et ça m'a donné une bonne raison de creuser Three.js sérieusement.

**Statut** : en recherche d'emploi. Si vous êtes arrivé jusqu'ici et que ce genre d'approche vous parle, je suis disponible.

→ [linkedin.com/in/david-herelle](https://linkedin.com/in/david-herelle)

---

*~250 commits · 7 semaines · Three.js vanilla → React Three Fiber*

---
---

# README — version précédente (17 février 2026)

> *Conservé pour montrer l'évolution du projet et de sa documentation.*

---

# Studio de rêve — modélisation 3D LEGO

Ce projet est la modélisation en 3D de **mon studio actuel** — mon studio de rêve.

Tout a commencé parce que je voulais recréer mon appartement en LEGO. Le site
[mecabricks.com](https://www.mecabricks.com) n'était pas adapté à ce que je
voulais faire, alors j'ai ouvert un éditeur de texte et Three.js.

Mais au fil des jours, j'ai réalisé que c'était bien plus que ça. Après **+15 ans**
depuis mes débuts avec Three.js — à une époque où j'étais passionné par Flash/AS3
(paix à son âme 🕯️) en début de carrière — le web 3D avait énormément évolué.
J'avais toujours rêvé de modéliser mon studio de rêve. Je l'avais fait en SketchUp,
mais le logiciel est devenu payant pour qui veut programmer la construction en Ruby.
Blender a toujours été trop complexe pour moi.

Aujourd'hui avec Three.js, je peux enfin réaliser ce rêve — **sans dépendre d'une
technologie qui risque de disparaître** (Flash, SketchUp…). Open source, dans le
navigateur, des modules ES natifs, aucun bundler.

Le projet a démarré une semaine avant le premier commit (17 fév. 2026). En moins
d'un mois, les progrès sont énormes.

---

## Lancement

```bash
python3 -m http.server 8000
```

---

## Optimisations de performance

### 1. Compression Draco des GLBs

**Outil :** `@gltf-transform/cli`

```bash
npm install -g @gltf-transform/cli
npx @gltf-transform/cli draco input.glb output.glb
```

**Résultats (54 MB → 16 MB) :**

| Fichier | Avant | Après | Gain |
|---|---|---|---|
| man_black_business_suit | 24.0 MB | 3.9 MB | −84% |
| potted_palm | 5.0 MB | 2.9 MB | −42% |
| sunnersta_trolley_ikea | 3.4 MB | 0.3 MB | −91% |
| baseball_cap | 7.3 MB | 3.9 MB | −47% |
| ikea_lamp_ola | 1.6 MB | 0.09 MB | −94% |
| mackapar_ikea | 0.5 MB | 0.06 MB | −87% |
| xiaomi_electric_scooter_4 | 1.2 MB | 0.14 MB | −88% |
| red_backpack | 0.2 MB | 0.04 MB | −84% |
| ikea_DRONA_black | 0.02 MB | 0.008 MB | −61% |
| ikea_Altappen | 4.6 MB | 4.1 MB | −11% |

> **Note :** `smorkull.glb`, `folding-chair-generic.glb` et `viggja.glb` conservés
> non-compressés — la quantification Draco modifie leur bounding box et casse
> le calcul de scale dynamique (`rawSize.y`, `rawSize.z`).

**Chargeur partagé** (`js/loaders.js`) — un seul `GLTFLoader` + `DRACOLoader`
pour tous les modules :

```js
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

const draco = new DRACOLoader();
draco.setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/libs/draco/gltf/');
draco.preload();
export const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(draco);
```

---

### 2. Simplification de la géométrie GLB

**Outil :** `simplify` + `draco` en pipeline

```bash
npx @gltf-transform/cli simplify --ratio 0.05 --error 0.001 input.glb /tmp/simp.glb
npx @gltf-transform/cli draco /tmp/simp.glb output.glb
```

Appliqué aux modèles dont la couleur est overridée en rouge plat
(qualité de texture non critique) :

| Fichier | Ratio | Avant | Après | Triangles |
|---|---|---|---|---|
| man_black_business_suit | 0.05 | 4.0 MB | 3.0 MB | −95% |
| baseball_cap | 0.05 | 4.1 MB | 3.9 MB | −95% |
| ikea_lamp_ola | 0.30 | 0.16 MB | 0.09 MB | −70% |
| xiaomi_electric_scooter_4 | 0.30 | 0.17 MB | 0.14 MB | −70% |
| potted_palm | 0.30 | 2.95 MB | 2.89 MB | −70% |

> **Attention :** ne pas appliquer `weld` avant `simplify` sur des GLBs déjà
> Draco — le décodage + recompression gonfle les fichiers (ex. suit : 4 MB → 20 MB
> après weld avant de re-encoder en Draco). Faire `simplify` directement sur
> le fichier Draco, puis `draco` pour recompresser.

> `smorkull.glb` résiste à la simplification (coutures UV complexes —
> gain négligeable même avec ratio=0.2).

---

### 3. Fusion des sous-meshes GLB par matériau (`mergeGlbByMaterial`)

**Problème :** les GLBs exportés depuis SketchUp/Blender/CAD créent des centaines
de primitives séparées → draw calls × N par modèle.

**Solution** (`js/mergeUtils.js`) : après le chargement, fusionner toutes les
primitives qui partagent le même matériau en un seul `Mesh` par matériau.

**Résultat :** draw calls 2 253 → 238 (×9), fluidité mobile incluse.

```js
import { mergeGlbByMaterial } from './mergeUtils.js';

gltfLoader.load('media/model.glb', (gltf) => {
  const root = gltf.scene;

  // 1. Appliquer les overrides de matériau AVANT la fusion
  root.traverse(c => { if (c.isMesh) c.material = myMat; });

  // 2. Positionner/scaler le root AVANT la fusion
  root.scale.setScalar(myScale);
  root.position.set(x, y, z);

  // 3. Fusionner
  mergeGlbByMaterial(root);

  scene.add(root);
});
```

**Comportement interne :**
- Traverse le GLB, clone chaque géométrie en espace local du root
- Groupe par `material.uuid`
- Normalise les attributs (supprime `tangent` etc. si absent d'une géométrie)
  pour éviter les erreurs `mergeGeometries()`
- **Supprime et dispose** les meshes originaux (libère la mémoire GPU)
- Supprime aussi les `Line` (arêtes CAD embarquées dans certains GLBs)
- Ajoute un `Mesh` fusionné par groupe de matériau en enfant du root

**Compatible avec le clonage** (`root.clone(true)`) — les clones héritent du
mesh fusionné. Utilisé par `drona.js` et `casquettes.js`.

**Appliquer le merge APRÈS** les overrides de matériau pour maximiser la fusion
(ex. : si tous les meshes ont `redMat`, résultat = 1 seul mesh au lieu de N).

---

## Dev Tools (panneau UI)

Le panneau **🛠 Dev Tools** dans le side-panel affiche en temps réel :

- **Graph FPS** (80 échantillons, seuils 30/60 FPS)
- **Stats rendu** : draw calls, triangles, géométries, textures GPU
  (seuils colorés : orange ≥ 200 draw calls, rouge ≥ 500)
- **Stats scène** : mesh count, instanced, lights, vertices, tris
  (géométries visibles uniquement — les originaux supprimés ne sont pas comptés)
- **Tailles GLB** : requêtes HEAD sur tous les `media/*.glb`, triées par taille

Bouton **↺ Refresh** pour recalculer les stats scène après chargement des GLBs.
