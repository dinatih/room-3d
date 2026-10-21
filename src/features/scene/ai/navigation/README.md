# Navigation au sol

Les instructions désignent une destination ou une interaction. Aucun point de
passage entre pièces n'est déclaré : `VisibilityGraph` calcule le plus court
chemin avec A* sur les contours des obstacles réunis par `polygon-clipping`.

Les déplacements préfèrent 20 cm supplémentaires autour du gabarit physique.
Cette bande est un coût souple : chaque centimètre parcouru coûte
`1 + max(0, 1 - distanceLibre / 20)`. Un passage étroit reste praticable et un
grand détour n'est pas obligatoire. Le graphe propose les sommets des contours
physiques et de confort, ainsi que les projections proches du départ et de la
destination sur les contours de confort. Les connexions physiques et leurs coûts
sont conservés avec le graphe. Les transitions locales d'interaction conservent
le calcul physique pour atteindre leurs coordonnées exactes.
La recherche pondérée évalue les connexions à la demande. Les distances du graphe
physique servent d'estimation admissible pour éviter d'explorer les pièces
séparées par des murs comme si elles étaient accessibles en ligne droite.
Le cache des coûts de confort utilise des lignes triangulaires de doubles,
allouées à la demande : au maximum `8 × N × (N - 1) / 2` octets de coûts pour
`N` sommets, sans entrées `Map` ni nombres encapsulés par paire.
Les vérifications oui/non d'une approche utilisent `canReach` sur le graphe
physique dans le worker ; seule la construction d'un trajet optimise le coût de confort.
Depuis la refonte du 21 octobre, les constructions de graphes, les unions,
les approches et les ancres de duo sont également calculées dans le worker.
Un appelant par image conserve un `NavigationScope` ; une commande asynchrone
attend `resolveNavigation`. Les détails et les commandes de validation actuelles
sont dans `docs/character-runtime-2026-10-21.md` ; les scripts ponctuels cités plus
bas documentent les vérifications historiques. Masquer le décor ne retire pas
ses obstacles et ne suspend pas les personnages.

Les tests de segment limitent leurs vérifications aux obstacles dont la boîte
englobe une partie du segment, en conservant les trous des contours.

Le debug représente la préférence de confort de Native en bleu ; les contours
orange conservent leur signification physique. La marge de collision autour des
meubles vaut le quart du rayon de chaque agent ; le debug orange foncé utilise
la même marge. Validation ciblée :
`node scripts/temp_navigation_comfort.cjs`.

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
- Les gabarits identiques partagent leur identité et leurs caches. Ces caches
  sont faibles : retirer le dernier agent d'un gabarit permet de libérer ses
  graphes. Pour une porte, seules la pose fermée et la dernière pose animée sont
  conservées, jamais l'historique des angles.
- Un objet composé retire ses anciens volumes lorsqu'il rétrécit ou change
  d'identifiant. Désactiver la navigation ou démonter l'objet vide ses entrées.
- `doorRequests.ts` partage les demandes de passage d'une même ouverture (les deux
  battants vitrés partagent la demande, avec une butée indépendante par battant). Le
  mouvement vérifie sa position réelle avant chaque pas ; les poussées manuelles
  restent gérées par les composants de porte.

L'évitement d'un autre agent doit conserver la visibilité du prochain virage.
Si une position déplacée perd cette visibilité, le trajet est recalculé. Une
réservation reste active tant qu'un franchissement est encore prévu, puis se
libère dès que le corps est hors de la fermeture et du débattement des battants.
Avec `ACTOR_AVOIDANCE_SCALE = 0`, les PNJ ne bloquent ni les trajets ni les
destinations et ne produisent aucun évitement latéral. Un rayon nul doit
s'appliquer aux trois mécanismes pour éviter les orbites autour d'une cible
occupée. Le dernier pas atteint exactement le point de passage, même si un
évitement latéral est réactivé. Régression en espace libre :
`node scripts/temp_door_lock_check.cjs` et
`node scripts/test-partial-door-navigation.cjs` (15 trajets).

Lorsque l'évitement est activé, les PNJ sont pris en compte avec leur rayon réduit de moitié. Le
contournement commence quand le segment à venir coupe leur empreinte, avant
le contact. Les bandes bleues restent traversables pour ce détour.
Validation ciblée : `node scripts/temp_freezer_smartobject.cjs --crowd-detour`
(serveur de test sur 5175) : duo au milieu d'un passage, dans les deux sens,
puis deux PNJ venant face à face.
Le contournement des corps mobiles utilise un trajet physique, sans refaire
l'optimisation de confort sur chaque instantané des PNJ. Le trajet statique de
confort reprend dès que le segment initialement occupé redevient libre. Les
collisions physiques sont conservées pendant les deux phases.

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

`protectedDoor` conserve une empreinte corporelle à la position d'interaction,
jusqu'au dégagement explicite. La butée géométrique de chaque battant tient compte
de cette empreinte : une interaction Kallax ne condamne plus toute l'ouverture.
Le graphe utilise l'angle encore autorisé et chaque pas vérifie la pose réelle.
Une porte partiellement ouverte reste traversable si le gabarit du PNJ passe ;
un passage réellement fermé ou trop étroit reste bloquant. L'empreinte reste fixe
pendant l'approche et la sortie, pour éviter de reconstruire les graphes à chaque
image. Aucune attente de fermeture complète n'est ajoutée aux séquences Kallax.

Validation ciblée : `node scripts/test-partial-door-navigation.cjs` (séjour,
double battant, empreinte d'interaction, fermeture réelle et invalidation du cache).
Ajouter `--browser` pour vérifier les positions Kallax dans l'appartement chargé
et 15 trajets simultanés dans le jardin, avec un PNJ immobile à leur cible.

Une destination inaccessible produit un état `BLOCKED` et une explication dans
la console et le debug des trajets. Les aperçus d'inventaire désactivent le
registre de navigation via `NavigationContext`.
Une instruction ignorée ou remplacée reprend à l'image suivante, sans rappel
récursif du contrôleur : un scénario en boucle dont tous les objets sont occupés
doit toujours rendre la main au navigateur.

Régressions mémoire et CPU (comparaison avec le commit précédant ces corrections) :

```bash
git show 9339258d:src/features/scene/ai/navigation/geometry.ts > /tmp/room-navigation-baseline-geometry.ts
git show 9339258d:src/features/scene/ai/navigation/service.ts > /tmp/room-navigation-baseline-service.ts
node --expose-gc scripts/temp_navigation_memory_audit.cjs
```

Le test vérifie le partage des graphes, leur collecte après retrait des gabarits,
les empreintes des portes, les échecs mémorisés, leur reprise et le cycle de vie
des obstacles composés. Avec Vite sur le port 5186 :

```bash
node scripts/temp_kitchen_navigation_check.cjs --browser --occupied-loop
node scripts/temp_kitchen_navigation_check.cjs --browser --occupied-loop --occupied-loop-baseline
node scripts/temp_kitchen_navigation_check.cjs --browser --idle-only --profile
```

Le deuxième test réintroduit uniquement le rappel récursif d'origine dans la
réponse HTTP du contrôleur pour confirmer le débordement de pile initial.
L'audit autonome observe toute la durée prévue ; une attente temporaire ne
constitue pas à elle seule un blocage permanent. Après capture par `--profile`,
`node scripts/temp_navigation_memory_audit.cjs --scene-benchmark` compare les
trajets pondérés et les collisions à l'ancienne version.

Mesures ponctuelles de l'audit du 16 octobre 2026 : cinq vérifications
d'accessibilité passent d'environ 588 ms à 20 ms, avec les mêmes réponses.
La simulation de 15 contrôleurs sur six minutes simulées termine sans blocage
ni exception lors du dernier passage. Après collecte, son tas JavaScript mesure
environ 71 / 77 / 79 / 78 Mo ; les buffers mesurent 543 / 578 / 592 / 582 Mo.
Ces relevés concernent la fixture de navigation, pas la RAM totale de l'app.
Les scénarios étant aléatoires, ils ne constituent pas une comparaison globale
avant/après. Certains trajets statiques de confort prennent encore jusqu'à
environ 1,9 seconde dans ce test ; les captures antérieures ont aussi révélé des
destinations inaccessibles et un placement dans une clôture, signalés `BLOCKED`.

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

Pour vérifier les transitions avec fondu et lissage activés :
`ROOM_TEST_URL=http://localhost:5173 node scripts/temp_posture_transitions.cjs`.
Ce test headless vérifie les clips réels sur Lara, Alex et Gloria, la continuité
du bassin, l'attente de lecture effective et le remplacement d'un scénario.
Il exerce `Character` avec le canapé gris et les toilettes, vérifie que le
personnage se relève devant le meuble et attend si la sortie est bloquée.
Les sorties de lit ne doivent pas repasser par le matelas après le relèvement.
Les captures sont enregistrées dans `/tmp/room-posture-*.png` et
`/tmp/room-toilet-standing.png`.
