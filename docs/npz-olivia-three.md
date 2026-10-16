# Dernier lot initial : Happy, Excited et Pleased Dance Olivia

Une seconde passe ciblant poignets, chevilles et flexion des pieds en appui a depuis mis à jour les trois essais. Voir `docs/npz-olivia-distal.md` et `scripts/npz_olivia_distal.json` pour les mesures actuelles. Le tableau ci-dessous décrit la première passe.

Versions `[ESSAI correction]` à comparer aux originaux. Référence non cumulative : candidats du commit `c6c5468f`. Seules les deux rotations des mains changent par rapport à ces candidats. Méthode Bachata : moyenne géodésique symétrique [1,2,1] dans les zones d’alerte des poignets en espace monde, puis retour dans la base locale. Arrêt dès disparition des retours >25° ou convergence numérique. Aucun changement des temps, vitesses, translations XYZ, hauteurs, rotations du bassin, bras ou jambes.

| Animation | Sauts locaux original → premier essai → nouvel essai | Retours main gauche | Retours main droite |
|---|---:|---:|---:|
| happy-dance-olivia | 585 → 466 → 328 | 108 → 1 | 108 → 4 |
| excited-dance-olivia | 499 → 417 → 239 | 96 → 0 | 101 → 8 |
| pleased-dance-olivia | 422 → 326 → 239 | 81 → 0 | 72 → 0 |

Les sauts locaux rapides et les retours des mains en espace monde sont deux mesures différentes. Leur diminution ne garantit ni les appuis ni la qualité visuelle. Les longs mouvements suspects du premier essai restent signalés dans le rapport historique ; aucun autre lissage du corps n’est ajouté.

Les dates et articulations adoucies figurent dans `scripts/npz_olivia_three.json` (`wrists[].changed`, `history`). Les originaux sont conservés. Aucun extrait supplémentaire ni animation supprimée n’est régénéré.

Tests : invariants binaires hors rotations des mains, dates et translations identiques, positions des poignets/pieds/bassin identiques sur toutes les frames, références originales inchangées par SHA-256. Commande reproductible : `node scripts/temp_npz_resume.cjs olivia-three`. Avec Vite sur 5193 : ajouter `--browser` pour vérifier chargement et mixeur dans Chromium headless.
