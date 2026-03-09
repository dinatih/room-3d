# Appartement LEGO 3D

Visualisation 3D d'un appartement en briques LEGO avec Three.js.
ES Modules natifs, pas de bundler. Serveur HTTP local requis (CORS).

```bash
ruby server.rb        # http://localhost:8080 / https://localhost:8443
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
