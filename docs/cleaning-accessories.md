# Accessoires de nettoyage

Génération : `blender -b --python-exit-code 1 --python scripts/generate-cleaning-accessories.py`.

Les photos commerciales locales sont affichées avant les rendus Blender dans l’inventaire.
Sources consultées dans Chrome :

- IKEA PLOGSVÄNG 205.934.54 : https://www.ikea.com/fr/fr/p/plogsvaeng-rangement-blanc-20593454/ — 20 × 15 × 10 cm, 0,49 €.
- Temu 605625769644612, Love Cleaning Sponges 10 Pcs : https://www.temu.com/fr/eponges-coeur-g-605625769644612.html — 4,49 € le lot ; une éponge représentée, dimensions estimées 9 × 8,5 × 3 cm.
- Amazon B0H45FDHR4 rouge : https://www.amazon.fr/dp/B0H45FDHR4?th=1 — prix utilisateur 12 €, dimensions estimées.

Les reconstructions suivent les photos et restent approximatives. Le panier possède des coins courbes et un rebord continu ; le pot arrondi est réellement percé de fentes. Le groupe `BrushLift` contient uniquement la brosse. Le clip `brush_lift` la soulève de 18 cm, puis l’action commune `brush-lift` permet de la ranger en lecture inverse. Le pot reste fixe.

Pour inscrire les noms sur les bouteilles existantes et régénérer leurs rendus :
`blender -b --python-exit-code 1 --python scripts/label-laundry-bottles.py`.
Les textes « Lessive » et « Adoucissant » sont des maillages intégrés aux fichiers exportés.
