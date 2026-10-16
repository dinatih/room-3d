# Troisième lot : Zumba Fanie, Belly Dance Anna, Salsa Stefanos

Versions `[ESSAI correction]` à comparer aux originaux. Référence non cumulative : candidats du commit `c6c5468f`. Seules les deux rotations des mains changent par rapport à ces candidats. Méthode Bachata : moyenne géodésique symétrique [1,2,1] dans les zones d’alerte des poignets en espace monde, puis retour dans la base locale. Arrêt dès disparition des retours >25° ou convergence numérique. Aucun changement des temps, vitesses, translations XYZ, hauteurs, rotations du bassin, bras ou jambes.

| Animation | Sauts locaux original → premier essai → nouvel essai | Retours main gauche | Retours main droite |
|---|---:|---:|---:|
| zumba-fanie-c3d | 483 → 371 → 110 | 159 → 0 | 77 → 0 |
| bellydance2-anna-cortesi-c3d | 434 → 332 → 126 | 114 → 0 | 70 → 0 |
| salsa-stefanos-c3d | 189 → 135 → 45 | 75 → 0 | 55 → 0 |

Les sauts locaux rapides et les retours des mains en espace monde sont deux mesures différentes. Leur diminution ne garantit ni les appuis ni la qualité visuelle. Les longs mouvements suspects du premier essai restent signalés dans le rapport historique ; aucun autre lissage du corps n’est ajouté.

Les dates et articulations adoucies figurent dans `scripts/npz_following_three.json` (`wrists[].changed`, `history`). Les originaux sont conservés. Aucun extrait supplémentaire ni animation supprimée n’est régénéré.

Tests : invariants binaires hors rotations des mains, dates et translations identiques, positions des poignets/pieds/bassin identiques sur toutes les frames, références originales inchangées par SHA-256. Commande reproductible : `node scripts/temp_npz_resume.cjs following-three`. Avec Vite sur 5193 : ajouter `--browser` pour vérifier chargement et mixeur dans Chromium headless.
