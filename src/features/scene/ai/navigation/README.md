# Navigation au sol

Les instructions désignent une destination ou une interaction. Aucun point de
passage entre pièces n'est déclaré : `VisibilityGraph` calcule le plus court
chemin avec A* sur les contours des obstacles réunis par `polygon-clipping`.

- `architecture.ts` dérive les murs, piliers et clôtures de `wallData.ts`, et les
  limites du sol des dimensions également utilisées par le rendu.
- `NavigationObstacle` mesure les meubles rendus et suit leur matrice monde.
  `compound` conserve les espaces entre plusieurs volumes ; `hull` utilise
  l'enveloppe des sommets pour les objets obliques comme la trottinette.
- `profiles.ts` mesure le corps humain en pose de référence. Les obstacles sont
  dilatés selon le rayon de chaque agent ; leurs hauteurs permettent au chien
  de passer sous les obstacles qui ne touchent pas son gabarit.
- `service.ts` conserve les graphes tant que la géométrie est inchangée. Pendant
  une transition de meuble, l'agent attend si son segment devient dangereux,
  puis recalcule avec la géométrie finale.
- `doorRequests.ts` réserve chaque battant dans l'ordre des demandes. Le
  mouvement vérifie sa position réelle avant chaque pas ; les poussées manuelles
  restent gérées par les composants de porte.

Une approche reste dans l'espace libre accessible depuis l'agent. Seule la
transition d'interaction peut ignorer le meuble utilisé, en conservant les
collisions avec les murs, les portes et les autres meubles. Les deux moitiés du
lit double ont un propriétaire commun. Les coordonnées locales des interactions
suivent les transformations des meubles.

Une destination inaccessible produit un état `BLOCKED` et une explication dans
la console et le debug des trajets. Les aperçus d'inventaire désactivent le
registre de navigation via `NavigationContext`.

Les contours arrondis sont approximés conservativement avec une erreur maximale
de 1 mm. Les coordonnées des opérations booléennes sont quantifiées pour éviter
les ambiguïtés numériques sur les arêtes CAD coïncidentes.

Validation : `node scripts/temp_kitchen_navigation_check.cjs` ; ajouter
`--browser` avec un serveur Vite et éventuellement `ROOM_TEST_URL` pour vérifier
la scène réelle, les portes, la cuisine, la douche et les lits déplacés.
