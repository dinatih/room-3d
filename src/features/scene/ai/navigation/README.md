# Navigation au sol

## Réseau permanent

`NavigationMesh` soustrait les obstacles au sol praticable, triangule l'espace
libre, fusionne les triangles voisins dont la réunion reste convexe et relie les
cellules par leurs arêtes communes. La fusion conserve exactement les contours,
les trous et les passages, sans changer les marges de collision ni plafonner le
nombre de sommets par cellule. Les composantes connexes
sont calculées une fois. L'accessibilité consulte ces composantes ; un trajet
cherche uniquement parmi les cellules voisines, puis le funnel réduit le
corridor de passages en points de marche.

La construction et les opérations booléennes restent dans le worker. Le réseau
sérialisé est ensuite partagé avec le moteur des personnages : les trajets et
les vérifications d'accessibilité ordinaires sont immédiats et ne demandent
aucun aller-retour au worker. Les approches et les dégagements consultent aussi
ce réseau et ses empreintes déjà préparées. Seuls la construction des réseaux
et les placements de duo restent des requêtes géométriques asynchrones.

Un gabarit prépare son réseau dès son enregistrement, avant son premier trajet.
Une approche prépare aussi le réseau d'entrée dans son meuble pendant la marche.
Les gabarits identiques partagent leurs instantanés. Le dernier agent qui quitte
un gabarit libère ses ressources. Un `NavigationScope` conserve l'instantané
pendant une requête asynchrone, même si d'autres acteurs remplacent le cache.
Les dimensions sont arrondies vers l'extérieur sur la grille géométrique commune
pour partager les réseaux malgré les écarts flottants des modèles identiques.
Si le départ devient inaccessible dans une ancienne pose de porte, l'approche
consulte la géométrie actuelle avant de refuser la destination. Les changements
de porte restent pris en compte pendant le mouvement d'un autre meuble.

## Collisions et confort

Les obstacles conservent leurs trous et les passages étroits. Les dilatations
arrondies utilisent une approximation conservative à 1 cm près : elles ne
réduisent jamais le rayon de navigation, mais peuvent ajouter jusqu'à 1 cm de marge.
Cette tolérance simplifie les contours sans arrondir les positions des PNJ.
Les contacts physiques des battants utilisent 1 mm pour préserver les petits jeux
autour des portes fermées, indépendamment des contours de navigation.
Le rayon horizontal de navigation est unique : `NAVIGATION_RADIUS_CM = 6`, pour
les autres PNJ, murs, meubles, battants, protections d'interaction et dégagements
des portes. Les portes n'ajoutent aucune marge au gabarit des PNJ. Leurs butées
contre les meubles conservent leur marge mécanique. Le rayon du modèle reste
une mesure visuelle, sans imposer la largeur des passages. Les hauteurs excluent
les volumes qui ne rencontrent pas le corps. Les limites du sol sont des
barrières ; un trajet ne peut pas traverser un vide entre deux surfaces.

La préférence de confort est de 20 cm : les extrémités des passages sont
resserrées dans leur espace libre, sans dépasser la moitié de leur largeur.
Un passage étroit reste donc ouvert. Ce choix remplace l'ancienne optimisation
globale du coût de proximité ; le trajet ne prétend plus minimiser cette
intégrale sur tous les contours de l'appartement.

Chaque pas reste contrôlé avec la géométrie réelle, les battants et les autres
acteurs. Un contournement en préparation laisse avancer les pas encore libres ;
sa publication conserve le pas déjà contrôlé. Les tangentes aux PNJ utilisent
la même précision numérique que les contours du planificateur.
Les contours de sortie d'un chevauchement gardent le départ libre après l'arrondi
du worker ; les contrôles des tangentes utilisent cette même borne d'erreur.
Si aucun détour ne permet le croisement, un PNJ peut revenir au début de son
approche pour libérer le passage, selon une priorité stable entre identifiants.
Ce recul suit un vrai chemin contrôlé avant de reprendre la destination initiale.
Un détour terminé est renouvelé si les acteurs qui bloquent le trajet ont bougé ;
un calcul en cours termine son instantané avant ce renouvellement.
Les pièces pleines deviennent des obstacles de transit : le trajet peut utiliser
le jardin et les couloirs du bâtiment. Une destination pleine conserve son attente,
et les occupants déjà à l'intérieur peuvent sortir.
Les portes sont demandées dès qu'elles apparaissent dans le corridor
à venir, avant l'entrée dans la zone de rotation du battant, et restent réservées
tant que le trajet les traverse, puis jusqu'au dégagement du corps. Une porte fermée
n'est jamais traversée avant son ouverture effective.

## Mobilier et actions

Les points duo libres vérifient l'ancre et les positions des deux participants
pour toute la playlist avant de réserver les places. Un changement de clip ne
doit pas laisser un participant dans un obstacle à la fin de la séquence.

Les transformations animées restent des obstacles actifs, même avec le décor
masqué. Pendant un déplacement de meuble, un trajet libre continue ; un segment
réellement coupé s'arrête. La pose stabilisée prépare un nouvel instantané. Les
trajets existants sont conservés si leurs segments restent sûrs.

Les interactions peuvent entrer dans leur propre meuble en conservant les autres
collisions. Une instruction retrouve le meuble à quitter depuis sa position
réelle avant de résoudre l'activité suivante. Les entrées animées sont déclarées
explicitement sur les slots via `entryAnimation` et suivent la lecture effective
de l'animation en conservant les collisions.

Pour les rangements cuisine concernés : approche avec le mobilier en place,
`PREPARE_OBJECT`, attente de la fin du dégagement de la poubelle et de la chaise,
approche finale, gestes, puis départ avant restitution du mobilier. Réserver un
slot ou commencer un trajet ne déclenche pas ce dégagement. Les autres gestes
d'ouverture restent associés à leurs instructions d'interaction.

## Validation et mesures

`pathfindingStats.timings` distingue calcul local, file du worker, calcul du
worker, échanges et reprise du contrôleur. Une préparation terminée avant sa
première utilisation n'est pas comptée comme une attente du personnage.
Ces métriques n'incluent pas de seuil
qui masquerait une attente. `Sad Idle` indique une attente de navigation ;
`Thinking` indique un clip encore en préparation.

## Journaux de diagnostic en développement

Chaque document reçoit une session UUID, conservée pendant HMR. Un rechargement
crée un nouveau fichier `/tmp/room-3d-logs/<date>_<session>.jsonl` ; `latest.jsonl`
pointe vers le dernier chargement, sans effacer les sessions précédentes.
Chaque ligne conserve l'URL, le navigateur, la séquence d'émission et le temps
écoulé depuis le début du document. L'en-tête indique le commit et les fichiers
modifiés. Les exceptions, rejets de promesses et messages console warn/error
sont conservés avec stack et cause, y compris la reproduction du funnel.

Les événements `nav_graph_created` et `nav_graph_geometry` contiennent la
géométrie et ses propriétaires. `nav_path` conserve les chemins et distingue un
départ invalide d'une cible invalide. Les événements `nav_job_*` relient le job
et le graphe aux temps de file, calcul, livraison et consommation. Les approches
enregistrent leurs candidats, empreintes d'acteurs et résultat de sélection.
Une époque UUID distingue aussi les numéros de graphes réinitialisés par HMR.

`glassDoor` décrit les consignes des battants, leur coordination et le volet dans
les arrêts et instantanés. `leaves` précise les segments bloqués et `limits.contacts`
les meubles ou protections d'interaction qui limitent l'ouverture ; les demandes
et protections nomment les PNJ concernés dans `requests`.

`nav_stop` et `nav_stop_end` encadrent chaque arrêt et sa durée. Une fois par
seconde, `nav_agent_snapshot` conserve instruction, position, animation, absence
de progression, déploiement, trajet, attente et état du contournement. `nav_world`
enregistre positions et réservations des autres acteurs, gabarits, rayons réels
d'évitement, mobilier, angles et demandes de portes, capacités des pièces et
file du worker. `page_heartbeat` continue même lorsque le rendu est arrêté :
son rapprochement avec les traces des agents permet de repérer un moteur figé
ou suspendu. Ces détails sont écrits dans les fichiers, sans remplir la console UI.

```bash
tail -F /tmp/room-3d-logs/latest.jsonl
node scripts/analyze-navigation-logs.cjs
node scripts/analyze-navigation-logs.cjs /tmp/room-3d-logs/<session>.jsonl
```

## Tests

```bash
npm test
npx tsc --noEmit
npm run test:studio -- --case=solo-xbot-doors,locomotion-twenty-seven,living-kallax,closed-door,kitchen-access --hardware-gpu
```

Le cas solitaire désactive animaux et robots, attend la fin des travaux de
fond, vérifie chaque destination et refuse une pause de calcul sur le réseau
préparé. Le cas cuisine utilise un contrôleur, les clips et les meubles réels.
Les tests unitaires couvrent les sols concaves, les trous, les composantes
déconnectées, le funnel, la sérialisation et l'accessibilité physique.
