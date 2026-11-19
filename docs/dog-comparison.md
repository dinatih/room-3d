# Comparaison des chiens et diagnostic du ventre d’Ushiro

Ouvrir `/dog-comparison.html?skeleton=1&clip=walk_fwd%2029&frame=20`, ou utiliser
« Comparer les chiens » dans la preview de Pitbull, Ushiro ou du teckel HD.

La vue montre Pitbull, Ushiro et Ulotte HD (le sculpt noir, distinct de l’ancien
modèle Ulotte). Une horloge unique pilote les trois mixers à la même phase.
Lecture, pause, pas d’une image, vitesse, boucle, animation et caméras sont liés.
La disposition peut être horizontale ou verticale. « Même hauteur » normalise
les hauteurs au repos ; sa désactivation montre les dimensions de la scène.
« Recadrer » rétablit la vue choisie et le zoom commun. K bascule le squelette ;
Espace bascule lecture et pause. Le bouton Os ouvre la
hiérarchie du modèle ; sélectionner un os affiche les poids de sa peau.
Les trois planches anatomiques apparaissent par défaut sous leur carte
3D, dans les deux dispositions. Un clic ouvre la planche en grand ; la case
« Références anatomiques » permet de les masquer.
« Pose de référence » affiche la pose de liaison, sans animation ; son état se
partage avec `referencePose=1`. La taille et le centrage sont mesurés dans la
même attente (`idle 50`) que les composants de scène. Les copies des clips
utilisent une interpolation fluide ; le fichier du pitbull contient des paliers.

`skeleton=1` est désormais le paramètre global du calque squelette, utilisé par
la scène, l’inventaire et la comparaison. Le changement d’item ne réinitialise
plus ce choix. Le paramètre est retiré lorsque le squelette est désactivé.
`clip`, `frame`, `layout` et `view` permettent de rouvrir une comparaison précise.

## Observations mesurées

`artifacts/dog-comparison/skinning-report.json` contient les poids réels actuels.
Le relevé initial est archivé dans `artifacts/ushiro/rebuild/previous-skinning.json`.
La région échantillonnée est la moitié centrale
de l’axe bassin-poitrine, entre 25 % et 80 % de la hauteur du dos. Il s’agit d’une
région de diagnostic normalisée, pas d’une mesure anatomique clinique. Les nombres
de sommets diffèrent avec la densité des maillages et ne se comparent pas seuls.

| Modèle | Os réels | Sommets échantillonnés | Influence moyenne des membres | Sommets avec majorité de poids des membres |
|---|---:|---:|---:|---:|
| Pitbull | 117 | 326 | 0,03 % | 0 |
| Ushiro avant reconstruction | 44 | 162 | 71,47 % | 137 |
| Ushiro reconstruit | 118 | 134 | 0,05 % | 0 |
| Ulotte HD | 44 | 3 571 | 32,14 % | 1 090 |

Dans le rig précédent, les principaux poids d’Ushiro allaient à `LeftArm` (29,47 %),
`RightArm` (19,01 %), `RightUpLeg` (9,62 %) et `LeftUpLeg` (8,82 %).
Ils entraînent la peau du ventre lorsque les membres pivotent. Le pitbull utilise
surtout `Spine2`, `Spine3` et `Spine1` (77,14 % au total dans la région), et dispose
aussi de `breathe r`, `breathe l` et `breathe crotch` (5,56 % au total).

La reconstruction réutilise la répartition anatomique de l’archive du shiba,
puis recalcule sa liaison au nouveau rig. Elle corrige aussi le décalage des
pivots et des axes de référence : `Shoulder01` est l’épaule du donneur, `Arm`
son coude, `ForeArm` son poignet, `Pelvis` sa hanche et `UpLeg` son genou.
Le nombre total d’os n’est pas une mesure de qualité ; une partie des os
supplémentaires du donneur concerne ses doigts, sa face et ses contrôles.
Les côtes figurant sur une illustration anatomique ne sont pas les contrôles
latéraux d’un rig d’animation. Les autres défauts restent à analyser séparément.

La reconstruction et les contrôles de l’attente, de la marche et de la course
sont détaillés dans `docs/ushiro-rig-rebuild.md`. Les captures du cycle de marche
sont dans `artifacts/dog-comparison/walk-frame-*.png`, aux images 0, 8, 16, 20,
24 et 32 de la timeline commune à 30 images/s.

## Reproduire les contrôles

```bash
blender -b -noaudio -t 2 --python-exit-code 1 --python scripts/analyze-dog-skinning.py
node scripts/check-dog-comparison.cjs --hardware-gpu
node scripts/check-inventory-animation-controls.cjs --hardware-gpu
node --test --test-isolation=none tests/unit/lights-url.test.cjs
npx tsc --noEmit
npm run build
```

Les tests navigateur utilisent Vite sur `127.0.0.1:5191` (surcharge possible avec
`ROOM_TEST_URL`), un navigateur headless marqué, les seuls canvases nécessaires
et le blocage des requêtes externes. Ils contrôlent les phases des actions des
mixers, les commandes, les caméras, le compteur et la persistance du squelette.

La planche `public/references/xray/pitbull-xray.png` est une illustration générée
avec imagegen, explicitement schématique. Son prompt et sa provenance sont dans
`docs/pitbull-reference-image.md`. Elle est consultable depuis la comparaison
et depuis les photos de la fiche du pitbull.
