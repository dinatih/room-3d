# Mains de Bachata et extraits RnB / Dolphin

## Bachata Vaso

La version acceptée du commit `c6c5468f` est la référence immuable. Seules les rotations locales LeftHand/RightHand sont réécrites pour lisser leurs orientations en espace monde ; bras, avant-bras, doigts, bassin, jambes, translations XYZ, échelles et dates restent identiques octet par octet. Le filtre [1,2,1] symétrique est limité aux zones d’alerte des mains. Le nombre de passes est le premier supprimant les retours angulaires >25°, avec arrêt si l’énergie ne diminue plus. Les rotations rapides monotones ne sont pas assimilées à des vibrations dans le bilan. Les positions des poignets ne sont pas déplacées.

| Main | Retours >25° avant → après | Passes |
|---|---:|---:|
| mixamorig:LeftHand | 68 → 0 | 2 |
| mixamorig:RightHand | 44 → 0 | 1 |

## Trois extraits choisis

Le seuil initial de cinq secondes ne laissait aucun RnB et un seul Dolphin. L’utilisateur a choisi ces trois exceptions précises. Chaque extrait est un fichier GLB autonome, avec ses temps rebases à zéro, ses valeurs de pose et ses translations XYZ conservées dans les coordonnées originales. Aucun recentrage, verrouillage de bassin, fondu, collage ou changement de vitesse. Les extraits ne sont pas rendus bouclables artificiellement : désactiver la boucle pour observer leurs limites naturelles.

| Sélecteur | Passage source | Durée | Alertes rotation / retour |
|---|---|---:|---:|
| randb-anna-cortesi-c3d-clean-01 | 133.700–138.067 s | 4.367 s | 0 |
| yoga-dolphin-pose-or-ardha-pincha-mayurasana-a-clean-01 | 4.200–7.733 s | 3.533 s | 0 |
| yoga-dolphin-pose-or-ardha-pincha-mayurasana-a-clean-02 | 10.900–16.200 s | 5.300 s | 0 |

Les alertes sont définies à 30 Hz : saut >25° sur un os ou excès d’aller-retour >25° sur trois frames. Les deux côtés d’un saut et les trois frames d’un retour sont exclus. Ce critère ne garantit pas la qualité visuelle du retargeting ni les contacts au sol ; les fragments restent à examiner en lecture. Les versions complètes et les originaux ne sont pas supprimés. Les extraits portent uniquement le tag `npz-clean-extract` pour rester hors des tirages IA habituels.

Le JSON `scripts/npz_refinement.json` consigne les masques des mains, les mesures, les références SHA-256 et les passages rejetés. Commandes : `node scripts/temp_npz_resume.cjs refine`, `refine-test` et `refine-browser`.
