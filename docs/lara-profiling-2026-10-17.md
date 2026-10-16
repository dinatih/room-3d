# Lara : éviter les palettes de skinning dupliquées

Le GLB Lara natif contient un seul skin de 90 os, réparti en 32 meshes glTF / 36 primitives. Le modèle source complet représente 88 399 triangles, variantes corporelles incluses ; tout n'est pas visible simultanément.

Après SkeletonUtils.clone, chacune des 36 primitives possède son propre objet Skeleton, alors que les références d'os et les matrices inverses sont identiques. La scène par défaut de ce test contient six Lara et Xbot, soit 216 Skeleton pour les seules Lara avant correction.

## Correction conservée

Après le clonage, les meshes du même clone partagent leur Skeleton uniquement si la liste ordonnée des objets Bone et toutes les matrices inverses sont exactement identiques. Chaque mesh garde sa géométrie, ses matériaux, ses matrices de liaison et sa visibilité. Les clones des différents personnages gardent leurs propres os et animations.

Cette correction se trouve dans shareSkeletons.ts, appelé par useGLTFClone avant de configurer les bornes animées. Elle évite de recalculer et transférer au GPU plusieurs palettes représentant les mêmes os. Elle profite aussi aux autres GLB qui présentent la même duplication.

Le pendentif n'appelle plus Skeleton.update avant chaque raycast : SkinnedMesh.applyBoneTransform lit directement les matrixWorld des os et les matrices inverses. Le renderer reste responsable des palettes GPU. Les collisions et leur fréquence restent identiques.

Références moteur : [SkeletonUtils](https://threejs.org/docs/pages/module-SkeletonUtils.html), [SkinnedMesh r185](https://github.com/mrdoob/three.js/blob/r185/src/objects/SkinnedMesh.js).

## Vérifications

- Sur un clone réel de Lara : 36 Skeleton avant, un après.
- Six personnages gardent six Skeleton indépendants.
- 185 832 positions de sommets vérifiées dans trois poses : écart maximal nul.
- Tests de non-fusion pour des os différents, un ordre différent et des matrices inverses différentes.
- Tests des bornes animées et ombres existants toujours passants.
- TypeScript et build de production passants.
- Aucun personnage, triangle, matériau, animation, ombre, reflet ni backdrop-filter supprimé. Aucun changement de résolution ou de fréquence d'animation.

## Mesures exploratoires dans la scène complète

Chromium headless via browser-test-options.cjs, AMD Radeon 840M confirmé par SystemInfo, ANGLE/Vulkan matériel, secteur, viewport 1362 × 810, DPR 1. Caméra fixe, sol bermuda, activités des personnages par défaut. Chauffe de 12 s après lancement, puis capture de 10 s par passage avec profil CPU et timers GPU. Un seul navigateur de mesure à la fois.

Comparaison avant/après/après/avant, en remplaçant uniquement useGLTFClone.ts et CharacterPendant.tsx par leur version du commit ba0b6a73 pour les passages avant. Les modifications préexistantes de smartObjectRegistry et les assets restent identiques.

| Passage | FPS | Image médiane / p95 (ms) | Rendu CPU moyen (ms) | GPU moyen (ms) | Appels moyens | Triangles moyens |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Avant 1 | 5,95 | 160,2 / 232,0 | 93,53 | 103,10 | 4 693 | 20,05 M |
| Après 1 | 9,87 | 98,6 / 128,3 | 51,53 | 68,06 | 4 646 | 19,97 M |
| Après 2 | 9,39 | 104,9 / 128,2 | 55,66 | 71,95 | 4 677 | 20,05 M |
| Avant 2 | 8,58 | 114,2 / 142,2 | 60,56 | 74,86 | 4 658 | 19,97 M |

Le premier passage avant est nettement plus lent malgré la chauffe. Ne pas annoncer un gain de 66 % ou assimiler la moyenne de ces quatre passages à un gain stable. Par rapport au dernier passage avant, les passages après sont environ 10 à 15 % plus rapides. Les PNJ continuent leurs activités : le travail exact varie, bien que les compteurs géométriques restent proches. Ces résultats headless ne prédisent pas directement les FPS dans le navigateur utilisateur.

Ces passages après contenaient aussi un prototype de cache des sommets pendant les raycasts du pendentif. Le profil réel ne relevait que 0,005 à 0,028 ms de raycasts Lara par image ; ce prototype n'a donc pas été conservé. Le replay initial de ces rayons après déplacement des personnages ne rencontrait plus le torse : il ne valide pas les collisions et n'est pas retenu comme preuve de gain. Le test final ci-dessous porte sur le code effectivement conservé.

## Vérification finale dans la même page

Version finale, après retrait du prototype de cache. Les quatre passages alternent uniquement les palettes distinctes / partagées, sur les mêmes objets de scène, pendant 10 s après 4 s de stabilisation :

| Passage | FPS | Image médiane / p95 (ms) | Skeleton.update (ms/image) | Appels Skeleton.update/image | Transferts texSubImage2D/image |
| --- | ---: | ---: | ---: | ---: | ---: |
| Distincts 1 | 9,61 | 100,7 / 124,1 | 1,373 | 429,48 | 290,00 |
| Partagés 1 | 8,93 | 101,9 / 125,8 | 0,274 | 78,89 | 47,18 |
| Partagés 2 | 8,75 | 99,1 / 125,2 | 0,269 | 77,40 | 46,99 |
| Distincts 2 | 9,00 | 107,8 / 120,2 | 1,179 | 371,88 | 263,51 |

Moyenne des deux passages de chaque mode : coût CPU des palettes **1,276 → 0,271 ms/image** (environ −79 %), transferts 2D **276,75 → 47,08/image** (environ −83 %). Le compteur Skeleton.update inclut les autres modèles de la scène ; le changement de palette ne concerne ici que les Lara. Le compteur texSubImage2D inclut aussi les autres textures : il mesure un nombre d'appels, pas des octets transférés.

Les FPS moyens, au contraire, ne progressent pas dans cette série finale : 9,31 contre 8,84. Les médianes sont voisines et les PNJ changent de position et d'activité ; les appels de dessin moyens varient de 4 286 à 4 684, les triangles de 18,99 à 20,02 M. **On confirme donc l'économie de calculs et de transferts, sans démontrer de gain stable des FPS globaux.** Le coût CPU ciblé évité est d'environ 1 ms/image, pas les dizaines de millisecondes suggérées par la première paire exploratoire.

La correction conservée est petite et supprime une duplication prouvée, sans échange de qualité. L'augmentation de FPS de 10 à 15 % de la série exploratoire reste une observation à ne pas généraliser.

## Reproduction et artefacts

```bash
node scripts/temp_lara_profile.cjs --inspect-lara-asset
node scripts/temp_lara_profile.cjs --checks
node scripts/temp_lara_profile.cjs --lara-skeletons --label=lara-skeletons-final
node scripts/temp_lara_profile.cjs --scene-profile --label=lara-optimizations --conditions=natural --baseline-ref=ba0b6a73 --baseline-files=src/features/scene/useGLTFClone.ts,src/features/scene/character/CharacterPendant.tsx
```

Le mode lara-skeletons compare dans la même page des Skeleton distincts par mesh et des Skeleton partagés. Les os et matrices restent identiques ; les mises à jour, appels de dessin et transferts de textures sont comptés. Le test recrée les duplications au niveau des Skeleton, sans toucher aux personnages ou au décor. Les textures des deux modes peuvent rester allouées dans cette page de test : ce protocole n'est pas une mesure d'économie VRAM en production.

Artefacts locaux :
- /tmp/room-lara-skeletons-final/summary.json et gpu.json : validation finale et comparaison dans la même page.
- /tmp/room-lara-skeletons/summary.json : première mesure isolant le partage des Skeleton ; coût CPU de Skeleton.update de 1,97–2,60 à 0,68–0,73 ms par image, sans gain net de FPS dans cette première série.
- /tmp/room-scene-lara-optimizations/summary.json : série exploratoire ci-dessus.
- /tmp/room-scene-lara-optimizations/*.cpuprofile : profils CPU.
- /tmp/room-lara-optimization-build.log : build final.

Les coûts restants concernent notamment le rendu de milliers de groupes et les passes répétées de couleur/ombres/reflets. Le partage des Skeleton ne réduit pas ces appels de dessin ni la géométrie à rendre.
