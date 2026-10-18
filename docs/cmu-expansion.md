# Ajouts CMU : gestes du quotidien et séquences mixtes

Les 17 prises évoquées lors de l’analyse sont ajoutées au registre central : un
premier lot de 3, puis les 14 autres prises disponibles. Le catalogue CMU passe de
9 à 26 animations. Les gestes du quotidien sont dans la catégorie Interactions ;
les deux séquences mixtes sont dans la catégorie des gestes et émotions. La source
est CMU / NPZ.

| Identifiant | Source CMU | Mouvement | Durée |
|---|---|---|---:|
| `cmu-drink-bottle` | `13/13_07_stageii.npz` | Déboucher une bouteille et boire | 12,1 s |
| `cmu-sit-high-stool` | `13/13_01_stageii.npz` | S’asseoir sur un tabouret haut et se relever, deux passages | 19,3 s |
| `cmu-sweep-floor-alt` | `13/13_24_stageii.npz` | Autre prise de balayage, déplacements différents de `13_23` | 33,6 s |

Les 14 prises du second lot :

| Identifiant | Essai CMU | Mouvement |
|---|---|---|
| `cmu-drink-bottle-recap` | `13_08` | Déboucher, boire et reboucher la bouteille |
| `cmu-drink-soda` | `13_09` | Boire un soda |
| `cmu-sit-high-stool-02` | `13_02` | S’asseoir sur un tabouret haut et se relever, prise 2 |
| `cmu-sit-high-stool-03` | `13_03` | S’asseoir sur un tabouret haut et se relever, prise 3 |
| `cmu-sit-stool-chin-hand` | `13_04` | Tabouret bas, menton dans la main |
| `cmu-sit-stool-fidget` | `13_05` | Tabouret bas, s’agiter et se relever |
| `cmu-sit-stool-elbow-out` | `13_06` | Tabouret bas, mains au menton, coude écarté, se relever |
| `cmu-clean-windows-21` | `13_21` | Laver les vitres, autre prise |
| `cmu-clean-windows-22` | `13_22` | Laver les vitres, autre prise |
| `cmu-sweep-floor-25` | `13_25` | Balayer le sol, autre prise |
| `cmu-climb-ladder-33` | `13_33` | Monter une échelle, prise 33 |
| `cmu-climb-ladder-34` | `13_34` | Monter une échelle, prise 34 |
| `cmu-everyday-dance-boxing-04` | `15_04` | Séquence complète : ménage, gestes, danse et boxe (187,9 s) |
| `cmu-everyday-dance-boxing-05` | `15_05` | Séquence complète : ménage, gestes, danse et boxe (191,2 s) |

Les séquences du sujet 15 enchaînent plusieurs activités dans le même clip. Leurs
libellés indiquent ce mélange ; elles portent uniquement le tag `mixed-sequence`
pour éviter de sélectionner une prise entière sur un tag de ménage ou de boxe.
Les durées, fichiers et sources exactes figurent dans les
métadonnées JSON. Le sujet 14 mentionné dans l’index CMU est absent du dossier local.

Les mouvements complets sont conservés, avec leurs translations et variations de
hauteur. Aucun lissage, verrouillage du bassin ou rognage automatique n’est appliqué.
La lecture se fait une seule fois : les extrémités de ces prises ne forment pas
des boucles continues. Les objets tenus et le tabouret ne sont pas inclus dans les
captures ; leur placement et les contacts avec le personnage restent à régler
pour une interaction avec le mobilier de la scène.

Conversion reproductible depuis la racine du dépôt :

```bash
blender --background --python scripts/temp_cmu_expansion.py -- --convert
```

Ce script réutilise le convertisseur des gestes quotidiens et génère les
17 GLB de cette sélection et leur provenance dans
`public/animations/npz/_metadata/cmu_expansion.json`. L’export des actions actives
évite d’embarquer l’ancienne action salsa du squelette de référence.

Pour ne convertir qu’une sélection, ajouter par exemple
`--trials 13_08 13_09` après `--convert`. Les métadonnées des autres prises sont
conservées. La conversion du second lot n’a pas réexporté le premier lot.

Avec Vite sur le port 5193, aperçu de six poses par prise et contrôle des valeurs,
des durées, de la présence dans le catalogue et de l’évaluation du squelette à 30 Hz :

```bash
node scripts/preview-cmu-expansion.cjs
xdg-open '/tmp/room-cmu-expansion-1.png'
xdg-open '/tmp/room-cmu-expansion-2.png'
xdg-open '/tmp/room-cmu-expansion-3.png'
xdg-open '/tmp/room-cmu-expansion-4.png'
xdg-open '/tmp/room-cmu-expansion-5.png'
```

L’aperçu permet de reconnaître les gestes et de comparer les prises. Il ne valide
pas les contacts avec les objets ni le rendu sur chacun des personnages retargetés.
Le rapport technique est écrit dans `/tmp/room-cmu-expansion-report.json`.

Validation du second lot : `npx tsc --noEmit` et `git diff --check` réussis ; les
17 GLB de la sélection passent le contrôle navigateur (catalogue, clip unique,
durées et transformations finies sur toute la lecture à 30 Hz). Les cinq planches
ont été examinées. Les trois GLB du premier lot sont inchangés.
