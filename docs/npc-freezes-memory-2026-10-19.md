# Profilage des freezes et de la mémoire à 15 PNJ — 19 octobre 2026

Le profilage ne montre pas une disparition des optimisations Lara. Il reproduit des pauses au lancement, une forte allocation temporaire et une pression mémoire globale importante. Il ne démontre pas une fuite JavaScript de 4,5 Go.

## Conditions retenues

- Code applicatif au commit `9405c7f6`, sans modification pendant les mesures retenues.
- Chromium headless, lanceur `scripts/browser-test-options.cjs`, marqueur `--codex-browser-test=room-3d`.
- GPU matériel vérifié : AMD Radeon 840M, ANGLE / Vulkan 1.4.354, RADV 26.2.2. Accès via une exécution autorisée hors du bac à sable ; le périphérique est absent de l'environnement isolé mais existe sur l'hôte sous `/dev/dri/renderD128`.
- Viewport 1362 × 810, DPR 1, preset Low, caméra dessus, introduction sautée. Les autres objets, animaux et activités de la scène sont conservés.
- Deux navigateurs neufs successifs : 15 PNJ, puis 0 PNJ. Aucun remplacement de module ni interception des requêtes dans ces passages.
- Profil CPU du lancement puis de six périodes de dix secondes après détection du lancement ; allocations échantillonnées à 32 Kio ; mesure du tas avant/après collecte forcée ; inventaire des ressources de la scène.
- Activités autonomes non déterministes, pas de répétitions ABBA : les écarts ne sont pas une mesure isolée du coût de chaque Lara ni une preuve de régression entre deux commits.
- Le profilage ajoute du travail et la machine subit du swap. Les temps mesurés décrivent cette capture, pas un objectif de FPS en production.

## Résultats mesurés

Mo et Go sont décimaux dans ce rapport.

| Mesure | 0 PNJ | 15 PNJ |
| --- | ---: | ---: |
| Lancement détecté au sondage | 21,7 s | 33,0 s |
| Plus longue tâche principale depuis la navigation | 1,704 s | 2,967 s |
| Intervalle médian entre images pendant la fenêtre stable analysée | 50 ms | 100 ms |
| Intervalle p95 | 66,7 ms | 150 ms |
| Intervalle maximal de cette fenêtre | 200 ms | 1 483 ms |
| Intervalles supérieurs à une seconde dans cette fenêtre | 0 | 2 |
| Tas JavaScript après collecte forcée | 106,2 Mo | 163,4 Mo |
| Backing storage après collecte, rapporté par CDP | 687,7 Mo | 732,5 Mo |
| Buffers de géométrie uniques présents dans la scène | 277,9 Mo | 288,6 Mo |
| Géométries uniques | 1 215 | 1 410 |
| Matériaux uniques | 456 | 1 033 |
| Textures référencées par les matériaux | 226 | 282 |
| Équivalent RGBA8 des niveaux de base de ces textures | 888,7 Mo | 1 077,8 Mo |

Les fenêtres d'images excluent la première période après lancement. Elles couvrent environ cinquante secondes par passage, en utilisant requestAnimationFrame. La pause principale maximale provient de PerformanceObserver/longtask ; l'intervalle d'image maximal est une autre mesure.

L'équivalent RGBA8 est seulement `largeur × hauteur × 4` par objet Texture référencé. Ce n'est ni une mesure de VRAM ni une mesure exacte des images décodées : il ignore les formats réels, les mipmaps, les render targets, les textures du renderer et le partage éventuel des sources. Il sert à montrer le poids de l'ensemble de la scène, déjà élevé sans PNJ. Il ne faut pas additionner aveuglément les lignes de ce tableau.

Le backing storage de Runtime.getHeapUsage est distinct du tas objet JavaScript. Les géométries peuvent en faire partie ; ce ne sont pas des postes indépendants à additionner.

À 15 PNJ, le tas échantillonné passe notamment par 317, 369, 290, 409, 419 puis 711 Mo. Après collecte forcée, il retombe à 163 Mo. La grande majorité du dernier pic est donc récupérable. Une minute ne suffit pas à exclure une fuite lente ; un tas qui monte avant collecte ne suffit pas non plus à la prouver.

## Mémoire du système et du navigateur

Le RSS total des processus Chromium compte plusieurs fois certaines pages partagées. Les échantillons conservent aussi le PSS par processus et le VmSwap ; il faut distinguer ces mesures du chiffre affiché par le gestionnaire des tâches Chrome ou par le moniteur système.

Après collecte, le passage 15 PNJ a environ 634 Mo de PSS résident et 2 656 Mo de VmSwap cumulé ; la référence sans PNJ a environ 1 062 Mo de PSS et 1 841 Mo de VmSwap. La somme PSS + VmSwap donne un ordre de grandeur de 3,29 contre 2,90 Go, avec des limites de comptage du swap partagé. Ce ne sont pas des mesures exactes de mémoire privée unique ni de mémoire de l'onglet Chrome.

Pendant le protocole, l'hôte de 11 Gio de RAM est descendu à environ 855 Mio disponibles avec 16 Gio de swap occupés. Une observation vmstat relève environ 179 Mio/s de sorties vers le swap, puis 22 Mio/s d'entrées. Le renderer du passage 15 PNJ possède à lui seul environ 2,7 Go en swap lors d'une inspection. Cette pression est un facteur de pauses et empêche d'attribuer tous les écarts au code des personnages. Les autres applications et onglets de l'utilisateur n'ont pas été fermés.

L'utilisateur a confirmé que les 4,5 Go viennent des processus Chrome dans le moniteur système. Ce total peut inclure d'autres onglets, le processus GPU et les services du navigateur ; ce n'est pas une mesure du seul tas JavaScript de la scène. Les navigateurs de test ont aussi des processus Chrome : distinguer leurs PID lorsqu'on observe le total pendant un profilage. La comparaison exacte avec ce chiffre demanderait de connaître le périmètre et le mode de comptage du moniteur au moment du relevé.

## Où passe le temps

Les temps ci-dessous sont des temps inclusifs échantillonnés, souvent imbriqués : ne pas les additionner entre parents et enfants.

Au démarrage avec 15 PNJ :

- La préparation répétée des Dröna (`useDronaGeoFromGlb`) représente environ 2,18 s. La référence sans PNJ représente déjà 2,12 s au même endroit. Le code clone et transforme les géométries high et low dans chaque utilisateur du hook, même quand un seul mode est affiché. Ce coût est ancien : le dernier commit touchant ce fichier avant le profilage date du 9 octobre.
- Les chemins échantillonnés de transfert de textures texSubImage2D totalisent environ 2,26 s parmi les principaux nœuds observés ; les premiers usages de programmes/shaders représentent également un coût important.
- Le montage Character représente environ 1,18 s dans le principal chemin observé ; la préparation des bornes animées représente environ 637 ms dans un chemin de clonage.
- Ces observations identifient des contributeurs du lancement, sans attribuer précisément la tâche longue maximale à une seule de ces opérations.

Pendant environ 64 s après lancement avec 15 PNJ :

- Le callback des personnages représente environ 5,12 s ; la mise à jour du contrôleur IA représente environ 3,98 s dans ce chemin, dont la résolution des coordonnées environ 2,15 s.
- RobinBird représente environ 4,33 s, dont la mesure des pattes environ 2,00 s. Ce coût existe aussi sans PNJ : 6,69 s pour RobinBird et 3,48 s pour la mesure des pattes dans l'autre passage, avec des activités et un nombre d'images différents.
- Le contrôle des receveurs d'ombres représente environ 3,03 s.
- Les nombreux appels de rendu et la sélection des programmes/material parameters restent des postes dominants. Les échantillons moteur `(program)` ne permettent pas de distinguer précisément toute l'attente du pilote, du GPU ou du système.
- Le ramasse-miettes représente environ 1,38 s de temps propre échantillonné. Cela ne signifie pas une unique pause de cette durée.

La navigation worker termine 79 recherches sur 79, aucune file restante, maximum de 924 ms dans ce passage. Une recherche longue dans le worker peut retarder un déplacement, mais sa durée n'est pas une preuve de blocage du thread principal pendant la même durée.

Les échantillons d'allocations retenues mettent notamment en évidence les structures de bornes animées, les Object3D et le parsing de modèles. C'est un échantillonnage d'allocations encore vivantes à sa fin, pas un heap snapshot ni un relevé exhaustif de toutes les allocations temporaires.

## Audit des optimisations et des commits

- `d77e0ee4` (Codex, 17 octobre) : partage des palettes de squelette. Toujours appelé dans useGLTFClone ; tests passants.
- Inspection réelle du passage 15 PNJ : 14 racines Lara natives et un Xbot. Les corps Lara gardent une palette chacun. Une racine contenant un accessoire possède un second squelette : ce n'est pas le retour à une palette par partie du corps.
- Le fichier Lara natif fait environ 1,1 Mo compressé. Sa taille sur disque ne représente pas son coût décodé en mémoire. Les géométries sont partagées entre clones ; les os et animations restent indépendants.
- `2ad504ee` (Codex, 14 octobre) : chargement des sources d'animation sans décoder leurs meshes/textures inutilisés. Le plugin est toujours enregistré.
- `dadc8624` (Antigravity CLI, 18 octobre) : réduction des caches d'animations à 8 sources et 32 clips retargetés, toujours présente.
- `0956377b` (Codex, 18 octobre, 21:23) réactive explicitement ACTOR_AVOIDANCE_SCALE de 0 à 1 et retire les sorties rapides. Le changement de collision est donc expliqué par le diff, sans hypothèse de corruption Git.
- `a5707a91` rétablit le blocage mutuel à 0 ; les tests de déplacement/destination/contournement passent.
- `9405c7f6` partage séparément les chargements d'animations en cours afin que l'éviction du cache des résultats ne relance pas un décodage identique. Le test de 15 demandeurs × 15 sources passe.

Aucune bissection exhaustive de tous les commits récents ni comparaison avant/après de chacune des optimisations n'a été réalisée. L'audit établit leur présence et leur fonctionnement ciblé, sans promettre l'absence de toute autre régression.

## Priorités suggérées par les mesures

1. Partager la préparation des géométries Dröna par source, et éviter de construire les variantes inutilisées pour chaque boîte. Vérifier géométrie, dimensions et comportement de tous les modes après modification.
2. Réduire les allocations répétées de navigation à partir de données statiques : footprints gonflés et résolution d'approches, avec invalidation réelle sur changement de géométrie ou de profil. Ne pas simplement ralentir arbitrairement l'IA.
3. Examiner la mesure des pattes et les recherches d'appuis du rouge-gorge, ainsi que les passes de rendu et scans des receveurs d'ombres.
4. Inventorier les plus grosses textures de toute la scène avant de décider d'une réduction ou compression ; ne pas supposer que les Lara représentent toute la mémoire du renderer.

Ce tour ajoute le protocole et ce rapport ; aucune optimisation applicative supplémentaire n'est appliquée sur la seule base de ce profil.

## Reproduction et artefacts

```bash
npm run dev -- --host 127.0.0.1 --port 5186
ROOM_PROFILE_OUT=/tmp/room-npc-repeat ROOM_PROFILE_COUNTS=15,0 node scripts/profile-npc-startup.cjs --hardware-gpu
ROOM_PROFILE_OUT=/tmp/room-npc-repeat node scripts/profile-npc-startup.cjs --report
```

L'exécution de Chromium peut nécessiter l'exception de sandbox utilisée pour les tests de ce projet. Le script garde headless avec --hardware-gpu ; vérifier le GPU imprimé, pas seulement la présence de l'option. Les observations GPU et mémoire de ce rapport viennent de l'exécution sur l'hôte.

Artefacts retenus : `/tmp/room-npc-clean/summary.json`, `15-startup.cpuprofile`, `15-steady.cpuprofile`, `0-startup.cpuprofile`, `0-steady.cpuprofile`, les profils d'allocations et les captures de scène du même répertoire. L'inspection des palettes et du swap à 15 PNJ est dans `/tmp/room-npc-clean-inspect.log`. Le résumé textuel est dans `/tmp/room-npc-clean-report.txt`.

Les premiers passages dans `/tmp/room-npc-profile` et `/tmp/room-npc-hardware` sont exclus des conclusions : rendu logiciel pour le premier ; reliquat de navigateur et interception des modules perturbant le démarrage pour le second. L'interception a été retirée du protocole final. Les fenêtres valides ont été exécutées successivement après arrêt du reliquat de notre test ; les autres applications restent une source de pression mémoire.

Validation : TypeScript, syntaxe Node du profileur, tests des palettes/bornes animées, tests des réservations et collisions à 0 cm, et test du partage des chargements concurrents passants. Aucun test graphique visible n'a été lancé.

## Optimisations implémentées après le profilage

L'utilisateur a fermé sa fenêtre Chrome exécutant l'application avant la nouvelle comparaison. Une nouvelle référence a donc été mesurée ; les chiffres ci-dessous ne sont pas comparés aux passages précédents soumis à une forte pression de swap.

Changements conservés :

- Dröna : une géométrie transformée partagée par géométrie source, préparation de la seule variante affichée, géométrie procédurale partagée et suppression du préchargement systématique des deux variantes. Les sommets, normales, UV, indices et le centrage restent identiques à l'ancien calcul. Le chargement est isolé dans des frontières Suspense locales aux Dröna : sélectionner un GLB non encore chargé ne suspend plus les autres meubles.
- Navigation : réutilisation des polygones de meubles gonflés par profil, invalidation lors des changements enregistrés de géométrie et suppression de la copie du tableau des meubles dans la détection du meuble contenant un personnage. Les dimensions et règles de passage restent identiques.
- Rouge-gorge : les matrices des seuls os influençant les pattes sont calculées une fois par mesure, au lieu de répéter leur produit pour chaque sommet. Le skinning, le morphing et les transformations restent exacts. Les appels redondants de mise à jour des palettes GPU ont été retirés de cette mesure.

Une première validation a détecté que le chargement à la demande d'un mode Dröna pouvait suspendre la scène parente et déclencher une erreur d'attache du coussin cœur lors de son remontage. Ce passage (`/tmp/room-npc-after-optimizations`) n'est pas retenu comme validation finale. Les frontières Suspense locales corrigent cette propagation ; le passage final traverse les six changements de mode sans erreur.

### Comparaison finale à 15 PNJ

Même GPU AMD/Vulkan, viewport, preset Low et caméra dessus. Un navigateur neuf à la fois ; référence au commit `becb2030` injectée côté serveur Vite dans les quatre fichiers applicatifs concernés, puis version finale. Environ 63 secondes de capture après lancement, collecte forcée et inventaire avant les tests de modes. Les activités restent autonomes et non déterministes : il s'agit d'une paire exploratoire, pas d'une garantie de gain global stable.

| Mesure | Nouvelle référence avant | Version finale après |
| --- | ---: | ---: |
| Buffers CDP après collecte | 731,2 Mo | 678,9 Mo |
| Buffers de géométries présents dans la scène | 289,3 Mo | 239,5 Mo |
| Tas JavaScript après collecte | 158,1 Mo | 159,2 Mo |
| PSS de l'ensemble des processus de test après collecte | 3 438,5 Mo | 3 341,3 Mo |
| VmSwap cumulé au même instant | 14,7 Mo | 0 Mo |
| Intervalle médian stable entre images | 83,3 ms | 66,7 ms |
| Intervalle p95 | 100 ms | 83,4 ms |
| Plus longue tâche principale depuis la navigation | 1 935 ms | 1 665 ms |
| Préparation Dröna au lancement, CPU inclusif échantillonné | 1 918,6 ms | 4,2 ms |
| Recherche du meuble contenant un acteur, CPU inclusif après lancement | 1 669,6 ms | 34,7 ms |
| Mesure des pattes, CPU inclusif après lancement | 2 439,2 ms | 684,1 ms |

Les deux fenêtres stables ne contiennent pas d'intervalle d'image supérieur à une seconde ; leurs maxima sont respectivement 267 et 217 ms. Les tâches et intervalles du lancement restent importants. Les gains ciblés sont confirmés par les calculs supprimés et les tests numériques ; l'amélioration de la médiane et du p95 de cette paire reste à ne pas généraliser à toutes les activités.

L'économie de buffers après collecte est d'environ **52 Mo**, celle de géométrie d'environ **50 Mo**. La mémoire native globale reste élevée et le tas retenu est stable : ne pas annoncer une réduction de plusieurs Go ni la suppression de tous les freezes. Les textures et les nombreuses passes de rendu n'ont pas été dégradées pour obtenir ces chiffres.

### Validation finale

- `node scripts/test-scene-performance.cjs` : géométrie Dröna strictement identique au calcul d'origine, 100 utilisations partageant l'objet, source GLB inchangée, variantes à la demande et réutilisation après changement de mode ; empreintes identiques, 10 000 accès réutilisés, séparation des profils et invalidation après déplacement/suppression ; 100 000 sommets de pattes comparés dans 50 poses avec morphs et parent de scale non uniforme, erreur maximale nulle.
- Microbenchmark synthétique des pattes : environ 75 ms avant contre 24 ms après pour la même série. Ce n'est pas une mesure du FPS de l'application.
- Navigateur réel : 20 poses du GLB Robin comparées à l'ancienne implémentation, erreur maximale nulle. Les 29 Dröna ont une seule géométrie en High, Low et Procédural ; aucun mesh en Masqué. High et Low réutilisent leur géométrie après retour, sans événement de destruction de la ressource partagée. Aucune erreur de page pendant le passage final.
- Tests de partage des squelettes/bornes animées, réservations de portes, collisions entre PNJ à 0 cm et chargements d'animations concurrents passants. TypeScript et build de production passants.

Reproduction :

```bash
ROOM_PROFILE_OUT=/tmp/room-npc-before-optimizations ROOM_PROFILE_COUNTS=15 node scripts/profile-npc-startup.cjs --hardware-gpu --serve --baseline-ref=becb2030
ROOM_PROFILE_OUT=/tmp/room-npc-after-final ROOM_PROFILE_COUNTS=15 node scripts/profile-npc-startup.cjs --hardware-gpu --serve --validate-optimizations
node scripts/test-scene-performance.cjs
```

Les deux commandes de profilage sont séquentielles et lancent/ferment leur propre serveur sur le port 5197. L'option de référence remplace les sources côté serveur, sans modifier le checkout ni intercepter les modules côté navigateur. Chaque répertoire contient summary.json, les profils CPU et allocations, le GPU et une capture de scène. Les contrôles numériques réels et les modes Dröna sont enregistrés dans le champ validation du summary.json final.
