# TecTake Sintra — canapé convertible à accoudoirs indépendants

Source : https://www.amazon.fr/dp/B0FFHJ2TVP?th=1.
La galerie existante contient la vue cotée : 157 × 61 × 89 cm en canapé, longueur à plat 183,5 cm, assise à 48 cm, coussin d’assise épais de 7 cm, deux coussins de dossier 53 × 14 × 47 cm. Les dimensions annoncées restent approximatives ; les charnières et coutures sont reconstituées depuis les photos.

Génération : `blender -b --python-exit-code 1 --python scripts/generate-tectake-sintra.py`.
Fichiers : `public/items/armrest-sofa-gris/TectakeSintra.glb` et `.blend`.

Le modèle est centré en X/Z, base à Y=0 dans le GLB ; le parent existant conserve le placement monde du jardin. La résine utilise un échantillon photographique du tressage de la galerie, avec normales embarquées. Les coussins ont des surfaces gonflées, une légère irrégularité, des passepoils et une trame polyester. Structure acier, pieds inclinés avec patins, traverses, sangles arrière et boulons des charnières sont modélisés. Les pièces sont regroupées par racine mobile et matériau : 15 096 triangles et neuf appels de dessin sans ombres.

Le dossier est reculé pour dégager le bord arrière du coussin d’assise ; les coussins de dossier sont repositionnés devant lui. Le générateur vérifie tous les sommets de ces coussins contre le plan avant du dossier incliné : séparation minimale de 0,50 cm pour l’assise et 0,92 cm pour les deux coussins de dossier. La profondeur réelle du modèle inclut ce dégagement, au-delà des 61 cm nominaux de la fiche. Les montants arrière suivent le panneau sur toute sa hauteur, avec des raccords à la structure ; les traverses inférieures utilisent le même acier sombre que les pieds.

Deux actions Blender séparées, `left_flatten` et `right_flatten`, commandent les pivots `ArmLeft` et `ArmRight`. Le composant `ArmrestSofa` remplace l’ancienne géométrie et les textures Canvas procédurales. Il conserve les identifiants communs `sofa-arm-left` / `sofa-arm-right`, les commandes de survol de chaque accoudoir, les ombres, le perchoir d’assise et ceux des accoudoirs. L’aperçu utilise ses états locaux ; la scène lit le store commun. Chaque clip est joué en avant ou en arrière indépendamment. La mesure transmise à `onSize` tient compte de la configuration demandée.

Les huit photos commerciales restent en tête de l’inventaire ; six rendus montrent face, trois-quarts, dos, les deux accoudoirs à plat, gauche seule à plat et droite seule à plat.

Validation : inspection Blender des six vues ; Canvas WebGL isolé pour les deux clips, les quatre combinaisons, les positions intermédiaires et le retour, avec base au sol ; Canvas React isolé pour les commandes réelles gauche/droite et l’absence d’erreurs du composant. TypeScript et compilation validés. Le modèle reste une reconstruction des photos, pas une géométrie CAO fabricant.
