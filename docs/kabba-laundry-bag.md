# Cabas rouge MAXI FAMILLE — linge sale

Source : https://maxibazar.fr/sac-multi-usages-xxl-70x53x30cm (réf. 2101000082).
Prix consulté : 5,99 €. La fiche indique un corps de 70 × 53 × 30 cm, mais la photo cotée indique 59 × 50 × 28 cm : cette divergence est conservée dans les notes de l’inventaire.

Le modèle représente une forme souple suspendue par ses deux anses réunies, imprimé photographique MAXI FAMILLE, soufflets plissés et ouverture réelle. Dimensions de la pose : 69,46 × 28,01 × 77,03 cm (anses incluses). Trois photos commerciales précèdent les trois rendus.

Génération : `blender -b --python-exit-code 1 --python scripts/generate-kabba-laundry-bag.py`.
Composant autonome `KabbaLaundryBag`, placement réservé au parent. Les anses se rejoignent à environ 77 cm au-dessus du fond du sac. Contrôles : trois vues Blender, ancrage et textures dans un Canvas WebGL isolé, 4 618 triangles et deux appels de dessin sans ombres. TypeScript et compilation validés.

## Placement final

L’utilisateur a remplacé la tringle par un seul crochet et demandé de conserver la forme existante du sac. Le modèle original reste inchangé ; aucune variante resserrée n’est utilisée.

Un crochet métallique en J avec platine circulaire est fixé à la sous-face de l’étagère (Y=170 cm). Il est du côté droit en regardant le placard depuis la SDB, près de la douche. La position et l’orientation sont gérées uniquement dans `BathroomPlacements.tsx`, avec le composant `SdbLaundryHook` et le sac autonome.

Le crochet est à X=106,2 cm et Z=650,2 cm. Les anses reposent à environ Y=161,2 cm, le fond du sac à 84,2 cm. Le cabas est tourné parallèlement au mur diagonal pour rentrer dans l’angle en conservant sa forme. Contrôle de tous les sommets du modèle dans le repère monde : dégagement minimal 1,01 cm de la cloison côté douche, 0,52 cm du plan arrière des portes et 1,52 cm du mur diagonal. Ces dégagements concernent le sac ; les spécifications de la tringle abandonnée ne s’appliquent plus.
