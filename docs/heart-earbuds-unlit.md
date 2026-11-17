# Écouteurs cœur rouges sans lumière

Produit Temu 606750782628703 : https://www.temu.com/fr/ecouteurs-g-606750782628703.html

Prix utilisateur : 13 €. Le modèle représente la version rouge des photos, avec deux écouteurs séparés et leur boîtier rouge ouvert, intérieur blanc et contacts dorés. Aucun matériau émissif ni contour LED. L’autre référence 607070992621348 conserve son modèle lumineux et porte le nom « Écouteurs cœur lumineux (rouges) ».

La galerie comprend les six images commerciales avant les trois rendus. La photo cotée annonce 6 cm de large et 4,3 cm de haut pour le boîtier ouvert ; les autres proportions restent une reconstitution depuis les photos. L’enveloppe présentée avec les écouteurs disposés devant le boîtier est de 6,55 × 8,15 × 4,44 cm, utilisée dans l’inventaire.

Génération : `blender -b --python-exit-code 1 --python scripts/generate-heart-earbuds-unlit.py`.
Le script réutilise les helpers de matériaux, de regroupement et de rendu hors ligne des accessoires de nettoyage. Les quatre matériaux sont regroupés dans un seul maillage. Contrôle visuel des trois vues Blender et import WebGL isolé : 6 652 triangles, quatre appels de dessin sans ombres.

Les corps intra-auriculaires et les embouts sont sous la face en cœur, orientés vers le bas. L’ensemble repose sur le bureau 2, à gauche du téléphone (position locale du groupe d’accessoires : 12, 0, 4 cm). Il suit les déplacements et changements de hauteur du bureau.

Le dos de chaque écouteur forme une pyramide effilée depuis la face en cœur jusqu’à l’embout souple. Aucun corps sphérique : le script contrôle par projection que tous les sommets des embouts restent masqués par le cœur en vue de face.
