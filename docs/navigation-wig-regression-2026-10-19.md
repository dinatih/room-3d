# Navigation et transparence des perruques — 19 octobre 2026

## Navigation : préparation inutile sur le thread principal

Le commit `c90d5157c` du 16 octobre préparait dans le constructeur de
`VisibilityGraph` les distances de tous les sommets à tous les contours physiques.
Ces distances servent à la recherche pondérée de confort, mais pas aux contrôles
d'accessibilité physique des approches. Elles sont maintenant préparées au premier
besoin dans `findComfort`, après les sorties rapides, puis conservées.
Les obstacles physiques et les coûts de trajet restent identiques.

Mesure dans l'appartement réel, navigateur headless sur GPU matériel, trois paires
alternant l'ordre avant/après, 2 111 sommets :

| Construction | Échantillons (ms) | Médiane |
| --- | --- | --- |
| Ancienne préparation immédiate | 24,9 / 24,6 / 16,9 | 24,6 ms |
| Préparation à la demande | 2,0 / 3,1 / 2,3 | 2,3 ms |

Le cas `approach-reachability` reproduit exactement l'ancienne préparation pour
la comparaison. Le test unitaire vérifie que construction, accessibilité et
trajet direct sans pénalité ne calculent aucune de ces distances, et que la
recherche pondérée les prépare une seule fois.

## Perruques : occlusion des texels opaques

Le commit `7c469268` du 19 octobre conserve le mode BLEND des fichiers glTF.
Avec des cartes de cheveux superposées sans écriture de profondeur, une carte
arrière pouvait recouvrir les texels entièrement opaques d'une carte avant.

La correction écrit d'abord la profondeur des seuls texels entièrement opaques
(`alphaTest = 1`), puis dessine la couleur avec son alpha continu d'origine.
La géométrie, le squelette, les morphs et les bornes restent partagés. La passe
couleur utilise `forceSinglePass` et l'ordre transparent normal ; la passe de
profondeur remplace ainsi l'une des deux anciennes passes colorées doubles faces.

Vérification GPU avec deux cartes superposées : le pixel opaque passe du bleu
arrière `[0,0,255,255]` au rouge avant `[255,0,0,255]`. Le pixel semi-transparent
reste exactement `[127,63,191,255]` avant et après.

Contrôle visuel de `white_hair_with_bun` et `white_long_wavy_ponytails`, chacun
sur mannequin et buste Lara, depuis deux angles : disparition de la grande zone
grise traversante. La scène conserve 38 appels de dessin et 125 100 triangles
soumis avant et après. Quelques fines stries sombres restent visibles ; ce test
ne garantit pas le tri parfait de toutes les couches partiellement transparentes.

## Reproduction et validation

```bash
npm test
npx tsc --noEmit
npm run build
npm run test:studio -- --case=approach-reachability,living-kallax,double-kallax --hardware-gpu
node scripts/temp_freeze_diagnosis.cjs --wigs
```

Résultats : 40 tests unitaires, trois scénarios studio et assertions GPU réussis ;
types et build réussis. Le build conserve son avertissement de taille des bundles.

Artefacts locaux de cette exécution :

- `test-results/2026-10-19T20-17-12.012Z-studio/report.json`
- `/tmp/room-wig-depth/result.json`
- `/tmp/room-wig-depth/{before,after}-{front,above}.png`

```bash
xdg-open '/tmp/room-wig-depth/before-front.png'
xdg-open '/tmp/room-wig-depth/after-front.png'
```

Ces mesures isolent un coût récent de navigation et un défaut d'occlusion.
Elles ne constituent ni un profil complet de la scène à 15 PNJ, ni une comparaison
globale avec la version d'il y a une semaine. Elles ne prouvent pas la disparition
de tous les freezes ou la cause des 4,5 Go observés dans les processus Chrome.
