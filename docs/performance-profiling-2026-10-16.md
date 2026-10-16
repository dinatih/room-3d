# Profilage de la scène — 16 octobre 2026

La correction améliore la cadence sans retirer d'objets, réduire la résolution,
changer les matériaux ou désactiver des fonctions. Les backdrop-filter de la
scène sont conservés ; les deux grands flous de l'inventaire restent désactivés.

## Mesures finales sur secteur

Radeon 840M matérielle via ANGLE/Vulkan, Chromium headless, serveur Vite de
développement, viewport 1362 × 810, DPR 1. Sept personnages, animaux et robots,
décor, ombres et miroirs Mid activés. Caméra fixe et sol Bermuda identiques.

Comparaison ABBA : référence / correction / correction / référence. Chaque
chargement bénéficie de 12 s de chauffe, puis chaque condition de 3 s de
stabilisation et 10 s de mesure. Le compteur suit les appels de rendu de la scène
principale, pas uniquement requestAnimationFrame. L'état secteur ACAD=1 a été
relevé après chacune des 12 mesures. Caméra, layers et taille réelle du buffer
sont identiques entre versions pour chaque condition. Aucune erreur navigateur.

FPS, temps CPU et GPU sont les moyennes des deux passages ; les p50/p95 sont
présentés séparément pour chaque passage, en millisecondes. Les temps CPU et GPU
se recouvrent : il ne faut pas les additionner pour reconstruire le temps d'image.

| Condition | Version | FPS | p50 image, ms | p95 image, ms | CPU render, ms | GPU, ms | Appels/image | Triangles/image |
|---|---|---:|---|---|---:|---:|---:|---:|
| Fonctionnement normal | Référence f6f7a32a | 9.28 | 106.9 / 101.1 | 131.0 / 113.5 | 59.9 | 64.1 | 4562 | 19.34 M |
| Fonctionnement normal | Correction | 10.41 | 93.5 / 91.2 | 108.2 / 104.3 | 47.4 | 62.5 | 4511 | 19.62 M |
| Invalidation continue | Référence f6f7a32a | 8.89 | 109.9 / 104.2 | 125.9 / 138.6 | 53.5 | 44.8 | 4530 | 19.58 M |
| Invalidation continue | Correction | 9.98 | 98.3 / 94.6 | 112.1 / 119.8 | 42.3 | 42.8 | 4336 | 19.13 M |

Le fonctionnement normal passe de **9,28 à 10,41 FPS (+12,1 %)** ; le temps CPU
inclusif de rendu passe de **59,9 à 47,4 ms (-20,8 %)**. Avec invalidation continue,
la cadence passe de **8,89 à 9,98 FPS (+12,3 %)** et le CPU de **53,5 à 42,3 ms**.

Ces résultats ne sont pas une promesse de FPS dans le navigateur interactif.
Les animations autonomes, les poses et les trajets diffèrent légèrement entre
chargements ; les petits écarts de géométrie rendue ne correspondent pas à une
suppression de contenu. Les profils CPU et les requêtes GPU ajoutent aussi un
coût de mesure commun aux versions. Les anciennes séries autour de 7 FPS et la
première série de corrections ne sont pas mélangées à ce résultat : l'alimentation
et la charge de la machine ont changé pendant la session.

## Causes confirmées et corrections

### Limites des maillages animés

Les tests de frustum, les receveurs d'ombres et les caméras de réflexion lisaient
plusieurs fois les mêmes limites. Chaque lecture reconstruisait l'enveloppe
osseuse, même si la pose n'avait pas changé.

`animatedFrustumCulling.ts` conserve maintenant l'enveloppe tant que toutes les
matrices des os qui y contribuent et le bind inverse restent identiques. Une
modification de morph target reconstruit les boîtes ; une modification directe
d'un os ou du bind inverse invalide également la réutilisation. Aucun seuil de
mouvement, saut de frame ou échantillonnage de sommets n'est ajouté.

`useGLTFClone.ts` configure ces limites conservatrices pour les autres clones
SkinnedMesh, afin d'éviter les calculs exacts sommet par sommet lors des recherches
de limites dans la scène. Les géométries, animations et matériaux sont conservés.

### Recherche inutile de receveurs d'ombres

`getUnusedShadows` calculait les boîtes de tous les receveurs avant de constater
qu'un miroir visible imposait déjà de conserver les ombres hors du champ principal.

`visibleShadowReceivers.ts` détecte maintenant les miroirs visibles avant ce
parcours coûteux. La recherche complète reste active lorsqu'elle permet réellement
d'exclure une ombre. Les lampes éteintes et l'initialisation des textures d'ombres
conservent leur comportement précédent.

Dans les profils continus finaux, le coût inclusif échantillonné de cette recherche
était d'environ 884 ms sur un passage de référence de 10 s. Il disparaît des
principaux points chauds après correction. Ces temps inclusifs se recouvrent avec
leurs appels enfants et ne doivent pas être additionnés.

## Ventilation exploratoire et limites restantes

Une première série, avant changement d'alimentation, a temporairement isolé des
fonctions. Ce sont des indices de contribution, pas des comparaisons ABBA ni des
gains cumulables :

| Condition temporaire | FPS | Appels/image | Triangles/image |
|---|---:|---:|---:|
| Scène complète, rendu continu | 7,21 | 4532 | 19,57 M |
| Reflets désactivés | 9,58 | 2267 | 10,95 M |
| Ombres désactivées | 7,98 | 3817 | 15,41 M |
| Personnages humains masqués | 9,35 | 3515 | 16,77 M |

Masquer un groupe ne suspend pas nécessairement ses simulations. Ces mesures ne
séparent donc pas à elles seules l'animation de l'IA ou de la physique.

Les compteurs élevés sont réels : le collector désactive l'auto-reset Three.js et
additionne le rendu principal, les reflets et les ombres. Deux rendus de réflexion
256 × 256 sont présents dans cette vue. Les détails des soumissions font notamment
apparaître les robots Jumper, Unitree G1/Go2, le sac DIMPA et les personnages ; les
personnages humains n'expliquent pas seuls les 20 millions de triangles.

La suppression diagnostique de l'UI et du graphe debug n'a pas fourni de gain net
comparable à celui des corrections retenues. Les coûts React/layout ne dominent
pas cette vue dans les profils capturés.

L'essai retirant du rendu les lampes d'intensité nulle a déclenché une compilation
synchrone de shader d'environ 5 s pendant une fenêtre de mesure. Il n'est pas retenu
comme preuve d'une optimisation ou d'une régression en régime établi, et aucune
modification de ces lampes n'est appliquée.

Sur secteur, désactiver la physique des personnages ne donne pas de gain stable :
les passages corrigés sont à 9,79 et 7,84 FPS, avec un p95 de 397,5 ms pour le second.
Les profils résiduels montrent des coûts de recherche de trajets, de collisions et
de contact des pieds de l'oiseau. Il faut traiter ces pics séparément des coûts de
rendu. La physique ne doit pas être désignée comme cause sur la base de cet essai.

La scène reste lente. Les reflets et le rendu de nombreux maillages détaillés
restent coûteux ; la navigation produit également des pics CPU. Une prochaine
optimisation devrait mesurer le regroupement des objets rigides compatibles et
la réutilisation des calculs de navigation, en préservant interactions et collisions.
Aucune de ces fonctions n'a été supprimée pour améliorer artificiellement le bilan.

## Validation et reproduction

Commandes passées avec succès :

```bash
npx tsc --noEmit
npm run build
node scripts/temp_lara_profile.cjs --checks
node scripts/temp_frustum_triangles_check.cjs --unit
ROOM_TEST_URL=http://127.0.0.1:5190 node scripts/temp_frustum_triangles_check.cjs
```

Le test navigateur vérifie 291 maillages et 545 282 sommets de la scène, puis les
poses d'animation des animaux et d'une perruque : chien (26 poses), oiseau (61 poses),
perruque (2 poses dont une fixation avec vent). Aucune violation des limites,
aucune erreur WebGL ; les ombres et les reflets reprennent après retour vers la
scène. Les tests unitaires couvrent aussi la réutilisation, les changements directs
d'os, les morphs, le scale non uniforme et le court-circuit des miroirs.

Pour refaire la comparaison (fermer les autres pages 3D et garder l'alimentation
stable pendant toute la série) :

```bash
node scripts/temp_lara_profile.cjs --scene-profile --baseline-ref=f6f7a32a --label=ac-final --conditions=natural,continuous,no-physics
```

La référence est servie en mémoire via Vite ; le script ne réécrit pas les fichiers
de travail. Tous les navigateurs passent par `browser-test-options.cjs` et restent
headless. Les modes obsolètes de comparaison de flous ont été remplacés par ce
profilage général ; `--verify-inventory` ne demande plus l'absence de flous dans la scène.

Artefacts bruts : `/tmp/room-scene-ac-final/summary.json`, les fichiers `.cpuprofile`
du même dossier et `/tmp/room-scene-ac-final.log`. La ventilation initiale est dans
`/tmp/room-scene-diagnostic/`. Validation : `/tmp/room-performance-validation.log`.
Ces fichiers temporaires peuvent être régénérés avec le script conservé dans Git.

Référence technique : [SkinnedMesh, limites de géométrie animée](https://threejs.org/docs/pages/SkinnedMesh.html).
