# Animations 3D — Organisation par source

Ce dossier regroupe les **950 animations GLB** du projet, classées par provenance :

```text
public/animations/
├── miley/              # 172 animations extraites de Miley
├── npz/
│   ├── yoga/           # 130 animations Yoga issues de NPZ
│   └── dances/         # 12 danses NPZ : Bachata, RnB, Salsa, Reggaeton, etc.
├── mixamo/             # 629 animations Mixamo
└── others/             # 7 animations signatures extraites des personnages
```

## Règles de classement

- `miley/` : animations extraites de Miley, nommées `miley_armature_*`.
- `npz/yoga/` et `npz/dances/` : collections converties depuis NPZ ; leurs métadonnées JSON restent avec les GLB correspondants.
- `mixamo/` : animations identifiées par leurs fichiers FBX sources ou leurs pistes Mixamo. Le nom d’un squelette retargeté ne définit pas sa provenance.
- `others/` : animations signatures des personnages et toute autre provenance non confirmée. Les signatures restent ici même si la conversion a nommé leurs pistes `mixamo.com`.

## Registre et interface

Les chemins de chargement sont déclarés dans `src/features/scene/animations/animationRegistry.ts` :

```ts
const walkPath = 'animations/mixamo/anim_walking.glb';
const mileyPath = 'animations/miley/miley_armature_idle01_f.glb';
const bachataPath = 'animations/npz/dances/anim_bachata_vaso_01.glb';
```

La propriété obligatoire `category` du registre définit le thème affiché dans le sélecteur : combat, danses, emotes et gestes, interactions, locomotion, poses et idles, sports et fitness, Yoga et Mocap. Elle est indépendante du dossier source. Les tags conservent leur rôle sémantique dans les interactions.

Les anciens chemins thématiques ne sont plus pris en charge. Toute nouvelle animation doit être placée dans le dossier de sa source et enregistrée avec son chemin réel et sa catégorie.
