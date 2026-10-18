# Premier ajout CMU : gestes du quotidien

Trois prises ajoutées au registre central, dans la catégorie Interactions et la
source CMU / NPZ. Le catalogue CMU passe de 9 à 12 animations.

| Identifiant | Source CMU | Mouvement | Durée |
|---|---|---|---:|
| `cmu-drink-bottle` | `13/13_07_stageii.npz` | Déboucher une bouteille et boire | 12,1 s |
| `cmu-sit-high-stool` | `13/13_01_stageii.npz` | S’asseoir sur un tabouret haut et se relever, deux passages | 19,3 s |
| `cmu-sweep-floor-alt` | `13/13_24_stageii.npz` | Autre prise de balayage, déplacements différents de `13_23` | 33,6 s |

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

Ce script réutilise le convertisseur des gestes quotidiens et génère seulement les
trois nouveaux GLB et leur provenance dans
`public/animations/npz/_metadata/cmu_expansion.json`. L’export des actions actives
évite d’embarquer l’ancienne action salsa du squelette de référence.

Avec Vite sur le port 5193, comparaison de six poses par prise avec le balayage
existant, et contrôle des valeurs et de l’évaluation du squelette à 30 Hz :

```bash
node scripts/preview-cmu-expansion.cjs
xdg-open '/tmp/room-cmu-expansion.png'
```

L’aperçu permet de reconnaître les gestes et de comparer les prises. Il ne valide
pas les contacts avec les objets ni le rendu sur chacun des personnages retargetés.
