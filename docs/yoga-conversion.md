# Conversion des animations de yoga MOYO

Les fichiers NPZ MOYO utilisent les articulations et rotations SMPL-H. Donner
simplement des noms Mixamo aux os SMPL ne produit pas une animation compatible
avec le retargeting de l'application : les repères de repos et les proportions
sont différents.

`scripts/convert-yoga-variants.py` reprend la conversion validée pour les poses A
dans les commits `4269377d`, `3effee80` et `9ce2b842`. Le script original était
conservé hors du dépôt dans les fichiers `batch_convert_yoga.py` et
`reconvert_22_yoga.py` d'Antigravity.

La conversion importe l'armature de `anim_salsa_dancing.glb`, transforme chaque
rotation SMPL dans le repère de repos de son os Mixamo, annule la rotation de
racine de 90° autour de X et applique le facteur de translation calibré de 1,17
ainsi que le décalage de repos des hanches. Les captures de l'acteur 03596 sont
sélectionnées avec la même priorité de session que les poses A : 221004,
220926, puis 220923.

Pour reconvertir toutes les variantes B à G présentes dans le projet :

```bash
blender --background -noaudio --python-exit-code 1 --python scripts/convert-yoga-variants.py
```

Le script remplace les GLB et actualise les durées, tailles et métadonnées dans
le registre et `yoga_meta.json`. Il ne saute pas les fichiers déjà existants.
Une source manquante ou invalide interrompt explicitement la conversion.
L'option `--source-dir` permet de préciser l'emplacement du dossier MOYO.

Pour vérifier la reproduction d'une pose A déjà corrigée sans la remplacer :

```bash
blender --background -noaudio --python-exit-code 1 --python scripts/convert-yoga-variants.py -- --output-dir /tmp/yoga-reference anim_yoga_akarna_dhanurasana_a.glb
python3 scripts/check-yoga-conversion.py public/animations/npz/yoga/anim_yoga_akarna_dhanurasana_a.glb /tmp/yoga-reference/anim_yoga_akarna_dhanurasana_a.glb
```

Pour tester les variantes dans le navigateur, lancer Vite, puis :

```bash
ROOM_TEST_URL=http://127.0.0.1:5176 node scripts/check-yoga-variants.cjs
npx tsc --noEmit
```

Le test vérifie la couverture du sélecteur, les repères de repos par rapport à
une pose A corrigée, le retargeting sur Lara et la conservation des longueurs
des membres. Il produit également un aperçu de six postures dans
`/tmp/room-yoga-variants-corrected.png`. Une lecture sans erreur ou des matrices
finies seules ne prouvent pas que les repères du squelette sont corrects.

## Hauteur du bassin et noms des postures

Le retargeting reçoit l'identifiant canonique de l'animation. La détection de la
T-pose doit comparer cet identifiant à `t-pose` exactement : chercher cette
sous-chaîne reconnaissait aussi `twist-pose`, `boat-pose`, `locust-pose`,
`leg-lift-pose` et `split-pose`, et supprimait toutes les translations du bassin.
Les trois Bharadvaja flottaient ainsi entre 65 et 83 cm aux instants mesurés sur
Y Bot et Lara. Les translations étaient déjà présentes dans les GLB ; cette
correction du retargeting commun ne nécessite aucune reconversion des sources.

Régression sur les 128 fichiers YOGA et la vraie T-pose :

```bash
node --test --test-isolation=none tests/unit/yoga-retargeting.test.cjs
ROOM_TEST_URL=http://127.0.0.1:5176 node scripts/check-yoga-grounding.cjs
```

Le contrôle navigateur utilise les identifiants réels, compare les translations
à celles du même clip sous un nom neutre et mesure les maillages déformés de
Y Bot et Lara à cinq instants. Il écrit `/tmp/yoga-grounding.json` et un aperçu
des trois Bharadvaja dans `/tmp/yoga-grounding.png`. Ces mesures ne constituent
pas un solveur de contacts : les différences de proportions peuvent encore
produire des pénétrations, notamment aux mains. Aucun recalage image par image
n'est appliqué, afin de conserver les translations et sauts des sources.
