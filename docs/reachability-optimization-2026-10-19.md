# Réduire le coût synchrone des vérifications d'approche

## Changement

Avant ce changement (référence `a5b8ddb1`), `VisibilityGraph.canReach` calculait
un plus court chemin physique avec `find`, puis jetait ce chemin pour ne garder
qu'un booléen. Les sélections d'approche des portes et des objets exécutent ces
vérifications sur le thread principal, même si les trajets de déplacement sont
calculés dans un worker.

La vérification explore maintenant les mêmes connexions tangentes, en s'arrêtant
au premier passage trouvé. Elle ne calcule ni coûts optimaux, ni parents, ni
chemin à reconstruire. La distance à la cible ordonne seulement l'exploration :
elle n'exclut aucun candidat. Chaque sommet n'est exploré qu'une fois. Les arêtes
physiques en cache sont réutilisées ; aucune collection de résultats par requête
n'est conservée après le retour. Les graphes de confort délèguent cette question
à leur graphe physique.

Les calculs des chemins, coûts de confort, marges corporelles, portes, animations
et rendu restent identiques. Les coordonnées non finies continuent de produire
une erreur explicite.

## Mesure ciblée dans l'appartement chargé

Chromium headless, GPU matériel AMD Radeon 840M confirmé par ANGLE/Vulkan,
1280 × 720, DPR 1, Low, vue dessus. Un seul navigateur de test. La scène conserve
ses meubles et animaux ; aucun personnage visuel supplémentaire n'est chargé.

Un instantané de 1 032 sommets physiques est interrogé depuis le jardin, le séjour
et le couloir. Les cibles correspondent aux centres et aux coins physiques les
plus proches des Dröna séjour/nord-est et du canapé extérieur, ainsi qu'aux trois
départs. Les 27 requêtes comprennent 15 destinations accessibles et 12 refusées.

Trois répétitions, ordre alterné avant/après, avec un graphe neuf pour chaque
méthode, puis une seconde série sur le même graphe. La construction du graphe est
exclue des durées ; les connexions paresseuses sont construites pendant la première
série. La première série peut aussi subir le coût de compilation JIT du navigateur.

| Série de 27 vérifications | Avant, médiane (min–max) | Après, médiane (min–max) |
| --- | ---: | ---: |
| Graphe neuf | 56,7 ms (47,5–65,1) | 45,2 ms (41,6–48,7) |
| Connexions en cache | 12,6 ms (12,4–15,1) | 8,2 ms (7,5–8,6) |

Le coût médian baisse d'environ 20 % sur la première série et 35 % avec les
connexions en cache. Toutes les réponses avant/après sont identiques. Ce résultat
porte sur ces requêtes physiques, pas sur le temps complet de sélection d'une
activité, le FPS global ou la disparition de tous les freezes. La construction des
graphes, le rendu, les chargements et la pression mémoire restent des coûts distincts.

## Régressions et reproduction

La suite rapide effectue 2 160 comparaisons avec le planificateur physique :
obstacles arrondis/obliques, trous fermés, passages étroits, tangences, points sur
les frontières, sens inversé et appels répétés. Elle vérifie aussi que le booléen
ne demande plus de chemin et que les coordonnées invalides échouent explicitement.

```bash
npm test
npm run test:studio -- --case=approach-reachability --hardware-gpu
npm run test:studio -- --hardware-gpu
npx tsc --noEmit
npm run build
```

Mesure initiale :
`test-results/2026-10-19T18-26-01.442Z-studio/approach-reachability/result.json`.
Les rapports sont locaux et ignorés par Git. Aucune référence de performance
globale n'a été approuvée à partir de cette mesure ciblée.

Validation finale : 15 tests rapides et les 11 scénarios navigateur passent,
y compris les passages Kallax, les quinze trajets concurrents, les clips réels
de relèvement et le nettoyage après interruption/échec. TypeScript, build et
`git diff --check` passent. Rapport de la campagne complète :
`test-results/2026-10-19T18-27-00.335Z-studio/report.json`.
