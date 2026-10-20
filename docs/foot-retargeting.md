# Diagnostic des pieds : Inter-X et Fab

## Deux causes distinctes

- **Inter-X** : la reconstruction du maillage SMPL-X natif de
  `G019T006A000R024/P1` montre déjà le cabrage aux frames 25 et 174.
  Le problème existe avant la conversion GLB. Le contrôle inclut P2 et
  `G019T000A000R003`, frame 138. Une frame à 30 Hz correspond à quatre
  frames du NPZ original à 120 Hz.
- **ActorCore/Fab** : l'importeur alignait la direction cheville–orteils
  du rig source sur celle du template Mixamo. Cette direction dépend de
  la position des articulations et ne représente pas l'inclinaison de la
  semelle. L'alignement ajoutait environ 25° au clip ActorCore étudié.

La correction conserve les repères de repos natifs des chevilles et des
orteils dans `import-fab-animations.py`. Le transfert de leurs rotations
animées reste actif, y compris le déroulé des orteils et les levers de pointe.

Le contrôle des trajectoires a également révélé que les positions du bassin
des imports métriques étaient copiées depuis les échantillons natifs après
réduction des timestamps à 30 Hz. `retargetClip.ts` les évalue désormais aux
timestamps conservés, pour synchroniser la translation avec les rotations.

Inclinaison relativement au repos pour `dual-gun-muzdn-mov-cool-shoot-279383` :

| Frame | Avant, gauche / droite | Après, gauche / droite |
| --- | --- | --- |
| 27 | +41,3° / +18,8° | +16,7° / −5,8° |
| 92 | +24,6° / +24,8° | −0,2° / 0,0° |

## Validation et reproduction

Les 321 GLB Fab publiés ont été corrigés. Seuls leurs échantillons de rotation
de chevilles et d'orteils changent : le rig, les temps, les translations et les
autres pistes sont conservés octet pour octet. La finalisation du script évite
d'inclure les différences du template Xbot intervenues depuis l'import initial.
Les empreintes binaires du rapport d'import sont actualisées.

Les quatre articulations corrigées correspondent au FBX original sur ses
741 frames, avec une erreur maximale de matrice inférieure à `1e-6`.
La marche et la course Mixamo retargetées sont identiques à la référence.
Le test navigateur des mouvements valide les 642 retargetings Fab sur Lara
et Xbot, notamment les longueurs de membres et les déplacements métriques.

```bash
python scripts/temp_feet_retarget.py
blender --background --factory-startup -noaudio --python-exit-code 1 --python scripts/temp_feet_retarget.py -- --actorcore
node scripts/temp_feet_retarget.cjs --baseline
node scripts/temp_feet_retarget.cjs
node scripts/temp_feet_retarget.cjs --xbot
node scripts/temp_feet_retarget.cjs --gaits
node scripts/temp_feet_retarget.cjs --native
node scripts/temp_feet_retarget.cjs --native --actorcore
python scripts/temp_feet_retarget.py --verify
node scripts/temp_fab_check.cjs --motions-only
```

Les fichiers sources sont lus dans `/home/dinatih/3D Resources` ; les mesures,
maillages de diagnostic et captures restent dans `/tmp/room-feet-*`.
Le test navigateur utilise le lanceur headless commun du projet.
