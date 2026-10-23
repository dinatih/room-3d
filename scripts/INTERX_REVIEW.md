# Revue Inter-X par lots de 100 duos

## Lot 001 — premier passage, 23 octobre 2026

100 duos / 200 clips sur 763 duos, sélection figée dans
`interx-review-batch-001.json`, triée par enregistrement source :
`G001T000A000R000` à `G004T012A030R010`. Il reste 663 duos à examiner.

### Correction et mesures

Le retargeting métrique abaissait chaque participant indépendamment quand
un os Foot/Toe dépassait 10 cm à la première image, avec une exception
basée sur le nom A025. Cela ajoutait un décalage constant de −14,07 à
−46,99 cm à 23 des 200 clips. Ce calcul utilisait les os du modèle source,
pas les semelles du personnage cible. Suppression de cette heuristique :
le bassin initial reste à son origine prévue et la trajectoire NPZ est conservée.
La correction est commune au mode `world-meters`, également utilisé par BEHAVE ;
les 663 autres duos Inter-X et BEHAVE ne sont pas validés par ce lot.

Vérifications du lot :

- Empreintes des 200 GLB et NPZ conformes au manifeste ; P1/P2 synchronisés.
- Toutes les images comparées aux translations et orientations NPZ originales,
  aux échelles 75, 100 et 150 ; erreur maximale de translation : 0,0001151 cm.
- Aucun décalage initial ajouté ; valeurs finies et égalité avec le worker.
- Lecture navigateur des 100 duos Xbot, échantillonnage à cinq instants et
  planche à mi-parcours ; ce contrôle ne mesure pas les contacts sur toute la durée.
- Les 49 duos marqués `heel-support-envelope-v1` gardent leurs corrections
  de cheville exportées ; les 51 autres gardent leurs pieds libres.

### Limites à traiter avant de déclarer les appuis validés

Les poses assises, portés, massages et renversements demandent une vérification
des contacts spécifique. Le manifeste contient des mesures d'appui SMPL-X,
mais le runtime ne les applique pas ; `offsetB` ignore aussi la composante Y
du décalage initial source. Supprimer l'abaissement arbitraire ne résout pas
ces défauts. Les proportions différentes peuvent encore décaler mains et
pieds. Ne pas plaquer systématiquement les pieds au sol pendant un porté.
Ce lot valide les trajectoires, pas l'absence de patinage, de flottement ou
d'interpénétration sur tous les personnages.

### Reproduire et continuer

```bash
python scripts/review_interx_batch.py --batch 1
node scripts/check-interx-review.cjs --batch 1
ROOM_TEST_URL=http://127.0.0.1:5173 node scripts/check-miley-duos.cjs --interx-batch 1
```

Les références NPZ et rapports sont écrits dans `/tmp/interx-review-batch-001-*`.
Le navigateur utilise le lanceur headless commun au projet. La planche est
`/tmp/interx-review-batch-001-contact-sheet.png`.
Pour le prochain lot, remplacer `--batch 1` / `--interx-batch 1` par `2`.
