# Navigation au sol

Les instructions désignent une destination ou une interaction. Aucun point de
passage entre pièces n'est déclaré : `VisibilityGraph` calcule le plus court
chemin avec A* sur les contours des obstacles réunis par `polygon-clipping`.

- `architecture.ts` dérive les murs, piliers et clôtures de `wallData.ts`, et les
  limites du sol des dimensions également utilisées par le rendu.
- `NavigationObstacle` mesure les meubles rendus et suit leur matrice monde.
  `compound` conserve les espaces entre plusieurs volumes ; `hull` utilise
  l'enveloppe des sommets pour les objets obliques comme la trottinette.
  `solidOnly` utilise les maillages marqués `navigationSolid`, par exemple le
  pot du palmier, pour que son feuillage flexible ne forme pas un mur.
- `profiles.ts` mesure le corps humain en pose de référence. Les obstacles sont
  dilatés selon le rayon de chaque agent ; leurs hauteurs permettent au chien
  de passer sous les obstacles qui ne touchent pas son gabarit.
- `service.ts` conserve les graphes tant que la géométrie est inchangée. Pendant
  une transition de meuble, l'agent attend si son segment devient dangereux,
  puis recalcule avec la géométrie finale.
- `doorRequests.ts` réserve chaque ouverture dans l'ordre des demandes (les deux
  battants vitrés partagent une réservation). Le
  mouvement vérifie sa position réelle avant chaque pas ; les poussées manuelles
  restent gérées par les composants de porte.

L'évitement d'un autre agent doit conserver la visibilité du prochain virage.
Si une position déplacée perd cette visibilité, le trajet est recalculé. Une
réservation reste active tant qu'un franchissement est encore prévu, puis se
libère dès que le corps est hors de la fermeture et du débattement des battants.

Une approche reste dans l'espace libre accessible depuis l'agent. Seule la
transition d'interaction peut ignorer le meuble utilisé, en conservant les
collisions avec les murs, les portes et les autres meubles. Les deux moitiés du
lit double ont un propriétaire commun. Les coordonnées locales des interactions
suivent les transformations des meubles.

Les actions debout (`arrival: 'approach'`), les rangements et les destinations
extérieures trouvent la position libre accessible la plus proche de leur point
préféré. Un slot peut désigner son `navigationOwner` physique dans un objet
composé, comme le four posé sur le Kallax cuisine. Les attentes conservent la
position atteinte, sans replacer l'agent au point brut de l'interaction.

`closedDoor` réserve une ouverture fermée pendant une action à proximité du
battant, puis jusqu'au dégagement explicite. Les autres demandes de passage
attendent dans la même file ; le graphe et le mouvement utilisent alors la pose
fermée pour cette ouverture et vérifient toujours la pose réelle du battant.

Une destination inaccessible produit un état `BLOCKED` et une explication dans
la console et le debug des trajets. Les aperçus d'inventaire désactivent le
registre de navigation via `NavigationContext`.

Les contours arrondis sont approximés conservativement avec une erreur maximale
de 1 mm. Les coordonnées des opérations booléennes sont quantifiées pour éviter
les ambiguïtés numériques sur les arêtes CAD coïncidentes.

Validation : `node scripts/temp_kitchen_navigation_check.cjs` ; ajouter
`--browser` avec un serveur Vite et éventuellement `ROOM_TEST_URL` pour vérifier
la scène réelle, les portes, la cuisine, la douche et les lits déplacés.
`--browser --doors-only` vérifie les files à la porte-fenêtre dans les deux sens
et les croisements, avec l'évitement des autres personnages activé.
`--browser --idle-only` suit 15 contrôleurs autonomes pendant deux minutes
simulées ; `--browser --cases-only` vérifie huit interactions qui provoquaient
des blocages. Ces tests désactivent le lissage d'origine, le crossfade et les
transitions de posture.
