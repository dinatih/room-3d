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

## Nettoyage des appuis Inter-X

`interx_foot_support.py` nettoie maintenant les appuis à la conversion pour les
catégories déjà déclarées debout dans `GROUND_STANDING_ACTIONS`. Les NPZ bruts
restent la référence originale. Les GLB publiés et les futurs exports utilisent
la même correction, identifiée par `footSupport: heel-support-envelope-v1`.

Le modèle SMPL-X, le genre et les coefficients de forme du participant donnent
la géométrie des semelles. Le plan de support est ajusté à leur enveloppe basse.
La hauteur du talon détermine un poids d'appui, qui devient nul au-delà de la
hauteur anatomique cheville–semelle. L'enveloppe des minima de pitch fournit le
biais positif persistant à retirer : les pics d'attaque du talon entre deux
appuis neutres restent libres. La correction décroît avec l'appui et ne peut
jamais ajouter de flexion plantaire. Aucun angle fixe ni fenêtre temporelle
arbitraire n'est nécessaire.

248 duos / 496 clips ont été évalués ; 447 clips ont changé. Seules les pistes
de rotation des chevilles changent. Les pistes locales des orteils, les bras,
les mains, le bassin, les trajectoires et les durées sont conservés à l'identique.
Les autres catégories, notamment la marche et la poursuite, restent intactes.

Sur Lara, `G019T006A000R024/P1` passe de 16–21° de cabrage à moins de 0,5° aux
frames 25 et 174. Les captures comprennent aussi les deux participants de
`G019T000A000R003`, frame 138, sur Lara et Xbot.

```bash
python scripts/correct_interx_feet.py
python scripts/check_interx_foot_support.py
python scripts/check_interx_foot_support.py --assets
node scripts/temp_feet_retarget.cjs --interx
node scripts/temp_feet_retarget.cjs --interx --xbot
blender --background --factory-startup -noaudio --python-exit-code 1 --python scripts/temp_feet_retarget.py -- --export-interx-pilot
python scripts/temp_feet_retarget.py --verify-interx-roundtrip
```

Les tests vérifient les attaques du talon, le déroulé vers les orteils, les pieds
levés, l'absence de flexion plantaire forcée, les quaternions et la conservation
exacte des échantillons hors correction. Le nouvel export Blender des deux
participants pilotes correspond aux GLB réparés sur leurs 184 frames.

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
