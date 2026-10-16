# Robots : réduire les appels de dessin sans pénaliser le GPU

## Implémentation conservée

Les pièces rigides de Go2 et Jumper dont la géométrie est strictement identique sont regroupées avec InstancedMesh. La comparaison vérifie les octets des attributs et des indices, ainsi que les matériaux et propriétés de rendu compatibles. Aucun attribut, texture, triangle ou détail n'est supprimé pour permettre le regroupement.

Les pièces uniques restent des Mesh standards, sans shader de batching. Les matériaux strictement équivalents sont partagés : le rendu du G1 utilise deux matériaux au lieu de 35 ; ses géométries sont différentes et ses 35 pièces restent donc distinctes. Go2 passe de 33 à 16 groupes de rendu et Jumper de 41 à 34.

L'arbre d'articulations et les géométries originales sont conservés pour les animations, dimensions et contacts des pieds. Seuls les noeuds visuels feuilles sont masqués ; les groupes de rendu assurent le raycasting. Après chaque callback d'animation, leurs matrices relatives au modèle sont synchronisées, uniquement réécrites lorsqu'elles changent. La racine de rendu suit celle du GLB, sans imposer de placement monde.

La visibilité et le raycasting des sources sont restaurés au nettoyage. Les ressources propres aux instances sont libérées sans disposer les matériaux et géométries partagés. Les composants gardent leur API, leurs actions et leurs fichiers GLB. Les miroirs, ombres, personnages, backdrop-filter et optimisations précédentes restent présents.

## Validation isolée

Chromium headless, Radeon 840M matérielle via ANGLE/Vulkan. Comptage des fonctions drawElements/drawArrays, variantes instanciées et multiDraw, en plus des compteurs Three.js. Les soumissions et les triangles sont comptés séparément : une commande instanciée affiche plusieurs pièces mais ne retire pas leur géométrie.

Vue isolée de chaque robot, sol receveur et ombres complètes, 512 × 512. Les chiffres incluent le sol :

| Modèle | Pièces → groupes | DC avant → après | Triangles avant/après |
| --- | ---: | ---: | ---: |
| G1 | 35 → 35 | 71 → 71 | 786 506 |
| Go2 | 33 → 16 | 67 → 33 | 793 886 |
| Jumper | 41 → 34 | 83 → 69 | 861 832 |

Les trois vues totalisent **221 → 173 DC (−21,7 %)**. Le G1 bénéficie du partage des matériaux, mais pas d'une baisse de DC. Ce résultat isolé ne prédit pas le pourcentage de gain dans la scène complète.

Vérifications passées :

- 57 poses réparties sur les 19 animations/actions. Écart maximal entre éléments des matrices monde : environ 5,1e-6 pour les instances float32 ; G1 en Mesh standard : environ 4,3e-14.
- Bornes contenant les sommets de toutes les poses, y compris avec parent translaté, tourné et mis à l'échelle.
- Comparaison des images avec ombres : G1 identique ; Go2 sept canaux de pixels différents sur 1 048 576, écart maximal 2/255 ; Jumper un canal différent de 1/255. Les différences proviennent de la précision des matrices instanciées.
- Raycasting, restauration et recréation après nettoyage, absence de destruction des ressources sources.
- Previews React avec StrictMode et CategoryLayerGroup : chaque action est jouée puis rejouée, dimensions valides et groupes attendus, aucune erreur de page.
- Tests existants des palettes de skinning, bornes animées et ombres.

Les tests de bornes portent sur les sommets réellement rendus et non sur l'inclusion des anciennes AABB, qui peuvent être plus larges après rotation.

## Essai BatchedMesh écarté

Le premier regroupement par matériau avec BatchedMesh avait réduit beaucoup plus de DC : les trois vues isolées passaient de 221 à 23 soumissions, sans changer les triangles. Mais la comparaison complète ABBA a montré une régression : avant 7,56 / 7,35 FPS, après 7,02 / 7,16 FPS, soit environ −4,9 % sur la moyenne des deux passages. Le coût GPU était plus élevé. Cette variante n'est pas conservée.

Une série encore antérieure avait montré un double affichage parce que CategoryLayerGroup réassignait les calques des sources. Elle a été interrompue et écartée. Le masquage définitif utilise visible=false sur les feuilles et ne dépend pas des calques. Le profilage contrôle l'absence de sources encore affichées à côté des groupes.

La variante finale utilise l'instancing natif de WebGL2 et ne dépend pas de WEBGL_multi_draw. Elle évite le shader BatchedMesh et conserve le shader standard pour les pièces uniques.

## Protocole scène complète

Référence d77e0ee4, conservant les optimisations précédentes. La comparaison remplace uniquement les composants Unitree/Jumper pour la référence ; les changements préexistants étrangers à la tâche et les assets sont identiques.

Preset mid explicite, mode orbit en perspective, caméra fixe, sol bermuda, viewport 1362 × 810, DPR 1, sept personnages et trois robots. Ombres, miroirs et UI conservés. Ordre avant/après/après/avant, 12 secondes de chauffe après lancement, puis 3 secondes de stabilisation et 10 secondes de mesure. Les activités autonomes restent actives et peuvent faire varier les poses et le culling. Un seul navigateur de mesure à la fois.

Les temps CPU et GPU se recouvrent et ne s'additionnent pas. Les profils et compteurs ajoutent un coût de mesure commun. La baisse des DC et le gain éventuel de FPS sont rapportés séparément ; les résultats headless ne prédisent pas directement les FPS du navigateur visible.

## Mesures finales de la scène complète

Les quatre passages autonomes ont la même caméra et un buffer de 1362 × 810. **L’ordinateur était sur batterie** : ACAD=0 et BAT1=Discharging aux quatre relevés. Ces FPS ne doivent pas être comparés aux séries historiques sur secteur.

| Passage autonome | FPS | Médiane / p95 image (ms) | CPU rendu moyen (ms) | GPU moyen (ms) | DC moyens | Triangles moyens |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Avant 1 | 7.53 | 131.3 / 147.5 | 61.72 | 91.87 | 4663 | 19.96 M |
| Après 2 | 7.59 | 129.1 / 149.9 | 59.71 | 86.61 | 4451 | 18.70 M |
| Après 3 | 7.42 | 131.1 / 148.1 | 58.67 | 91.73 | 4565 | 20.07 M |
| Avant 4 | 7.53 | 131.2 / 148.2 | 60.45 | 92.45 | 4673 | 20.00 M |

FPS moyens : **7,53 avant, 7,50 après (−0,3 %)**. Pendant un passage après, G1 sortait partiellement du champ des reflets : les 1,3 million de triangles de moins de ce passage ne sont pas une simplification et ne doivent pas être attribués au regroupement.

### Même page, robots à positions contrôlées

Les robots jouent leurs locomotions sur place aux positions de départ fixes, sans patrouille automatique. Les sept humains continuent leurs activités. La page alterne meshes originaux et optimisés sans rechargement. Le contrôleur de synchronisation reste présent dans les deux modes : ce test isole le rendu. Ces réglages diagnostiques ne sont pas appliqués à l’application.

| Passage | FPS | Médiane / p95 image (ms) | CPU rendu moyen (ms) | GPU moyen (ms) | DC scène moyens | DC robots |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Avant 1 | 7.73 | 128.1 / 140.4 | 58.66 | 92.46 | 4656 | 545 |
| Après 2 | 7.75 | 126.2 / 140.3 | 57.03 | 89.41 | 4500 | 425 |
| Après 3 | 7.01 | 138.1 / 173.3 | 50.65 | 68.66 | 4311 | 425 |
| Avant 4 | 7.12 | 139.0 / 150.5 | 51.67 | 71.41 | 4554 | 545 |

**Robots : 545 → 425 DC par image (−22,0 %), avec exactement 6 105 545 triangles rendus dans les deux modes, passes comprises.** Cela représente **120 DC évités par image**, environ **2,6 %** d’une scène à 4 600 DC. Les variations supplémentaires du compteur global viennent des autres acteurs et ne sont pas annoncées comme un gain de cette optimisation.

FPS moyens : **7,42 avant, 7,38 après (−0,6 %)**. Les temps CPU/GPU ciblés diminuent légèrement, mais la cadence globale ne progresse pas de façon stable. Le résultat livré est une réduction prouvée des soumissions sans changement de qualité, avec une cadence globalement équivalente ; aucune hausse des FPS utilisateur n’est promise.

## Reproduction

```bash
node scripts/temp_lara_profile.cjs --robot-check
node scripts/temp_lara_profile.cjs --checks
node scripts/temp_lara_profile.cjs --robot-paired
node scripts/temp_lara_profile.cjs --scene-profile --label=robot-instances-final --conditions=natural --baseline-ref=d77e0ee4 --baseline-files=src/features/scene/items/Unitree.tsx,src/features/scene/items/Jumper.tsx
npx tsc --noEmit
npm run build
```

Artefacts locaux :

- /tmp/room-robot-batches/checks.json et /tmp/room-robot-instances-check.log : tests de la variante finale.
- /tmp/room-scene-robot-instances-final/summary.json, gpu.json et profils CPU : comparaison finale.
- /tmp/room-robot-instances-final.log et /tmp/room-robot-instances-build.log.
- /tmp/room-robot-paired/summary.json, gpu.json et /tmp/room-robot-paired.log : comparaison dans la même page.
- /tmp/room-scene-robot-batches-final : comparaison du prototype BatchedMesh écarté.
- /tmp/room-scene-robot-batches : série invalide avec double affichage, à ne pas exploiter.

Référence technique : [InstancedMesh](https://threejs.org/docs/pages/InstancedMesh.html).
