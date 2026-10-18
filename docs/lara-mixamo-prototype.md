# Lara : prototype de squelette compatible Mixamo

Ce prototype conserve les proportions de Lara et ajoute les deux clavicules ainsi
que le segment de dos manquant. Il sert à comparer le résultat avant une migration
du personnage utilisé dans l'application. Native conserve `lara_native.glb`.
Le prototype est sélectionnable sous « 🧪 Lara Mixamo (prototype) » dans le sélecteur
de personnages, l'inventaire et les previews. Les animations et réglages de tenue
habituels s'appliquent aux deux versions. Pour ouvrir directement le prototype :
`http://localhost:5173/?character=lara_mixamo&npcNb=1`.

## Fichiers

- `public/characters/lara/lara_mixamo_prototype.blend` : fichier de travail autonome,
  textures intégrées, 34 meshes conservés, 92 os, huit actions de revue.
- `public/characters/lara/lara_mixamo_prototype.glb` : export avec squelette, toutes
  les variantes et sans animations embarquées, testé avec le retargeting réel.
- `docs/lara-mixamo-prototype-report.json` : mesures de construction et de validation.
- `docs/lara-mixamo-comparison.png` : originale à gauche, prototype au centre,
  Xbot à droite, au milieu de l'animation `overhead_squat`.

Le `.blend` s'ouvre en pose de repos, avec la tenue native. Les variantes
mutuellement exclusives sont masquées dans la collection « Lara · variantes
conservées ». Elles restent disponibles dans le fichier et l'export GLB.

Dans le workspace Animation, sélectionner `Armature`, passer l'éditeur inférieur
en Action Editor et choisir une action :

- `Mixamo · female_walk`
- `Mixamo · overhead_squat`
- `Mixamo · ymca_dance`
- `Mixamo · air_squat_bent_arms`
- `Test · bras levés`
- `Test · bras devant`
- `Test · torsion avant-bras`
- `Test · flexion dos`

Les quatre actions Mixamo sont échantillonnées à 30 Hz depuis le retargeter de
l'application, puis reconstruites dans Blender avec interpolation linéaire.
Les actions `Test` sont des poses synthétiques de contrôle, avec amplitude maximale
à l'image 31 et retour à la pose de repos à l'image 61.

## Construction

Le corps conserve les noms Lara : `pelvis` → `spine_lower` → `spine_middle` →
`spine_upper`, puis `head_neck_lower` / `head_neck_upper`. Les nouvelles clavicules
`arm_left_shoulder` et `arm_right_shoulder` précèdent les bras existants
`arm_*_shoulder_2` → `arm_*_elbow` → `arm_*_wrist`. Les doigts gardent
`arm_*_finger_1a` à `arm_*_finger_5c`. Aucun os ni groupe de poids ne porte de préfixe
Mixamo. Le retargeter associe ces noms aux rôles du squelette Mixamo.

Les os du visage, de la tresse, de la poitrine et des accessoires sont conservés.
L'ancien `root_hips` est fusionné avec `pelvis` ; le root au sol reste `root_ground`.
Le troisième segment du dos est inséré entre les deux segments existants.
Les clavicules relient le centre du haut du thorax aux articulations des bras.

Il s'agit d'un squelette compatible adapté à Lara, avec sa nomenclature, ses axes de repos et ses
proportions, et non d'un passage dans l'auto-rigger en ligne de Mixamo. Une animation
Xbot brute nécessite toujours du retargeting. Le fichier ne comporte pas de rig de
contrôle IK pour l'animation manuelle.

Les poids initiaux sont redistribués localement autour du dos et des épaules, sans
recalcul automatique intégral. Le placement des transitions provient des os de
Lara. Les poids sont normalisés et limités aux quatre influences prises en charge
par le skinning Three.js utilisé ici. La masse maximale écartée sur un sommet est
d'environ 1,13 % avant renormalisation. Cette opération peut aussi modifier les
poids numériques de sommets éloignés des épaules, sans changer leur attachement.
Le mode Preserve Volume est désactivé pour correspondre au skinning linéaire GLB.

Le résolveur d'os donne maintenant priorité aux noms exacts avant les synonymes :
la recherche de Spine pouvait auparavant choisir Spine1 sur un squelette Mixamo.

## Validation et limites

- Géométrie au repos comparée à `lara_perfect.blend` : écart maximal inférieur à
  0,0004 mm ; nombres de sommets/faces et affectations des matériaux conservés.
  Les UVs et les images ne sont pas modifiés par le script.
- Hiérarchie et résolution des os vérifiées sur le GLB chargé par GLTFLoader.
- Quatre animations × trois instants × trois personnages : 36 échantillons,
  pistes et sommets déformés finis, pistes des clavicules et Spine1 présentes.
- Actions Blender reconstruites comparées aux matrices des poses du moteur à
  trois instants par animation : écart maximal inférieur à 0,000003 par coefficient.
- Le fichier sauvegardé est rouvert pour vérifier les meshes, os, actions,
  textures intégrées et l'intégrité du fichier source.
- `npx tsc --noEmit` et `git diff --check`.

La revue frontale montre un mouvement cohérent des épaules sur ces essais. Elle
ne démontre pas l'absence de défaut sur toute la bibliothèque. Des ouvertures du
vêtement à la taille restent visibles en flexion ; le prototype n'est pas validé
comme remplacement de production. Les aisselles, les torsions extrêmes et les
variantes de tenue nécessitent encore une revue visuelle détaillée, de plusieurs
angles, et éventuellement une retouche manuelle des poids.

## Reproduire

Depuis la racine du projet, avec Blender 5.2 et les dépendances npm installées :

```bash
ALSOFT_DRIVERS=null blender -b --python-exit-code 1 --python scripts/temp_lara_mixamo.py
npm run dev -- --host 127.0.0.1
```

Dans un autre terminal :

```bash
node scripts/check-lara-mixamo.cjs
ALSOFT_DRIVERS=null blender -b --python-exit-code 1 --python scripts/temp_lara_mixamo.py -- --bake-runtime
ALSOFT_DRIVERS=null blender -b --python-exit-code 1 --python scripts/temp_lara_mixamo.py -- --verify
npx tsc --noEmit
```

Le navigateur est headless et utilise le lanceur du projet. Il produit les captures,
les poses et le rapport runtime sous `/tmp/lara-mixamo-*`. Les modèles et animations
sont servis localement par Vite, sans interception des fichiers GLB. Le dossier
`public/` est surveillé pour détecter les modèles ajoutés pendant le développement.
Le mode `node scripts/check-lara-mixamo.cjs --project` vérifie également la signature
binaire du GLB servi, son montage dans la scène et la disparition de l'écran de
chargement avant de capturer l'application.

`node scripts/check-lara-mixamo.cjs --component` monte les vrais `CharacterGroup`
Native et prototype dans une scène légère, en attend la visibilité et produit
`/tmp/lara-mixamo-component.png`. Ce test et les quatre animations passent avec le
chargement HTTP réel. Le démarrage de l'appartement complet reste au-delà du délai
de 120 secondes dans le test headless de cet environnement ; il n'est pas déclaré
validé. `--hardware-gpu` utilise les options Vulkan des autres tests du projet,
tout en conservant le mode headless.
