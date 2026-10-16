# Olivia : seconde passe poignets et chevilles

Référence immuable : `27f81eed`. Modification des quatre rotations terminales seulement. Détection des retours angulaires >25° sur trois frames à 30 Hz, moyenne géodésique symétrique locale, arrêt à disparition des retours ou convergence. Les poignets rapides sans aller-retour restent intacts.

Pieds : orientation neutre tirée du squelette de référence, cap horizontal conservé. Poids d’appui obtenu par séparation en deux groupes des hauteurs de cheville et des vitesses horizontales de chaque prise ; transition continue entre centres des groupes. Les pieds bas et lents sont redressés en priorité, les pieds hauts/rapides sont préservés hors correction de vibration. Les orteils changent donc intentionnellement de position pour corriger la flexion. Leur pivot ne descend pas sous Y=0, ou sous sa hauteur originale si elle était déjà négative. La force est réduite si le redressement augmente les alertes de retour. Ces heuristiques d’appui restent à valider visuellement et ne constituent pas une détection de contact de la semelle du personnage retargeté.

| Animation | Articulation | Retours avant → après |
|---|---|---:|
| happy-dance-olivia | mixamorig:LeftHand | 1 → 0 |
| happy-dance-olivia | mixamorig:RightHand | 4 → 0 |
| happy-dance-olivia | mixamorig:LeftFoot | 16 → 15 |
| happy-dance-olivia | mixamorig:RightFoot | 3 → 3 |
| excited-dance-olivia | mixamorig:LeftHand | 0 → 0 |
| excited-dance-olivia | mixamorig:RightHand | 8 → 0 |
| excited-dance-olivia | mixamorig:LeftFoot | 13 → 6 |
| excited-dance-olivia | mixamorig:RightFoot | 8 → 5 |
| pleased-dance-olivia | mixamorig:LeftHand | 0 → 0 |
| pleased-dance-olivia | mixamorig:RightHand | 0 → 0 |
| pleased-dance-olivia | mixamorig:LeftFoot | 7 → 2 |
| pleased-dance-olivia | mixamorig:RightFoot | 4 → 4 |

Cadence, temps, translations XYZ, autres rotations et extrémités du clip préservés. Contrôle binaire et vérification des pivots bassin/poignets/chevilles sur chaque frame, et de la limite de hauteur des orteils. Dates exactes, amplitudes, poids d’appui et mesures dans `scripts/npz_olivia_distal.json`. Commande : `node scripts/temp_npz_resume.cjs distal` ; ajouter `--browser` pour contrôler le chargement et le mixeur avec Vite sur 5193. Les versions `[ESSAI correction]` sont mises à jour ; les originaux restent disponibles. Validation visuelle requise.
