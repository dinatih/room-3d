# Architecture 3D & Directives Modèles Personnages (Lara)

Ce document répertorie la structure géométrique exacte, les mappages de matériaux et les pièges récurrents identifiés lors de l'évolution des fichiers sources 3D (`lara_native.glb`, `lara_perfect.blend`, `lara_mix_nude.blend`).

---

## 1. Composition des Meshes du Modèle

Le modèle universel de Lara contient deux modes exclusifs :

### A. Mode Habillé (`laraNude = false`)
- **`body`** : Contient la peau visible (cou, décolleté, ventre, cuisses et jambes jusqu'à Z = 0.255). Le bas des jambes pénètre de 7 cm à l'intérieur des bottes pour éviter tout trou au-dessus des chaussettes.
- **`shirt`** : Débardeur par-dessus le torse.
- **`shorts`** : Short en jean par-dessus le bassin.
- **`arms`** & **`face`** : Bras et tête.
- **`boots`** : Bottes avec chaussettes blanches montantes (sommet à Z = 0.324).
- **`gloves`** / **`fingers`** : Gants et doigts.
- **`gear`**, **`buckle`**, **`backpack`**, **`glasses`**, **`handgun_*`** : Accessoires et holsters.

### B. Mode Déshabillé (`laraNude = true`)
- **`body_nude_torso`** : Torse nu sans débardeur.
- **`body_nude_legs`** : Cuisses et jambes nues arrêtées précisément à Z = 0.300.
- **`panties`** : Sous-vêtements.
- **`feet`** : Pieds nus et chevilles montant exactement jusqu'à Z = 0.300 (jonction bord-à-bord parfaite avec `body_nude_legs`).
- **`hands`** : Mains nues sans gants.

---

## 2. Règles de Visibilité React (`SingleCharacter.tsx`)

| Mesh | Condition de visibilité (`visible`) | Règle / Justification |
| :--- | :--- | :--- |
| **`boots`** | `!laraNude && laraShoes` | Affichées uniquement en mode habillé avec chaussures actives. |
| **`feet`** | `laraNude && !laraShoes` | Affichés uniquement en mode déshabillé quand les chaussures sont retirées. En mode habillé, `body` descend dans les bottes ; activer `feet` en habillé créerait une superposition au niveau des chaussettes. |
| **`gloves` / `fingers`** | `!laraNude && laraGloves` | Gants affichés en habillé. |
| **`hands`** | `laraNude || !laraGloves` | Mains nues affichées en déshabillé ou en habillé sans gants. |
| **`body_nude_*` / `panties`** | `laraNude` | Masqués à 100% en mode habillé pour éliminer tout Z-fighting. |
| **`body` / `shirt` / `shorts`** | `!laraNude` | Masqués à 100% en mode déshabillé. |

---

## 3. Pièges Récurrents & Erreurs à Éviter

### ⚠️ 1. Corruption des Textures Personnalisées au Re-render (Sur-filtrage Canvas)
- **Symptôme** : Cliquer sur "Déshabiller" ou "Chaussures" transforme les dégradés et textures de vêtements en aplats de couleur pleine (jaune uni, rouge uni, blanc uni).
- **Cause** : `applyLaraVariantStyles` qui s'exécute à chaque changement d'état React au lieu d'être exécuté **une seule fois au montage**.
- **Règle** : Le hook `useLayoutEffect` principal ne doit dépendre que de `[scene, animations, name, isLara, targetHeight, variant, sittingScene, id]`. Les états `laraNude`, `laraShoes`, `laraGloves` ne doivent être manipulés que dans `useFrame` ou des refs locales.

### ⚠️ 2. Inversion de Textures (UV Flip / flipY)
- **Symptôme** : Des textures de jambes ou de pieds apparaissent à l'envers ou inversées verticalement.
- **Cause** : Les chargeurs GLTF dans Three.js appliquent par défaut `texture.flipY = false`. Toute texture re-créée dynamiquement (ex. `CanvasTexture`) ou re-liée dans Blender doit impérativement conserver `flipY = false` et l'espace colorimétrique `SRGBColorSpace`.

### ⚠️ 3. Perte de Cible Armature lors des Imports Blender (`armature=None`)
- **Symptôme** : Certains meshes restent figés en l'air en pose T tandis que le reste du corps s'anime.
- **Cause** : Lors de l'import d'objets entre fichiers `.blend`, le modificateur `ARMATURE` perd sa référence vers l'objet `Armature`.
- **Règle** : Toujours réassigner `arm_mod.object = bpy.data.objects['Armature']` et `obj.parent = armature` avant tout export GLTF.

### ⚠️ 4. Duplication des Meshes (.001)
- **Symptôme** : Des doublons invisibles consomment des draw calls ou créent des artefacts d'ombre.
- **Règle** : Nettoyer systématiquement les blocs de données avec suffixe `.001` dans Blender avant export.
