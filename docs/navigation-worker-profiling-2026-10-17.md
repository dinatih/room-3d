# Navigation : déplacer les recherches de trajets hors du fil principal

Le profilage confirme un blocage CPU dans les recherches du graphe de visibilité pondéré par le confort. Le même algorithme est désormais exécuté dans un Web Worker ; les agents attendent son résultat sans bloquer le rendu. Aucun personnage, reflet, ombre ou effet d'interface n'a été retiré.

## Mesures

Chromium headless via `scripts/browser-test-options.cjs`, configuration GPU Vulkan/ANGLE du précédent protocole (AMD Radeon 840M), viewport 1362 × 810, DPR 1, secteur. Caméra fixe, sol bermuda, scène et activités par défaut, maintien de l'activité de l'application, chauffe de 12 secondes après lancement puis capture de 60 secondes. Les frames comptées sont les rendus réels de la scène principale.

| Mesure dans la scène | Avant | Avec worker |
| --- | ---: | ---: |
| Recherches sur le fil principal | 90, dont 32 pondérées | 31, aucune pondérée |
| Pire recherche sur le fil principal | 474,1 ms | 6,3 ms |
| Pire intervalle entre images | 575,7 ms | 201,1 ms |
| Images espacées d'au moins 500 ms | 1 | 0 |
| Pire tâche principale | 571 ms | 197 ms |
| Intervalle médian | 97,6 ms | 100,7 ms |
| Intervalle p95 | 115 ms | 126,4 ms |
| FPS moyens | 9,65 | 9,59 |

Le worker avait traité 192 requêtes à la fin de la capture après modification (compteurs depuis le chargement, donc chauffe incluse). Sa recherche la plus longue a pris 661,2 ms. Aucune erreur de page dans ces captures.

**Cette observation n'est pas un benchmark AB strict des FPS.** Les activités des PNJ ne sont pas déterministes et des modifications Xbot étrangères à cette tâche ont été commitées en parallèle entre les captures. La compilation de production a également eu lieu pendant le chargement de la capture après, avant la chauffe et la mesure. Les médianes et p95 ne montrent pas de gain permanent du rendu. Une minute sans image de 500 ms ne prouve pas l'absence définitive de freezes.

Pour isoler réellement l'effet du worker, le pire graphe, son départ et sa destination ont été exportés depuis la capture avant, puis rejoués sur une page sans scène 3D : même graphe neuf, même algorithme et même requête, calcul synchrone puis worker.

| Rejeu du même trajet capturé | Synchrone | Worker |
| --- | ---: | ---: |
| Temps total jusqu'au résultat | 588,2 ms | 643,9 ms |
| Plus grand intervalle d'un témoin principal de 10 ms | 589,8 ms | 10,2 ms |
| Coût du chemin | 1289,9599262798833 | 1289,9599262798833 |
| Sommets du chemin | Identiques | Identiques |

Le worker libère le fil principal, sans accélérer le calcul lui-même. Son démarrage, la copie des obstacles et la reconstruction des caches expliquent un surcoût possible. Un premier lot de cinq requêtes réelles, dont une inaccessible, a également conservé exactement les chemins et coûts : 678,9 ms de calcul synchrone contre 786,1 ms via worker, témoin principal 680,9 contre 10,3 ms.

## Fonctionnement et limites

- Les recherches principales, transitions locales d'interaction et détours autour des acteurs utilisent le worker. Le graphe physique et le coût de confort sont conservés.
- Une seule recherche s'exécute à la fois ; les requêtes attendent dans une file. L'annulation retire une requête encore en attente. Une recherche déjà lancée finit, mais son résultat annulé n'est pas appliqué.
- Le worker conserve seulement le dernier graphe et ses caches. Le client retransmet la définition lorsque le graphe change ; il ne conserve pas indéfiniment tous les états de meubles et portes.
- Le suivi vérifie le graphe, le départ et la destination avant d'accepter un résultat. Une modification du décor, une nouvelle destination ou un reset invalide la recherche concernée.
- Un détour utilise un instantané des autres acteurs pendant son calcul. Les contrôles de collision réels restent exécutés à chaque pas, ainsi que les réservations et contrôles des portes.
- Le retour du worker invalide le rendu pour permettre la reprise, même en rendu à la demande. L'attente normale ne déclenche pas les diagnostics coûteux de navigation bloquée.
- Les erreurs du worker et les coordonnées invalides remontent explicitement ; aucun repli synchrone ne masque une panne.
- La construction/union des obstacles, les approches d'objets et les tests physiques `canReach` restent sur le fil principal. Le pire de ces tests observé après modification est de 6,3 ms ; d'autres scènes peuvent coûter davantage.
- La navigation peut attendre lorsqu'un autre trajet monopolise le worker. Le rendu GPU, les reflets et les autres coûts CPU restent présents. Il ne s'agit pas d'une promesse de 60 FPS ni d'un correctif garanti de tous les freezes.

## Vérifications et reproduction

Passés : `npx tsc --noEmit`, `npm run build` (chunk worker émis), `git diff --check`, replay des chemins et tests navigateur d'attente/reprise sans téléportation, annulation, changement du graphe et rejet d'une cible devenue obstruée. Une requête avec NaN produit une erreur explicite. Les tests de collision et de confort existants ne changent pas d'algorithme.

Le script conservé contient deux nouveaux modes :

```bash
node scripts/temp_lara_profile.cjs --navigation-live --label=navigation-current
node scripts/temp_lara_profile.cjs --worker-check --fixture=/tmp/room-navigation-current/worst-query.json
```

Le premier exporte le pire graphe encore traité sur le fil principal. Pour rejouer un graphe pondéré historique, conserver la fixture obtenue avant l'intégration, ou lancer la capture avec `--baseline-ref=<commit-avant-worker>`. Ce mode historique remplace en mémoire les fichiers source modifiés par rapport au commit choisi ; les assets publics restent ceux du disque. Vérifier ce périmètre avant toute comparaison.

Résultats de cette session :
- `/tmp/room-navigation-before/{summary,trace,worst-query}.json`
- `/tmp/room-navigation-after/{summary,trace,worst-query}.json`
- `/tmp/room-navigation-worker-check/summary.json` (dernier replay, une requête)
- `/tmp/room-navigation-worker-check.log` (lot de cinq et intégration)
- `/tmp/room-navigation-worker-replay.log` (replay de la pire requête)
- `/tmp/room-worker-build.log`

Les JSON sous /tmp sont des résultats locaux et ne font pas partie du dépôt.
