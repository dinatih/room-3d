# Navigation au sol

## Réseau permanent

`NavigationMesh` soustrait les obstacles au sol praticable, triangule l'espace
libre et relie les cellules par leurs arêtes communes. Les composantes connexes
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

## Collisions et confort

Les obstacles conservent leurs trous et les passages étroits. Les dilatations
physiques utilisent le rayon du corps pour les murs et son quart pour les
meubles, comme les empreintes représentées par le debug. Les hauteurs excluent
les volumes qui ne rencontrent pas le corps. Les limites du sol sont des
barrières ; un trajet ne peut pas traverser un vide entre deux surfaces.

La préférence de confort est de 20 cm : les extrémités des passages sont
resserrées dans leur espace libre, sans dépasser la moitié de leur largeur.
Un passage étroit reste donc ouvert. Ce choix remplace l'ancienne optimisation
globale du coût de proximité ; le trajet ne prétend plus minimiser cette
intégrale sur tous les contours de l'appartement.

Chaque pas reste contrôlé avec la géométrie réelle, les battants et les autres
acteurs. Les portes sont demandées dès qu'elles apparaissent dans le corridor
à venir et restent réservées jusqu'au dégagement du corps. Une porte fermée
n'est jamais traversée avant son ouverture effective.

## Mobilier et actions

Les transformations animées restent des obstacles actifs, même avec le décor
masqué. Pendant un déplacement de meuble, un trajet libre continue ; un segment
réellement coupé s'arrête. La pose stabilisée prépare un nouvel instantané. Les
trajets existants sont conservés si leurs segments restent sûrs.

Les interactions peuvent entrer dans leur propre meuble en conservant les autres
collisions. Une instruction retrouve le meuble à quitter depuis sa position
réelle avant de résoudre l'activité suivante. Les sorties de posture suivent la
lecture effective de l'animation et attendent si leur dégagement est obstrué.

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
