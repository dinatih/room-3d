# Deuxième lot : Reggaeton Vaso, Hip-hop Fanie, Musical Theater Fanie

Versions `[ESSAI correction]` à comparer aux originaux. Référence non cumulative : candidats du commit `c6c5468f`. Seules les deux rotations des mains changent par rapport à ces candidats. Méthode Bachata : moyenne géodésique symétrique [1,2,1] dans les zones d’alerte des poignets en espace monde, puis retour dans la base locale. Arrêt dès disparition des retours >25° ou convergence numérique. Aucun changement des temps, vitesses, translations XYZ, hauteurs, rotations du bassin, bras ou jambes.

| Animation | Sauts locaux original → premier essai → nouvel essai | Retours main gauche | Retours main droite |
|---|---:|---:|---:|
| reggaeton-vaso-01 | 257 → 180 → 97 | 74 → 0 | 58 → 0 |
| hiphop-fanie-c3d | 429 → 336 → 258 | 80 → 2 | 58 → 0 |
| musical-theater-fanie-c3d | 556 → 478 → 349 | 129 → 0 | 63 → 0 |

Les sauts locaux rapides et les retours des mains en espace monde sont deux mesures différentes. Leur diminution ne garantit ni les appuis ni la qualité visuelle. Les longs mouvements suspects du premier essai restent signalés dans le rapport historique ; aucun autre lissage du corps n’est ajouté.

Les dates et articulations adoucies figurent dans `scripts/npz_next_three.json` (`wrists[].changed`, `history`). Les originaux sont conservés. Aucun extrait supplémentaire ni animation supprimée n’est régénéré.

Tests : invariants binaires hors rotations des mains, dates et translations identiques, positions des poignets/pieds/bassin identiques sur toutes les frames, références originales inchangées par SHA-256. Commande reproductible : `node scripts/temp_npz_resume.cjs next-three`. Avec Vite sur 5193 : ajouter `--browser` pour vérifier chargement et mixeur dans Chromium headless.
