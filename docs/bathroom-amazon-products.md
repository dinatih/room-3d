# Produits Amazon — salle de bains

Fiches consultées dans le Chrome connecté de l’utilisateur le 18 novembre 2026.
Prix d’achat ponctuel affichés, hors abonnement, remises conditionnelles et livraison.
Le prix de l’inventaire est **unitaire** ; les quantités sont celles des objets placés.

| Produit | Prix affiché | Prix unitaire inventaire | Quantité | Source |
| --- | --- | --- | --- | --- |
| AXE Cherry Fizz bille 50 ml | 4,72 € | 4,72 € | 1 | [B0DZP5C14H](https://www.amazon.fr/dp/B0DZP5C14H?th=1) |
| AXE Ultime Cherry Fizz gel douche 2 × 225 ml | 5,06 € / duo | 2,53 € | 2 | [B0GQVLTKB3](https://www.amazon.fr/dp/B0GQVLTKB3?th=1) |
| Signal Integral 8 Nature Elements Coco 75 ml | 1,69 € | 1,69 € | 2 | [B0785FQDJG](https://www.amazon.fr/dp/B0785FQDJG?th=1) |
| Elmex Anti-Caries Blancheur Douce 2 × 75 ml | 8,56 € / duo | 4,28 € | 2 | [B0BFBRPWXV](https://www.amazon.fr/dp/B0BFBRPWXV?th=1) |

Les trois flacons AXE sont posés sur la tablette du placard SDB. Chaque TISKEN
(lavabo et douche) reçoit un Signal et un Elmex. La fiche Signal remplace la
fiche générique « Dentifrice 75 ml » existante pour éviter de compter deux fois
les mêmes tubes.

Les informations et URLs d’images lues dans Chrome sont enregistrées dans
`scripts/bathroom-amazon-products.json`. Les huit photos de chaque fiche sont
conservées dans le dossier du modèle. Les textes commerciaux sont archivés
tels qu’affichés ; ils ne constituent pas des mesures de géométrie.

Le rouleau bille est construit d’après sa photo avant/arrière. Le gel douche
reprend le corps rouge et le capot noir en V du flacon individuel. Les tubes
comprennent le bouchon strié, l’épaule, le corps souple aplati et la soudure
supérieure. Les UV Signal utilisent les photographies du tube (photos 4 et 5),
ceux d’Elmex la zone du tube de la photo 2. Aucun carton ni emballage de lot
n’est modélisé. Les photos d’origine qui montrent des cartons restent de simples
références dans la galerie de l’inventaire.

Les dimensions hors emballage sont estimées : bille Ø4,5 × 10,7 cm ; gel douche
7,3 × 4 × 15,9 cm ; Signal 4,3 × 2,6 × 18,5 cm ; Elmex 4,3 × 2,6 × 17,7 cm.
Amazon donne notamment 19,5 × 4 × 3,4 cm pour le colis Signal et
17,7 × 3,5 × 7,9 cm pour le duo Elmex : ces dimensions d’emballage ne sont pas
appliquées à chaque tube.

Reproduction :

```bash
python scripts/download-bathroom-amazon-photos.py
blender -b -t 4 --python-exit-code 1 --python scripts/generate-bathroom-amazon-products.py
blender -b -t 4 --python-exit-code 1 --python scripts/check-amazon-bathroom-products.py
npx tsc --noEmit
```
