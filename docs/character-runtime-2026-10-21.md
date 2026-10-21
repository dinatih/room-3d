# Personnages : simulation, navigation et animation — 21 octobre 2026

La visibilité du décor ne commande pas la simulation. `debug=characters-only`
masque des groupes de rendu ; les obstacles, les portes, les réservations et
les activités des personnages restent actifs. Le réglage existant de
l'évitement entre personnages (`ACTOR_AVOIDANCE_SCALE = 0`) est conservé.

## Organisation

- `agentController.ts` possède les états de simulation, les instructions et les
  commandes. Le hook `useAgentController` gère uniquement sa durée de vie React.
  Les changements de scénario sont appliqués dans un effet de layout, sans
  modifier les réservations pendant le rendu React.
- Un `CharacterRuntime` par groupe/canvas avance tous les personnages avant
  d'évaluer les poses. La scène publie les positions ; les vues de zones les
  lisent sans écrire dans les positions, les profils ou les références caméra.
- Le worker de navigation prépare les graphes, les unions et marges des
  obstacles, les approches des meubles, l'accessibilité physique, les trajets
  pondérés et les ancres des duos. Le fil principal suit les trajets et contrôle
  les mouvements réels, les battants et les réservations des autres acteurs.
- Le worker d'animation retargete des instantanés des articulations et des
  pistes, sans transférer les géométries et textures. La signature du rig,
  l'animation et son repère de root motion déterminent le partage des clips.
  Chaque instance conserve son propre mixer et ses propres actions.
- Les actions précédentes sont arrêtées après leur fondu, puis leurs bindings
  et leurs clips non utilisés sont libérés. Les clips de base restent prêts.
  Les graphes périmés et les graphes de contournement sont libérés explicitement.

## Attentes et interfaces

`getNavigationGraph` retourne une vue des données préparées par le worker,
sans graphe de recherche mutable sur le fil principal. Une préparation non
terminée produit `NavigationPending`, distinct d'une destination inaccessible.

Le moteur utilise un `NavigationScope` persistant pour conserver les requêtes
et les choix d'une opération interrompue. La reprise ne commit les coordonnées
d'une instruction qu'après leur résolution complète. Les commandes, les
changements de scénario et les déplacements manuels annulent les requêtes
remplacées. Les graphes sont identifiés par leur version ; les trajets vérifient
également leur départ et leur destination.

Une commande d'interface qui utilise la navigation doit attendre
`resolveNavigation(() => opération())`. Les mises à jour par image emploient
un scope persistant ; `followRoute` possède son scope par route. Une erreur
du worker remonte explicitement, sans repli vers une recherche synchrone.

Un contrôleur en déplacement ou entre deux instructions choisit une pose
immobile lorsqu'il ne produit aucune translation. Cette vérification couvre
aussi les retours anticipés pendant un calcul asynchrone : l'ancienne animation
de marche ne doit pas continuer sur place. Le trajet et ses requêtes restent
actifs ; la marche reprend avec le déplacement réel.
L'état d'interaction n'est validé qu'après la résolution de ses coordonnées et
l'initialisation de l'action. Une attente du worker ne peut donc plus laisser
une interaction avec l'ancienne marche et un minuteur non initialisé.
Après une révision de géométrie, les segments restants sont vérifiés dans le
nouveau graphe. Un trajet encore libre est conservé ; un trajet coupé est
recalculé. Les battants réels restent contrôlés à chaque pas. Le confort du
trajet conservé n'est réoptimisé qu'au prochain calcul nécessaire.

Le chargement des sources GLB reste asynchrone via le loader existant. Le
retargeting quitte le fil principal ; les mixers, les transitions ajustées à la
pose réelle et les physiques secondaires restent sur ce fil. La fréquence des
animations, les modèles et la qualité visuelle ne sont pas réduits.

## Contrôles

Validation du correctif de locomotion : 50 tests unitaires et 5 scénarios
navigateur réussis (27 contrôleurs, séjour masqué, double porte, porte fermée,
sortie de posture).
TypeScript et le build de production passent également.

```bash
npx tsc --noEmit
npm test
npm run build
npm run test:studio -- --case=garden-fifteen,locomotion-twenty-seven,living-kallax,living-kallax-hidden,double-kallax,posture-exit,interruption,unreachable,failed-action,approach-reachability --hardware-gpu
node scripts/temp_character_runtime.cjs --label=verify --verify-animation --captures=0 --warmup=5000 --hardware-gpu
node scripts/temp_character_runtime.cjs --label=visibility --counts=0 --verify-navigation --captures=0 --warmup=15000 --hardware-gpu
node scripts/temp_character_runtime.cjs --label=locomotion-after --verify-locomotion --full-scene --locomotion-case --warmup=30000 --duration=60000 --captures=1 --hardware-gpu
```

Les comparaisons de pistes portent sur idle, marche, assise, relèvement et un
duo Inter-X, sur Native, Alex et Gloria : 15 cas, écart maximal nul. Elles
vérifient aussi l'isolation d'une preview réelle. Le contrôle de visibilité
retrouve les mêmes obstacles avant affichage, après affichage et après masquage
du décor (44 obstacles de meubles enregistrés, 2 111 sommets pour le profil du
test). Il ne désactive aucune activité pour obtenir ce résultat.

La régression `locomotion-twenty-seven` avance 27 contrôleurs sur le vrai worker,
invalide leur graphe pendant la marche et enchaîne une destination de zone.
Elle vérifie les poses d'attente, la reprise effective des 27 trajets et la
durée d'une interaction dont les coordonnées sont résolues après attente. En
retirant la sélection de pose immobile dans le serveur de test, elle détecte
la réapparition de `walking` sans translation.
Un test unitaire vérifie également qu'un obstacle ajouté loin du trajet ne
déclenche aucune nouvelle recherche, tandis qu'un obstacle qui coupe le trajet
impose un nouveau chemin physiquement libre.
Le relevé final avec les 27 modèles et le décor affichés ne détecte aucune
marche de navigation sans translation. Les clips explicitement choisis comme
activité sont distingués de la locomotion. Des attentes de calcul et d'accès
aux objets restent possibles ; ce contrôle ne garantit pas des trajets
instantanés. Artefact : `/tmp/room-character-runtime-locomotion-retain/`.

## Protocole de performance

Le script conserve ses artefacts dans `/tmp/room-character-runtime-<label>/`.
Chromium reste headless et porte le marqueur du lanceur du projet. GPU matériel
Radeon 840M via ANGLE/Vulkan, viewport 1362 × 810, DPR 1, qualité initiale Low,
caméra top, 27 personnages et décor masqué. Une graine fixe initialise les
choix aléatoires. Le lancement attend les modèles et la caméra ; la chauffe
dure ensuite 45 secondes, puis trois fenêtres de 120 secondes sont capturées.

```bash
# Avant les changements, conserver une seule fois les sources de référence :
node scripts/temp_character_runtime.cjs --snapshot
node scripts/temp_character_runtime.cjs --baseline --build
node scripts/temp_character_runtime.cjs --baseline --production --label=production-before-valid --hardware-gpu
# Compiler et mesurer les sources actuelles :
node scripts/temp_character_runtime.cjs --build
node scripts/temp_character_runtime.cjs --production --label=production-after --hardware-gpu
node scripts/temp_character_runtime.cjs --report --label=production-before-valid
node scripts/temp_character_runtime.cjs --report --label=production-after
```

Le build de référence applique les sources conservées **aussi au worker**.
Les assets publics restent ceux du disque et sont liés dans le répertoire de
mesure. Le build de mesure expose la caméra au protocole uniquement ; cette
instrumentation ne modifie pas les sources de l'application. Le raycast du
parachute inclut ses couches dans les deux versions : sans ce préalable commun,
le chargement échouait avant la mesure.

Les profils de développement de référence attribuent une part importante du
temps principal aux approches, aux reconstructions et aux unions d'obstacles.
Le worker de pathfinding existant ne couvrait pas ces préparations.

Les fenêtres ne sont pas trois démarrages indépendants. Les activités
autonomes divergent avec les délais des calculs asynchrones, même avec une
graine initiale identique. Cette comparaison caractérise les pauses observées ;
elle ne garantit pas une scène déterministe, 60 FPS ou l'absence de toute pause
future. La somme des RSS Chrome compte plusieurs fois les pages partagées.

## Résultats de la comparaison en production

| Fenêtre de 120 s | p99 avant / après (ms) | Maximum avant / après (ms) | Intervalles > 100 ms avant / après |
| --- | ---: | ---: | ---: |
| 1 | 1 066,7 / 83,3 | 1 283,2 / 416,6 | 47 / 4 |
| 2 | 1 116,7 / 83,4 | 1 716,6 / 166,6 | 109 / 3 |
| 3 | 966,6 / 83,3 | 1 650,0 / 149,9 | 107 / 1 |

Le p95 après modification est de 66,7 / 66,8 / 66,7 ms, contre
66,6 / 183,3 / 116,7 ms avant. Les FPS moyens observés sont
21,68 / 19,91 / 23,03 après, contre 18,71 / 14,45 / 16,49 avant. La médiane
des intervalles reste variable : 50 / 50 / 33,4 ms après, contre environ
33,3 / 33,4 / 33,4 ms avant. Ces mesures ne justifient pas une promesse de
60 FPS ni une amélioration de chaque image.

Les maxima instrumentés après modification sont de 31,3 / 43,2 / 42,1 ms pour
la simulation collective et de 6,5 / 4,4 / 5,1 ms pour la phase d'animation.
Ils n'incluent pas tout le rendu Three.js, les callbacks de chargement et les
attentes du pilote. Des tâches principales résiduelles atteignent
427 / 155 / 131 ms : les pauses ne sont pas entièrement supprimées. Les profils
conservent notamment du travail de bornes animées et de matrices ; ils ne
permettent pas à eux seuls d'attribuer chacune de ces pauses à une cause unique.

La simulation progresse : 24 personnages changent de position, d'orientation
ou d'animation dans les relevés de la première fenêtre, sur les 27 présents.
Les 27 lecteurs restent enregistrés. Le nombre de clips partagés en fin de
fenêtre est de 84 / 82 / 87, avec 16 signatures de rigs et aucune préparation
d'animation encore en attente à ces trois instants. Le tas JS principal vaut
environ 869 / 965 / 918 Mio. La somme des RSS finit autour de
4,28 / 4,35 / 4,29 Gio ; un pic transitoire à 5,02 Gio apparaît dans la première
fenêtre. Six minutes ne prouvent pas l'absence de fuite sur une session longue.

Les trois fenêtres après refonte satisfont le budget de 50 ms des deux phases
instrumentées ; elles conservent des pauses hors de ces phases et des attentes
de navigation. Une requête du worker peut encore prendre plusieurs secondes.
Les derniers ajustements d'attente de posture et de nettoyage ont ensuite été
soumis aux contrôles fonctionnels, de types et de compilation.

Artefacts de cette session :

- `/tmp/room-character-runtime-production-before-valid/`
- `/tmp/room-character-runtime-production-after/`
- `/tmp/room-character-runtime-verify-final/`
- `/tmp/room-character-runtime-visibility/`

Les premières tentatives `production-before`, `production-before-final` et
`production-before-checked` sont invalides : elles ont révélé un mélange du
worker courant et du client de référence dans le protocole de build. Elles
ne figurent dans aucun chiffre de ce tableau.
