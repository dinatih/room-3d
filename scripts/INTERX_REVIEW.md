# Revue Inter-X par lots de 100 duos

## Avancement

Premier passage effectué sur **763 / 763 duos** (1 526 clips), lots 001 à 008.
Tous les enregistrements importés sont couverts, dans l'ordre source : sept
lots de 100 duos et un dernier de 63. Les contrôles de trajectoire ne valident
pas encore tous les contacts au sol ou entre personnages. BEHAVE reste hors
du périmètre de cette revue.

## Lots 005 à 008 — 23 octobre 2026

Les 363 derniers duos ont été contrôlés avec la correction commune du lot 001,
sans nouvelle modification du retargeting ni des GLB.

| Lot | Premier enregistrement | Dernier enregistrement | Duos / clips | Erreur maximale du bassin (cm) |
| --- | --- | --- | --- | --- |
| 005 | G043T006A029R024 | G053T002A013R022 | 100 / 200 | 0,000067485 |
| 006 | G053T002A013R023 | G053T008A035R005 | 100 / 200 | 0,000102274 |
| 007 | G053T008A036R006 | G059T001A011R005 | 100 / 200 | 0,000112393 |
| 008 | G059T001A011R006 | G059T005A039R029 | 63 / 126 | 0,000065342 |

Pour les 726 clips : empreintes NPZ/GLB conformes, durée et nombre d'images
conformes, translations et orientations de toutes les images vérifiées
aux échelles 75/100/150, aucun abaissement initial ajouté, valeurs finies
et résultat identique dans le worker. Aucun nouveau défaut de trajectoire
n'a été détecté. 109 duos conservent la correction de cheville exportée et
254 leurs pieds libres, soit respectivement 248 et 515 sur le catalogue complet.

Les 363 duos ont été échantillonnés dans le navigateur sur Xbot à cinq
instants, avec quatre planches à mi-parcours sous
`/tmp/interx-review-batch-005-contact-sheet.png` à `008-contact-sheet.png`.
Les écarts de contact des poses assises et des portés restent ouverts.
Sur les huit lots, l'erreur maximale de trajectoire mesurée est inférieure
à 0,000126 cm ; cela ne mesure ni le patinage des pieds ni les distances
entre mains et corps.

## Lots 002 à 004 — 23 octobre 2026

Les 300 duos suivants ont été contrôlés avec la correction commune du lot 001,
sans nouvelle modification du retargeting ni des GLB.

| Lot | Premier enregistrement | Dernier enregistrement | Duos / clips | Erreur maximale du bassin (cm) |
| --- | --- | --- | --- | --- |
| 002 | G004T012A030R011 | G022T007A025R002 | 100 / 200 | 0,000125019 |
| 003 | G022T007A025R003 | G030T006A017R006 | 100 / 200 | 0,000066436 |
| 004 | G030T006A018R007 | G043T006A029R023 | 100 / 200 | 0,000080986 |

Les sélections `interx-review-batch-002.json` à `004.json` prolongent le
premier lot dans l'ordre des enregistrements, sans recouvrement.
Pour les 600 clips : empreintes NPZ/GLB conformes, durée et nombre d'images
conformes, translations et orientations de toutes les images vérifiées
aux échelles 75/100/150, aucun abaissement initial ajouté, valeurs finies
et résultat identique dans le worker. `npx tsc --noEmit` passe également.
90 duos conservent la correction de cheville exportée et 210 leurs pieds libres.

Les 300 duos ont été échantillonnés dans le navigateur sur Xbot à cinq
instants. Les trois planches à mi-parcours sont disponibles sous
`/tmp/interx-review-batch-002-contact-sheet.png` à `004-contact-sheet.png`.
Les poses assises et les portés montrent encore des écarts de contact ; les
limites décrites ci-dessous restent ouvertes. Aucun nouveau défaut de
trajectoire n'a été détecté par les contrôles numériques de ces trois lots.

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
Pour reproduire un autre lot, remplacer `--batch 1` / `--interx-batch 1`
par son numéro (1 à 8). Les huit lots couvrent la totalité du catalogue actuel.
