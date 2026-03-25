# Game Ideas — room-3d

## Escape game
Chercher des objets cachés dans l'appartement, combiner des indices, ouvrir des cadenas.
Infrastructure existante : hover menu, inventoryId, toggles portes/meubles.

## Micromachines
Vue du dessus, voiture miniature qui slalome entre les meubles.
Le plan de l'appart fait une piste naturelle. Physique simple (Rapier/Cannon.js).
Infrastructure existante : minimap top-down, walkmode caméra.

## Cache-cache d'objet
Un objet se téléporte aléatoirement dans la scène, le joueur doit le trouver en walkmode.
Zéro physique, juste `Math.random()` sur les positions existantes.

## Jeu d'architecture
Déplacer/replacer les meubles pour satisfaire des contraintes
(ex : "place le lit face à la fenêtre, la TV visible du canapé").

## Boules / billard
Lancer une balle qui ricoche sur les murs et renverse des objets.

## Jeu de livraison
Amener un colis d'une pièce à l'autre en temps limité, en walkmode.

## Sniper / tir
Cibles qui apparaissent sur les murs, visée en POV.

## Labyrinthe procédural
Les cloisons du couloir/SDB se reconfigurent aléatoirement.

## Time Crisis style
Cover system : appuyer sur une touche pour se mettre à l'abri derrière un meuble.
Ennemis qui apparaissent aux portes/fenêtres, tir en POV, timer par vague.
Infrastructure existante : walkmode POV, toggles portes, objets avec inventoryId.

## Ambiance horreur
Les lumières s'éteignent, des objets bougent seuls, objectif : atteindre la porte.
