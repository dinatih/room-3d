# Tests CLI de l’appartement

Linux (mesure du RSS via `/proc`), Node ≥ 22.15, dépendances installées et Chromium Puppeteer disponibles. Aucun service permanent ni interface supplémentaire.

```bash
npm test
npm run test:studio
npm run test:studio -- --case=garden-fifteen
npm run test:studio -- --case=approach-reachability
npm run test:perf -- --case=7-mid
npm run test:perf -- --case=0-low,7-low,15-mid
npm run test:perf -- --case=all
npm run test:perf -- --case=7-mid --reference=machine-7-mid
npm run test:perf -- --case=7-mid --approve-reference=machine-7-mid
```

`--hardware-gpu` est accepté pour rendre le choix explicite dans une commande de reproduction. Sous Linux, le lanceur utilise Vulkan/ANGLE en headless ; le rapport indique le GPU **réellement utilisé**, y compris une éventuelle implémentation logicielle. Les tests utilisent toujours `scripts/browser-test-options.cjs`. Aucun lancement visible.

Les cas disponibles et leurs budgets de temps se trouvent dans `fixtures/cases.cjs`. Les cas navigateur passent séquentiellement ; chacun possède un serveur Vite sur port libre, un nouveau processus Chrome et son propre profil/cache navigateur froid. Le cache OS et celui des dépendances Vite ne sont pas purgés : ils sont partagés entre passages. La graine est réinitialisée avant les scripts de l’application. Les activités autonomes gardent leurs contrôleurs et leur timing réel ; une graine ne garantit pas un ordonnancement identique des chargements asynchrones.

## Organisation

- `unit/` : `describe`/`it`, assertions natives, logique et géométrie sans navigateur. Le chargeur TypeScript compile les modules purs sans nouvelle dépendance ; les dépendances substituées de la géométrie isolée sont explicites.
- `studio/navigation/` : arrivée occupée, quinze trajets concurrents, croisement, Kallax séjour/double porte, attente expliquée puis reprise, échec stable d’un trajet impossible.
- `studio/interactions/` : contrôleur React réel dans l’appartement chargé, modèle Lara et clips GLB retargetés, `AnimationMixer` réel, approche/action/relèvement/sortie, interruption et nettoyage des réservations.
- `studio/performance/` : trois passages par configuration sélectionnée. Démarrage mesuré séparément, fenêtre stabilisée de 15 s puis session de cinq minutes, avec activités autonomes réelles.
- `support/` : préparation, mesures, rapports et assertions partagées.
- `references/` : références approuvées explicitement, versionnées ; aucune référence initiale inventée.

Les portes Kallax utilisent les instructions du registre, un contrôleur React et un modèle Lara animé par les clips GLB réels. Le second acteur traverse avec `followRoute`, le worker et le steering réels, pendant que le contrôleur Kallax continue d’avancer. L’ouverture des battants reste pilotée par l’appartement. Le scénario `closed-door` maintient le battant fermé jusqu’au diagnostic attendu, puis autorise son ouverture. Les tests rapides isolent les vérifications géométriques des battants et de leurs protections.

La configuration actuelle de l’application inclut Xbot parmi ses personnages par défaut : 7 signifie 6 Lara + Xbot, 15 signifie 14 Lara + Xbot. Le runner ne renomme pas artificiellement ces modèles. Il attend les maillages skinnés, les positions publiées après la chute, les obstacles enregistrés et le signal explicite de lancement. Les profils des marcheurs synthétiques utilisent les dimensions des fixtures ; ils parcourent la géométrie réelle sans instancier quinze nouveaux modèles visuels.

## Résultats, erreurs et références

Chaque exécution écrit dans `test-results/<date>-<suite>/`, ignoré par Git :

- `runner.log` : sortie terminal complète, y compris les diagnostics Chromium/Vite.
- `report.json` et `report.md` : résultats, commit, configuration, environnement, erreurs et mesures.
- `<cas>/result.json` : état courant, logs et commande de reproduction, réécrits au fil des heartbeats.
- `<cas>/failure.png` : capture d’échec quand la page répond encore ; sinon raison d’indisponibilité.
- `<cas>/partial-metrics.json` : mesures déjà collectées si la page se bloque pendant une campagne.

Le watchdog et les délais tournent dans Node. Les erreurs JavaScript, échecs HTTP/réseau et assertions font échouer immédiatement le cas. La sortie et le nettoyage de Vite/Chrome sont également bornés. Les budgets explicites des fixtures s’appliquent aussi aux pages figées. La fermeture du navigateur est bornée et son processus est tué si nécessaire ; le serveur est fermé dans `finally`.

Les métriques séparent les intervalles `requestAnimationFrame` (médiane/p95/p99/max), les longues tâches, l’activité du worker (compteurs par phase, maximum de calcul depuis le lancement), le RSS des processus Chrome, le tas JS CDP et les compteurs Three.js. Le RSS additionné compte les pages partagées plusieurs fois ; les compteurs Three.js ne sont pas une mesure d’octets VRAM. Les intervalles rAF mesurent les interruptions de la page ; ce ne sont pas des temps GPU. Le serveur Vite de test observe les changements d’instruction du contrôleur et en conserve le contenu exact, sans modifier les sources applicatives sur disque. Les instantanés d’activité et les logs complètent cette trace. Le démarrage inclut le chargement et la préparation de la scène.

Une référence exige trois passages réussis et compatibles. L’approbation crée un nouvel identifiant et refuse d’écraser un fichier existant. Les références absentes ou les sélections incompatibles sont refusées avant de lancer Chromium ; les conditions matérielles sont vérifiées dès que la scène est prête. Les comparaisons vérifient scénario, graine, nombre et modèles, qualité/calques, viewport/DPR/drawing buffer, caméra, navigateur, GPU, matériel et politique de cache. Les médianes, min/max, dispersion et écarts sont informatifs ; aucun seuil FPS/RAM n’est imposé. Les profils CPU détaillés restent une exécution diagnostique distincte (scripts de profilage existants), pour éviter d’altérer la mesure normale.

Les scripts historiques `temp_*` sont conservés. Les régressions utiles de `test-partial-door-navigation.cjs` et `temp_navigation_comfort.cjs` ont été extraites ; leur exécution n’est pas requise par la suite officielle.

### Accessibilité des approches

`approach-reachability` rejoue les mêmes requêtes sur un instantané des obstacles
réels, depuis le jardin, le séjour et le couloir, vers les positions et les coins
d'approche des deux Kallax et du canapé extérieur. Les objets sont déclarés dans
la fixture. Il vérifie les réponses contre le planificateur physique `find`, qui
était utilisé par `canReach` avant l'optimisation, et conserve les durées des deux
méthodes dans `measurements.passes` du résultat JSON. Les trois répétitions
alternent leur ordre ; chacune mesure une première série avec un nouveau graphe
puis une série avec ses connexions en cache. La construction des graphes est
exclue de ces durées. Ce test ne mesure pas les FPS, la RAM ou une scène rendue
avec quinze personnages ; il n'impose aucun seuil de temps arbitraire.
