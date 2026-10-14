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
`placement.verticalOrigin: "rig-ground"` : seule la composante Y du placement
initial est mise à zéro pour les rigs de même taille. Le `start_offset` source
reste intact, X/Z et les déplacements verticaux animés restent conservés.
Ce réglage par duo est conservé lors des réexports ; les autres duos utilisent
leur offset source complet.

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

`public/animations/npz/interx/animations_manifest.json` est l'index public des
paires disponibles. Une copie identique est générée dans
`src/features/scene/animations/animations_manifest.json` pour l'import JSON
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
