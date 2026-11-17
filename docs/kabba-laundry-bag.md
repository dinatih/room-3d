# Cabas rouge MAXI FAMILLE — linge sale

Source : https://maxibazar.fr/sac-multi-usages-xxl-70x53x30cm (réf. 2101000082).
Prix consulté : 5,99 €. La fiche indique un corps de 70 × 53 × 30 cm, mais la photo cotée indique 59 × 50 × 28 cm : cette divergence est conservée dans les notes de l’inventaire.

Le modèle représente une forme souple suspendue par ses deux anses réunies, imprimé photographique MAXI FAMILLE, soufflets plissés et ouverture réelle. Dimensions de la pose : 69,46 × 28,01 × 77,03 cm (anses incluses). Trois photos commerciales précèdent les trois rendus.

Génération : `blender -b --python-exit-code 1 --python scripts/generate-kabba-laundry-bag.py`.
Composant autonome `KabbaLaundryBag`, placement réservé au parent. Les anses se rejoignent à environ 77 cm au-dessus du fond du sac. Contrôles : trois vues Blender, ancrage et textures dans un Canvas WebGL isolé, 4 618 triangles et deux appels de dessin sans ombres. TypeScript et compilation validés.

## Placement à confirmer

Demande : sous l’étagère triangulaire à 170 cm, tringle fixe d’environ 70 cm sur supports circulaires, sac suspendu après le support droit avant l’extrémité, tube à 2 cm des parois.

Le modèle architectural actuel place la face Est à X=192 et le départ du plateau à Z=620,2. Le mur diagonal est Z=547+(X-316)×(-0,57735) ; il atteint le mur Est à Z≈618,59, presque au niveau des portes. La tringle ne peut donc pas être supposée parallèle aux portes avec les deux extrémités à 2 cm des murs sans traverser le mur diagonal. L’orientation réelle de la tringle et le côté du sac ont été demandés à l’utilisateur. Aucun placement approximatif n’a été introduit dans la scène en attendant ces précisions.
