# Inter-X : sélection et import des duos

Le catalogue cible contient **218 duos / 436 GLB**, couvrant les 40 actions.
Le premier câlin et la première poignée de main sont publiés ; les autres
sélections restent des sources à convertir. Aucun chemin non exporté n'est
inscrit dans les registres de l'application.

## Sélection

`select_interx_duos.py` examine uniquement les dossiers directs du dataset.
Il retient le plus petit R disponible pour chaque G/T/A, puis le plus petit G
pour chaque A/T. Les représentants sont triés par A/T, avec un maximum de
8 duos par action. Les sessions T ne sont pas des labels sémantiques de style.
Il n'ajoute pas de répétitions G pour remplir les catégories ayant moins de
8 sessions. Les paires manquantes, désynchronisées ou invalides provoquent
une erreur explicite.

```bash
python3 scripts/select_interx_duos.py --dry-run
python3 scripts/select_interx_duos.py --output scripts/interx_selection.json
```

`--source '/chemin/vers/motions'` permet de choisir un autre dossier source.
Le dry-run ne crée aucun fichier. Le rapport détaille G/T/A/R, les durées,
les offsets et le poids estimé par catégorie. Le poids utilise une calibration
linéaire `taille = base + coût_par_frame × nombre_de_frames` mesurée sur les
GLB disponibles ; il reste une estimation, notamment pour les actions longues.

## Placement et unités

P1 et P2 partagent les axes mondiaux des NPZ, en mètres, avec Y vertical.
Les clips conservent les orientations `root_orient` et les déplacements
`trans[t] - trans[0]`. Chaque duo stocke :

```text
start_offset = transP2[0] - transP1[0]
baseP1 = ancre
baseP2 = ancre + rotation_ancre × (100 × start_offset)
```

Les deux pilotes câlin et poignée de main utilisent explicitement
`placement.verticalOrigin: "soles-preserve-hands"`. Le parent conserve l'offset
source complet. Après retargeting, on mesure les sommets skinnés des semelles
à la première frame, puis on applique une correction constante au bassin pour
poser chaque avatar sur le même sol. Les déplacements animés restent conservés.
Une IK des bras conserve les positions et orientations originales des poignets
à chaque échantillon. Sur Lara, qui n'a pas de clavicule indépendante, une cible
au-delà de la portée des deux segments déplace l'épaule du minimum nécessaire,
sans allonger le bras ni l'avant-bras. Les transformations du modèle sont
restaurées après le calcul ; les corrections sont stockées dans le clip en cache.
Ce réglage par duo est conservé lors des réexports ; les autres duos utilisent
leur offset source complet sans cette correction.

Diagnostic des pilotes : les NPZ utilisent des morphologies différentes
(`gender=female` pour P1, `male` pour P2 et des `betas` différents), tandis que
Native et Rosanna partagent le rig Lara de 173,4 cm. La conversion des rotations
ne reprend pas les proportions SMPL-X. Les offsets initiaux Y sont respectivement
9,1207 cm et 16,6345 cm ; ce ne sont pas des mesures de hauteur de semelle.
Les trois modèles SMPL-X fournis dans `/home/dinatih/3D Resources/animations`
sont maintenant utilisés par `scripts/temp_interx_grounding.py` pour reconstruire
les sources en NumPy : formes selon les 10 betas, rotations axis-angle, hiérarchie
des 55 articulations, correctifs de pose et skinning des semelles. Visage et
expression restent neutres ; les rotations des mains sont prises directement
dans les NPZ. Le diagnostic enregistre les empreintes des modèles pour pouvoir
reproduire les mesures. Les modèles et leurs maillages ne sont pas publiés.

### Mesures des deux pilotes avec les modèles SMPL-X fournis

Les mêmes morphologies G001 sont utilisées pour les deux prises : la hauteur
verticale du template après application des betas est **162,56 cm pour P1** et
**177,31 cm pour P2**. Il s'agit de hauteurs de modèle, pas de tailles mesurées
des volontaires. Native et Rosanna restent des avatars de 173,4 cm.

| Duo | Delta `trans.y` | Delta bassin mondial | Semelle P1, frame 0 | Semelle P2, frame 0 |
| --- | ---: | ---: | ---: | ---: |
| Câlin G001T000A000R000 | 9,1207 cm | 6,8530 cm | −2,1552 cm | −2,4951 cm |
| Poignée G001T000A001R005 | 16,6345 cm | 14,3669 cm | −2,4335 cm | 4,2678 cm |

`trans` translate le modèle entier. Le bassin mondial vaut
`trans + J_rest[0]`, et sa position Y de repos varie selon le modèle et les betas
(−33,2173 cm pour P1, −35,4849 cm pour P2). Copier le delta de translation sur
deux bassins Lara ayant la même origine interne ne reconstitue donc pas les
positions des bassins source. Le delta brut reste conservé dans le manifest.
Les semelles source ne décrivent pas non plus un sol parfait : la poignée de
main présente déjà un écart initial de 6,7014 cm entre les deux semelles.

Le calage de la preview utilise les semelles réelles des avatars et conserve
les anciens poignets retargetés avec l'IK. À la frame où les poignets source
sont les plus proches, leurs vecteurs relatifs diffèrent encore de ceux des
avatars de 8,8166 cm (câlin, frame 135 à 30 Hz) et 6,2110 cm (poignée, frame 48).
Les distances entre articulations des poignets ne sont pas des mesures de
distance entre surfaces des mains : elles ne prouvent pas un contact ou son
absence. Ce contrôle distingue la fidélité aux sources de la conservation des
anciens poignets, que les tests vérifient à moins de 0,001 cm.
L'IK actuelle corrige l'appui initial, pas les appuis ultérieurs, et ne prétend
pas reconstruire les contacts SMPL-X exacts sur un avatar aux proportions différentes.

Reproduire le diagnostic puis la comparaison avec les avatars :

```bash
python3 scripts/temp_interx_grounding.py
python3 scripts/check_interx_pipeline.py --reference /tmp/interx-motion-reference.json
node scripts/check_interx_motion.cjs --smplx
```

Options : `--models '/dossier/des/modeles'`, `--source '/dossier/motions'`,
`--report '/chemin/rapport.json'` et `--reference '/chemin/trajectoires.json'`.
Sorties par défaut : `/tmp/interx-smplx-report.json`,
`/tmp/interx-smplx-reference.json`, `/tmp/interx-smplx-avatar-comparison.json`.
Le comparateur Node utilise ces chemins par défaut.

### Trouver des binômes de tailles proches

```bash
python3 scripts/temp_interx_grounding.py --find-similar-heights A000 A001
```

Ce mode parcourt les groupes G et variations T des actions demandées, conserve
la première prise disponible de chaque G/T/A, puis classe les paires selon
l'écart de hauteur des templates SMPL-X avec leurs betas. Il ne déduit pas la
taille de `trans.y`. Les hauteurs sont mises en cache par genre et betas ; toutes
les prises retenues figurent dans `/tmp/interx-height-candidates.json`, avec
les empreintes des modèles. Le terminal affiche un représentant par groupe.
`--ranking-report '/chemin/rapport.json'` change le chemin de sortie.

Pour A000 et A001 : **60 premières prises, 58 groupes et 4 codes T par action**.
Il ne s'agit pas d'un comptage de personnes distinctes : G identifie un binôme.

| Groupe | P1 | P2 | Écart | Premier câlin | Première poignée de main |
| --- | ---: | ---: | ---: | --- | --- |
| G039 | 161,69 cm | 161,81 cm | 0,12 cm | G039T000A000R000 | G039T000A001R008 |
| G041 | 161,89 cm | 162,12 cm | 0,23 cm | G041T000A000R000 | G041T001A001R000 |
| G053 | 174,81 cm | 175,31 cm | 0,50 cm | G053T000A000R000 | G053T000A001R005 |
| G056 | 170,85 cm | 171,49 cm | 0,64 cm | G056T000A000R000 | G056T000A001R005 |
| G021 | 177,28 cm | 177,97 cm | 0,69 cm | G021T000A000R000 | G021T000A001R005 |

G039 minimise l'écart entre partenaires. G053 est le candidat recommandé pour
Native et Rosanna (173,4 cm), car les deux tailles source sont proches de celles
des avatars. Les deux prises G053 sont désormais publiées en plus des pilotes
G001, avec des libellés incluant le groupe pour permettre la comparaison.
Elles utilisent également `soles-preserve-hands`. Le catalogue général à
218 duos conserve sa sélection ; les G053 proviennent d'une sélection pilote
explicite distincte, limitée aux deux prises autorisées.

Reproduire cet import ciblé (première prise disponible par G/T/A) :

```bash
python3 scripts/select_interx_duos.py \
  --recordings G053T000A000R000 G053T000A001R005 \
  --output scripts/interx_g053_selection.json
ALSOFT_DRIVERS=null blender -noaudio --background --python-exit-code 1 \
  --python scripts/convert_interx_duos.py -- \
  --selection scripts/interx_g053_selection.json --ground-standing
python3 scripts/check_interx_pipeline.py --reference /tmp/interx-motion-reference.json
node scripts/check_interx_motion.cjs --browser --group G053
```

La sélection explicite utilise `representative: "explicit-recordings"`.
Elle conserve le contrôle des quotas et de l'unicité A/T et refuse une prise
qui ne serait pas la première disponible. `--ground-standing` active uniquement
la correction des interactions debout prises en charge ; il met aussi à jour cette métadonnée pour
des exports déjà vérifiés, sans réexporter leurs GLB.

### Lots de dix avec tailles proches

Le premier lot après les pilotes G053 est enregistré dans
`scripts/interx_batch_001_selection.json` : dix nouveaux duos G053, vingt GLB,
**7 532 828 octets (7,53 Mo)**. Il contient A011 (tapoter le dos), A016
(high-five), A018 (chuchoter), A019 (soutenir avec la main), A020
(pierre-feuille-ciseaux), A021 (danser), A022 (bras dessus dessous), A023
(épaule contre épaule), A029 (discuter), A030 (caresser la joue).

Les métadonnées `heightSelection` gardent les hauteurs des partenaires et les
empreintes des modèles. Pour chaque A/T, le choix minimise l'écart maximal
entre les deux tailles source et la taille des avatars, puis l'écart entre
partenaires. Le lot alterne les actions, ignore les A/T déjà publiés et respecte
le plafond de huit variations par action. `--batch-size 10` limite le lot à dix
duos ; le dernier lot peut être plus petit si moins de prises restent disponibles.
La commande prépare un seul lot.

Préparer le prochain lot des mêmes thèmes (dry-run sans écriture) :

```bash
python3 scripts/temp_interx_grounding.py \
  --find-similar-heights A011 A016 A018 A019 A020 A021 A022 A023 A029 A030 \
  --ranking-report /tmp/interx-next-batch-candidates.json
python3 scripts/select_interx_duos.py \
  --height-ranking /tmp/interx-next-batch-candidates.json \
  --batch-size 10 --target-height 173.4 --hand-motion --dry-run
```

Remplacer `--dry-run` par `--output scripts/interx_batch_002_selection.json`
pour enregistrer le lot suivant. L'estimation `--hand-motion` est calibrée sur
les GLB ayant des doigts animés. L'estimation initiale du lot 001 (3,77 Mo)
utilisait des exports du corps seuls ; les doigts animés augmentent le poids final.

Reprendre uniquement le lot 001 :

```bash
ALSOFT_DRIVERS=null blender -noaudio --background --python-exit-code 1 \
  --python scripts/convert_interx_duos.py -- \
  --selection scripts/interx_batch_001_selection.json \
  --ground-standing --hand-motion
python3 scripts/check_interx_pipeline.py --reference /tmp/interx-motion-reference.json
node scripts/check_interx_motion.cjs --browser \
  --selection scripts/interx_batch_001_selection.json
```

`--hand-motion` exige les poses finies et synchronisées `(frames, 15, 3)` des
deux mains et exporte leurs trente articulations de doigts. Le manifest marque
ces duos avec `handMotion: "full-axis-angle"`. La reprise vérifie cette marque
pour distinguer un export du corps seul de l'export demandé. Le retargeting
utilise les correspondances de doigts existantes ; le calage IK conserve leurs
orientations animées, ainsi que celles des poignets. Comme pour les pilotes,
il conserve les anciens poignets retargetés, pas des contacts SMPL-X exacts.
L'ajustement maximal d'épaule mesuré sur ce lot et les pilotes à hauteur native
atteint 11,0635 cm : les contacts et déformations restent à apprécier visuellement.

Le calage debout est pris en charge pour A000/A001 et les dix actions du lot
001. Il conserve les déplacements verticaux après le départ, y compris ceux
de la danse. Les actions couchées, assises et de portage demandent leur propre
traitement des appuis ; ce mode les refuse explicitement.

### Lot 002 : dix variantes supplémentaires

`scripts/interx_batch_002_selection.json` contient dix prises inédites des mêmes
thèmes, sans reprendre les A/T du lot 001. Vingt GLB supplémentaires sont
publiés, avec les doigts animés et le calage initial des semelles :
**5 053 704 octets (5,05 Mo)**. Le catalogue Inter-X compte désormais 24 duos
(48 GLB), dont les quatre pilotes utilisés pour la comparaison.

| Action | Prise | Durée |
| --- | --- | ---: |
| Tapoter le dos | G049T003A011R006 | 5,80 s |
| High-five | G049T004A016R006 | 3,73 s |
| Chuchoter | G008T004A018R000 | 3,03 s |
| Soutenir avec la main | G008T004A019R002 | 2,80 s |
| Pierre-feuille-ciseaux | G053T005A020R000 | 8,13 s |
| Danser | G056T004A021R005 | 11,67 s |
| Bras dessus dessous | G056T004A022R012 | 5,00 s |
| Épaule contre épaule | G056T004A023R016 | 8,97 s |
| Discuter | G056T005A029R018 | 16,20 s |
| Caresser la joue | G056T006A030R000 | 7,83 s |

Les binômes G056, G049 et G008 sont les meilleurs candidats disponibles pour
les sessions inédites selon le critère de proximité avec les avatars. G053
reste utilisé pour l'autre session de pierre-feuille-ciseaux. La prise signalée
comme étrange dans le lot 001 est conservée pour comparaison.

Reprise du lot 002 : utiliser les commandes du lot 001 en remplaçant le nom du
fichier de sélection par `scripts/interx_batch_002_selection.json`. Pour le
prochain lot, enregistrer une nouvelle sélection dans
`scripts/interx_batch_003_selection.json` après le dry-run ; les A/T des deux
lots précédents sont automatiquement exclus.

Références : [viewer Inter-X](https://github.com/liangxuy/Inter-X/blob/main/visualize/smplx_viewer_tool/data_viewer.py)
et [skinning SMPL-X](https://github.com/vchoutas/smplx/blob/main/smplx/lbs.py).

Les deux parents utilisent la même orientation. Aucune rotation de π ni
translation forfaitaire n'est ajoutée. La hauteur de repos des rigs est
conservée ; les déplacements des racines ne sont pas rescalés selon leur
morphologie. Les NPZ à 120 Hz sont échantillonnés à 30 Hz, à partir de la
frame 0. Le clip contient exactement ces échantillons, sans action Salsa
du modèle de squelette.

## Export ciblé, reprise et nettoyage

Le convertisseur exige une sélection et ne recherche pas de nouveaux dossiers.
Le mode Python dry-run ne dépend pas de Blender :

```bash
python3 scripts/convert_interx_duos.py --selection scripts/interx_selection.json --dry-run
```

Pour exporter uniquement une paire :

```bash
blender -noaudio --background --python-exit-code 1 \
  --python scripts/convert_interx_duos.py -- \
  --selection scripts/interx_selection.json \
  --recordings G001T000A000R000
```

Sans `--recordings`, la commande exporte la sélection entière. **Cette conversion
complète n'a pas été exécutée lors de la préparation du pipeline.**

Les sources sont contrôlées avec SHA-256 ; une sélection périmée est refusée.
Les paires déjà publiées sont réutilisées uniquement si leurs métadonnées,
tailles, cadences et empreintes GLB correspondent. `--rebuild` réexporte les
paires demandées. Toute modification du contrat de conversion doit augmenter
`CONVERSION.revision` et régénérer la sélection.

Chaque paire est exportée dans un dossier temporaire et contrôlée avant
publication. Le manifest est mis à jour après chaque paire complète pour
permettre la reprise. Un export interrompu avant publication n'apparaît pas
comme disponible.

`--prune` supprime uniquement les GLB Inter-X suivis par Git qui sont exclus de
la sélection, après vérification du manifest publié. Il ne supprime ni les
NPZ sources ni les fichiers non suivis. Utiliser un sous-ensemble explicite
avec cette option pour nettoyer sans déclencher un export complet :

```bash
blender -noaudio --background --python-exit-code 1 \
  --python scripts/convert_interx_duos.py -- \
  --selection scripts/interx_selection.json \
  --recordings G001T000A000R000 G001T000A001R005 --prune
```

## Manifest généré

`public/animations/npz/interx/interx_manifest.json` est l'index public des
paires disponibles. Une copie identique est générée dans
`src/features/scene/animations/interx_manifest.json` pour l'import JSON
compilé par Vite. Ne pas modifier ces deux copies séparément.

L'interface `InterXManifest` définit le schéma dans `interxManifest.ts` :

- `schemaVersion`, `dataset`, `conversion` : version, axes, unités et cadences.
- `actions` : dictionnaire des 40 codes A, clés kebab-case, libellés français,
  catégories du projet, icônes, indicateurs de combat et tags.
- `duos` : ID stable `interx-g…t…a…r…`, action et session d'origine.
- `source` : G/R, chemins NPZ relatifs à `motions`, nombre de frames source et
  empreintes SHA-256 de P1/P2.
- `clips.p1` et `clips.p2` : chemins relatifs à `public/`, nombre d'échantillons,
  durée exacte, taille en octets et empreinte SHA-256 mesurés après export.
- `rootMotion`, `start_offset` : contrat des racines et différence initiale
  exacte en mètres, y compris sa composante verticale.
- `tags` : mots-clés utilisés par les recherches des clips et des duos.

Les registres lisent exclusivement ce manifest pour leurs entrées Inter-X.
Les contrôles existants de placement restent utilisables ; « réinitialiser »
restaure l'offset calculé depuis les sources avec le réglage de hauteur du duo
et une rotation parent relative nulle.

## Vérifications

```bash
python3 scripts/check_interx_pipeline.py --reference /tmp/interx-motion-reference.json
node scripts/check_interx_motion.cjs
npx tsc --noEmit
```

Le contrôle Python vérifie la sélection, les sources, les empreintes, la
synchronisation, les deux copies du manifest et l'absence d'écriture du
dry-run. Le contrôle Three.js compare chaque échantillon aux NPZ après
retargeting sur Native, pour plusieurs tailles de modèle et des ancres
translatées/tournées. Il contrôle également les orientations originales.

Pour capturer le premier câlin avec l'aperçu réel de l'inventaire :

```bash
npm run dev -- --host 127.0.0.1 --port 5173
node scripts/check_interx_motion.cjs --browser
```

Les captures sont écrites dans `/tmp/interx-pilot-start.png` et
`/tmp/interx-pilot-contact.png`. Le contrôle de buste debout de ce test concerne
uniquement les deux pilotes publiés ; les futures actions au sol doivent être
vérifiées selon leur posture attendue.
# Export des thèmes prioritaires en une passe

## Extension par thème : tous les segments des binômes retenus

Les bilans précédents de 218/218 mesurent la couverture des sessions T avec
un segment représentatif. L'extension autorisée ajoute 543 segments duo sur
26 actions : tous les T/R encore absents des binômes G déjà retenus pour
chaque action, selon `docs/INTERX_ALL_SELECTED_GROUP_SEGMENTS_ESTIMATE.json`.
T désigne le numéro de tournage et R le numéro de découpage, d'après le
[README officiel Inter-X](https://github.com/liangxuy/Inter-X#data-loading).

```bash
python3 scripts/temp_interx_priority.py --convert-themes A000 A006 A009 A003 A011 A013 A017 A018 A019 A021 A022 A023 A024 A025 A026 A027 A029 A030 A032 A033 A034 A035 A036 A037 A038 A039
```

Le runner suit cet ordre, prépare une sélection et les mesures SMPL-X pour
chaque thème, puis exporte les doigts et les deux rôles. La politique
`all-splits` / `selected-groups-all-shoots` autorise plusieurs segments du
même G/T/A et vérifie la liste explicite des binômes autorisés.

Les fichiers de reprise sont dans `scripts/interx_segment_batches/` :

- `progress.json` : état des 26 thèmes, quantités et poids réels terminés ;
- `Axxx_selection.json` : sources exactes, empreintes, offsets et durées ;
- `Axxx_placement.json` : appuis et éventuelles cibles de poignets SMPL-X ;
- `Axxx_draft_manifest.json` : les duos vérifiés, sauvegardés après chaque paire.

Chaque thème complet est fusionné dans le catalogue du studio en une seule
publication. Les autres thèmes restent disponibles pendant la conversion.
Relancer la même commande reprend les paires vérifiées. Les sorties détaillées
sont dans `/tmp/interx-segments-Axxx-support.log` et
`/tmp/interx-segments-Axxx-export.log` ; le runner imprime `THEME_START`,
`THEME_DONE` ou `THEME_FAILED`, avec arrêt explicite en cas d'erreur.

Les libellés du sélecteur comprennent G, T et R pour identifier chaque segment.
Les champs historiques `source.take` continuent de stocker le code R.

Extension terminée : **543 nouveaux duos / 1 086 nouveaux GLB / 262,88 Mo**,
sur les 26 thèmes autorisés. Le catalogue publié contient désormais
**763 duos / 1 526 GLB / 365,99 Mo de GLB**. Les sélections, mesures et
manifestes JSON s'ajoutent à ces poids. Chaque paire a passé les contrôles
d'export (durée, frames, empreintes et métadonnées) ; cela ne constitue pas
une revue visuelle de tous les mouvements dans le studio.

## Conversion du reste du catalogue

Conversion terminée : 97 nouveaux duos et 194 nouveaux GLB. Le bilan source
est de **218 sessions T publiées sur 218, sur les 40 actions**, sans variante
T restante. Avec les deux comparaisons de binômes conservées, le catalogue
contient **220 duos / 440 GLB / 103,10 Mo de GLB**. Les métadonnées JSON
s'ajoutent à ce poids. Les répétitions G et R du dataset brut restent exclues.

La dernière sélection `scripts/interx_remaining_selection.json` contient les
97 sessions T encore absentes, réparties sur les 18 thèmes non importés et
les deux thèmes partiels (Poignée de main et High-five). Elle conserve un
binôme adapté à la taille cible de 173,4 cm et la première prise disponible.

```bash
python3 scripts/temp_interx_grounding.py --placement-selection scripts/interx_remaining_selection.json --report scripts/interx_remaining_placement.json
env ALSOFT_DRIVERS=null blender -noaudio --background --python-exit-code 1 --python scripts/convert_interx_duos.py -- --selection scripts/interx_remaining_selection.json --hand-motion --placement-metadata scripts/interx_remaining_placement.json
python3 scripts/temp_interx_priority.py --inventory docs/INTERX_CATALOG.md
```

Le mode `--placement-metadata` applique la politique debout déjà validée aux
actions concernées et les hauteurs d'appui SMPL-X aux autres. L'action
S'asseoir sur la jambe utilise aussi les trajectoires des poignets source,
comme les portages et massages. Les empreintes des NPZ et des modèles SMPL-X
sont vérifiées avant les exports pour empêcher l'emploi de mesures obsolètes.
Les modèles et les meshes SMPL-X restent hors du dépôt.

Les deux GLB sont contrôlés (animation unique, nombre de frames et durée)
avant leur publication atomique dans le manifest. Chaque duo est sauvegardé
individuellement ; relancer la commande reprend les exports vérifiés.

Le placement règle les appuis initiaux et conserve le mouvement vertical
source. Il ne fournit pas de simulation physique ni de contact de surface
exact entre les personnages. Une chaise ou un autre support peut rester
nécessaire selon l'action choisie.

## Second complément du 16 octobre 2026

Les onze actions suivantes couvrent désormais toutes leurs sessions T :

| Action | Variantes T |
| --- | ---: |
| Épaule contre épaule | 5 |
| Porter sur le dos | 7 |
| Masser les épaules | 6 |
| Masser les jambes | 6 |
| Discuter | 7 |
| Caresser la joue | 6 |
| Toucher la tête | 6 |
| Imiter | 6 |
| Baiser sur la joue | 6 |
| Aider à se relever | 7 |
| Envoyer un baiser | 6 |

Dix étaient déjà complètes. Cinq variantes de Discuter ont été ajoutées
(dix GLB), selon la sélection `scripts/interx_expanded_second_selection.json`.
Les paramètres restent ceux validés : doigts, calage debout, déplacements
métriques et offset initial exact entre P1 et P2.

Le bilan complet par action, incluant les thèmes encore absents et les
catégories partielles, est généré dans `docs/INTERX_CATALOG.md` :

```bash
python3 scripts/temp_interx_priority.py --inventory docs/INTERX_CATALOG.md
```

## Complément du 16 octobre 2026 : toutes les variantes T demandées

Les sept actions demandées couvrent désormais toutes leurs sessions T source,
avec un binôme choisi selon la taille et la première prise disponible par G/T/A.
Les répétitions G et R restent exclues. T désigne une session, sans garantir
un style sémantique différent.

| Action | Variantes T disponibles et publiées |
| --- | ---: |
| Câlin | 4 |
| Prendre la pose | 6 |
| Tapoter le dos | 5 |
| Chuchoter à l'oreille | 5 |
| Soutenir avec la main | 5 |
| Danser | 6 |
| Bras dessus dessous | 5 |
| Total | 36 |

Seuls trois chuchotements manquaient : G030T006A018R007,
G059T001A018R026 et G004T007A018R017. Leurs six GLB sont ajoutés avec
les doigts, le calage debout et les offsets source exacts. Le catalogue
Inter-X compte désormais 118 duos, en conservant les comparaisons G001/G053.

Le sélecteur de batch accepte `--all-variations` avec `--height-ranking` :
ce mode retire le quota de huit sessions par action et sélectionne toutes les
sessions encore absentes. Il ne se combine pas avec `--batch-size` ou
`--priority-themes`. Le convertisseur accepte ce choix explicite sous la
politique `height-matched-all-action-sessions` et `maxPerAction: null`.
Le rapport de couverture indique les sessions déjà publiées ; une relance
en `--dry-run` termine normalement avec zéro export si tout est couvert.

La sélection exacte de ce complément est conservée dans
`scripts/interx_expanded_selection.json`.

Export terminé : **91 nouveaux duos / 182 GLB / 45,17 Mo** de GLB.
Catalogue publié : **115 duos / 230 GLB / 58,85 Mo** de GLB, comprenant
les deux comparaisons G001/G053 conservées. Les thèmes prioritaires sont
complets ; **105 sessions** restent dans les autres catégories du catalogue
initial. Les JSON contenant les trajectoires des poignets s'ajoutent à ces
poids de GLB.

Validation : les 91 nouveaux duos sont contrôlés à chaque frame aux échelles
75/100/150 et aux orientations de session 0°/90°. Un représentant G053 de
chacune des cinq actions complexes est rendu à la première frame et au milieu
du clip dans la preview du studio. TypeScript et les empreintes des fichiers
publiés sont vérifiés. Les cibles articulaires ne garantissent pas un contact
parfait des surfaces des mains pour toutes les morphologies.

La sélection `scripts/interx_priority_selection.json` ajoute 91 duos (182 GLB),
sur les sessions du catalogue initial de 218 duos : affection, aide/détente,
jeux et danse. Les binômes sont choisis avec les modèles SMPL-X selon leur
proximité de la taille des avatars, sans ajouter de répétitions G pour un même A/T.

```bash
env ALSOFT_DRIVERS=null blender -noaudio --background --python-exit-code 1 --python scripts/convert_interx_duos.py -- --selection scripts/interx_priority_selection.json --hand-motion --draft-manifest scripts/interx_priority_draft_manifest.json
python3 scripts/temp_interx_grounding.py --placement-selection scripts/interx_priority_selection.json --report /tmp/interx-priority-support.json
python3 scripts/temp_interx_priority.py
npm run dev -- --host 127.0.0.1 --port 5178 --strictPort --config scripts/temp_interx_priority_vite.mjs
# Dans un second terminal, avec le serveur provisoire lancé :
ROOM_TEST_URL=http://127.0.0.1:5178 ROOM_VITE_DEPS_BASE=/@fs/tmp/room-interx-priority-vite/deps node scripts/check_interx_motion.cjs --browser-only --manifest scripts/interx_priority_draft_manifest.json --group G053 --actions A025,A026,A027,A028,A035
python3 scripts/temp_interx_priority.py --publish
```

Chaque duo exporté est enregistré dans le manifest provisoire. Relancer la
conversion reprend les fichiers vérifiés. `--draft-manifest` ne modifie pas le
catalogue du studio. La publication vérifie les fichiers, les offsets source,
les doigts, les trajectoires et les orientations retargetées aux trois échelles.

Les interactions debout déjà validées gardent le calage des semelles au sol
avec conservation des poignets. Pour les autres actions, le placement
`source-support-preserve-hands` enregistre les deux hauteurs initiales des
semelles reconstruites avec SMPL-X et leur plan commun (la plus basse des deux
semelles à la première frame). Les pieds du participant porté conservent ainsi
leur élévation initiale. Cette correction constante conserve le déplacement
vertical de l'animation. L'IK conserve les positions des poignets de
l'animation retargetée avant cette correction de hauteur. Les trajectoires
des poignets SMPL-X ne sont ni enregistrées dans les manifests ni utilisées
pour le calage.

Cette mesure décrit un repère d'appui initial, pas une détection automatique
de chaise ou de table. Les accessoires absents du dataset restent à placer pour
les massages assis ou le bras de fer. Le retargeting conserve les mouvements,
mais ne garantit pas un contact de surface exact entre des morphologies
différentes. Les modèles SMPL-X restent hors du projet ; seuls leurs empreintes
et les mesures nécessaires au placement sont enregistrés.
