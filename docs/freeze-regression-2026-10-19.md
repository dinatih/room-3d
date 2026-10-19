# Investigation des freezes après le décalage initial de Native

## Versions examinées

- `23f8a264` : optimisations Dröna, empreintes de navigation et pattes du rouge-gorge.
- `7693fce7` : seule modification applicative, réactivation de `offset: [0, 0, -36]` pour le bureau 2.
- `75d976b4` : modifications ultérieures des déplacements et protections géométriques des portes ; HEAD au début de l'investigation.

Le commit du bureau ne modifie ni le rendu, ni les ressources chargées. Il peut néanmoins changer les approches et activités ultérieures : son innocuité ne se déduit pas du nombre de lignes modifiées.

## Protocole

Chromium headless marqué `--codex-browser-test=room-3d`, GPU AMD Radeon 840M via ANGLE/Vulkan, 15 PNJ, preset Low, caméra dessus, viewport 1362 × 810. Un seul navigateur de cette investigation tourne à la fois. Les autres applications et navigateurs restent ouverts. Le navigateur neuf ne reproduit pas la console agrandie visible sur la capture utilisateur.

Chaque passage mesure le lancement puis six périodes de dix secondes après lancement, avec profils CPU, tâches longues, intervalles requestAnimationFrame et mémoire PSS/VmSwap par processus. Les activités autonomes restent aléatoires. Le script de profilage injecte désormais tous les fichiers `src` modifiés par rapport à la référence, au lieu des quatre seuls fichiers des anciennes optimisations. Cela conserve les interfaces cohérentes pour comparer les deux commits récents, sans modifier les sources applicatives du checkout. Ce mécanisme ne reconstitue pas les ajouts/suppressions de fichiers ou les anciens assets et dépendances.

## Passage HEAD

- Scène lancée vers 36 s ; aucune erreur de page.
- Entre le premier et le dernier échantillon stable, avant collecte forcée : intervalle médian 116,7 ms, p95 233,4 ms, maximum 500 ms ; tâche principale maximale 498 ms. La pause maximale de tout le lancement est 2 430 ms.
- Le navigateur atteint environ 3,22 Go de PSS résident au lancement. En régime établi, son VmSwap dépasse 2,7 Go. Après collecte : environ 157 Mo de tas JS, 637 Mo de PSS résident et 2,51 Go de VmSwap.
- Pendant ce passage, `vmstat 1 3` observe deux intervalles avec environ 173 et 402 Mo/s de sorties vers le swap (unités du compteur : Kio/s). La RAM disponible du système descend sous 800 Mio. Le navigateur de profilage contribue lui-même à cette pression ; ces chiffres ne mesurent pas l'onglet de l'utilisateur.
- CPU inclusif échantillonné sur la fenêtre après lancement : `getUnusedShadows` ≈ 3,68 s, callback du rouge-gorge ≈ 3,21 s, contrôleur IA ≈ 1,21 s, dont `getObjectApproach` ≈ 0,21 s. Les coûts inclusifs s'imbriquent et ne doivent pas être additionnés.
- Les appels de rendu et de sélection des programmes Three.js sont des postes CPU dominants. Le pseudo-échantillon `(program)` ne permet pas de distinguer l'attente GPU, pilote ou système.
- Navigation worker : 64 demandes terminées sur 64, aucune annulation ni file restante ; maximum 1 232 ms dans le worker. Cette durée ne prouve pas un blocage du thread principal.

## Comparaison des trois passages

Intervalles requestAnimationFrame entre le premier et le dernier échantillon stable, sans la collecte forcée. Les temps CPU couvrent les six périodes après lancement ; ils ne sont pas des durées d'un freeze unique.

| Version | Médiane | p95 | Image la plus retardée | Tâche principale maximale | CPU `getObjectApproach` |
| --- | ---: | ---: | ---: | ---: | ---: |
| `23f8a264`, décalage désactivé | 100 ms | 149,9 ms | 1 366,6 ms | 1 369 ms | 2 212 ms |
| `7693fce7`, décalage réactivé | 100 ms | 166,7 ms | 1 683,3 ms | 1 711 ms | 3 966 ms |
| `75d976b4`, portes modifiées | 116,7 ms | 233,4 ms | 500 ms | 498 ms | 206 ms |

Les trois passages sont sans erreur de page. Après collecte, le tas JS est similaire : environ 157, 160 et 157 Mo. Le VmSwap du navigateur reste respectivement à environ 2,35, 2,51 et 2,51 Go. Aucune de ces mesures n'est une preuve de fuite mémoire.

Des pauses de plus d'une seconde sont donc reproduites avant les deux derniers commits. Le passage avec le décalage réactivé montre davantage de CPU dans les approches, mais une seule observation avec activités aléatoires et forte pression mémoire ne permet pas d'attribuer cet écart au décalage. La version des portes est plus lente en médiane dans cette paire, tout en ayant moins de pauses extrêmes : ne pas annoncer une amélioration ou une régression globale à partir de ces trois captures.

## Interprétation et piste de code

La pression mémoire et les entrées/sorties de swap constituent un facteur observé de dégradation pendant le profilage. Le rendu et les scans d'ombres constituent aussi des coûts observés. Cette capture ne montre pas une boucle de résolution du bureau 2 dominant le CPU. Elle ne prouve ni une régression causée par le décalage, ni l'absence d'un cas particulier lors d'une autre activité.

La piste IA est précise : `getObjectApproach` et `getDoorApproach` appellent `graph.canReach` pour vérifier des candidats sur le thread principal. Dans `VisibilityGraph`, `canReach` exécute directement `find` sur le graphe physique ; il ne passe pas par le worker utilisé pour les trajets. Le profil du passage `7693fce7` relève environ 1,99 s inclusives dans `canReach`, sous la résolution des coordonnées. Les constructions de graphes sont également synchrones. Cela identifie un contributeur possible aux pauses dépendant des activités et des obstacles, sans relier exactement chaque tâche longue à une requête particulière.

Le prochain diagnostic ciblé consiste à enregistrer la durée et l'identifiant de l'acteur/objet de ces résolutions pendant une pause réelle, puis à rejouer la même requête géométrique. Conserver la même activité et contrôler la pression mémoire avant de comparer une correction. Aucun changement de navigation ou de rendu n'a été appliqué dans cette investigation.

La console de la capture utilisateur applique le style `glass-card` avec un flou d'arrière-plan de 14 px ; son coût supplémentaire n'est pas isolé ici. Ne pas lui attribuer les freezes sans comparaison ouverte/fermée.

## Artefacts et reproduction

Les profils, summaries, inventaires et captures sont conservés sous `/tmp/room-freeze-current`, `/tmp/room-freeze-7693fce7` et `/tmp/room-freeze-23f8a264`. Les journaux correspondants sont `/tmp/room-freeze-<version>.log`.

```bash
ROOM_PROFILE_OUT=/tmp/room-freeze-current ROOM_PROFILE_COUNTS=15 node scripts/profile-npc-startup.cjs --hardware-gpu --serve
ROOM_PROFILE_OUT=/tmp/room-freeze-7693fce7 ROOM_PROFILE_COUNTS=15 node scripts/profile-npc-startup.cjs --hardware-gpu --serve --baseline-ref=7693fce7
ROOM_PROFILE_OUT=/tmp/room-freeze-23f8a264 ROOM_PROFILE_COUNTS=15 node scripts/profile-npc-startup.cjs --hardware-gpu --serve --baseline-ref=23f8a264
```

Exécuter ces commandes séquentiellement. Pour consulter un passage : `ROOM_PROFILE_OUT=/tmp/room-freeze-current node scripts/profile-npc-startup.cjs --report`.

Validation de l'outillage modifié : `node --check scripts/profile-npc-startup.cjs`, `npx tsc --noEmit` et `git diff --check` passants. Les trois navigateurs de test se sont fermés à la fin de leurs captures.
