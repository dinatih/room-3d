# Réduire le travail répété des receveurs d'ombres

## Correction

Le contrôle des ombres parcourait deux fois toute la scène pour trouver les
lumières puis les miroirs. Sans miroir visible, il calculait ensuite les bornes
de tous les receveurs et en clonait chaque boîte, avant de chercher un seul
receveur utile pour chaque lumière.

Les lumières et les miroirs sont maintenant collectés dans le même parcours.
Les limites des lumières actives sont préparées, puis les receveurs sont examinés
jusqu'à ce que chaque lumière ait une couverture confirmée. Les lumières sans
couverture exigent toujours le parcours complet. Les boîtes des receveurs ne
sont plus copiées dans une liste temporaire.

Il n'y a aucun résultat conservé d'une image à l'autre : déplacements, squelette,
morphs, visibilité, matériaux, calques et vues multiples sont réévalués. Les
miroirs restent conservateurs ; une carte d'ombre non initialisée reste rendue
une fois, même pour une lumière éteinte. Les tests de couverture directionnelle,
spot et ponctuelle, ainsi que les biais, sont inchangés.

## Mesure sur sept personnages animés en Mid

Le scénario `shadow-receivers` charge l'appartement réel avec les sept personnages
par défaut (six Lara et Xbot), en Mid, caméra orbitale fixe, 1280 × 720, DPR 1.
Chromium headless utilise la Radeon 840M via ANGLE/Vulkan. Sur chaque image,
l'ancienne et la nouvelle fonction sont appelées avec la même scène et la même
caméra ; leur ordre alterne. Les décisions d'ombres sont comparées exactement.

| Configuration | Coût médian avant | Coût médian après | p95 avant → après |
| --- | ---: | ---: | ---: |
| Miroirs activés | 3,3 ms | 0,7 ms | 5,7 → 2,1 ms |
| Miroirs désactivés pour le diagnostic | 5,6 ms | 2,1 ms | 10,1 → 4,4 ms |

Les décisions sont identiques sur les 180 images comparées, soit 90 par mode.
Ces valeurs mesurent la fonction de contrôle, pas le coût du rendu des ombres,
le temps GPU, le FPS global ou le nombre de freezes. L'exécution de la référence
ajoute du travail au navigateur de test. Les miroirs restent activés dans la
configuration applicative d'origine ; leur désactivation est limitée au second
mode de ce diagnostic et restaurée ensuite.

Rapport local :
`test-results/2026-10-19T19-08-14.385Z-studio/shadow-receivers/result.json`.

Une seconde exécution, après fermeture du navigateur de profilage global décrit
plus bas, confirme les mêmes décisions sur 180 images supplémentaires. Dans ce
passage, la médiane est de 2,0 → 0,4 ms dans chacun des deux modes ; les p95 sont
de 2,9 → 0,6 ms avec miroirs et 2,8 → 1,1 ms sans miroirs. L'écart entre les temps
absolus des deux exécutions rappelle l'influence de la charge de la machine.
Rapport final :
`test-results/2026-10-19T19-15-24.891Z-studio/shadow-receivers/result.json`.
Le navigateur, le serveur et le cache temporaire de ce test ont été fermés/supprimés.

## Régressions et reproduction

Une fixture conserve l'ancienne implémentation exhaustive du commit `3fdd30b4`
comme oracle uniquement dans les tests. Les tests vérifient les lumières
directionnelles/spot/ponctuelles, les biais positifs et négatifs, les cartes non
initialisées, les lumières éteintes, les groupes et matériaux masqués, les calques,
les miroirs, les vues multiples, les instances et les déformations squelettiques
avec morphs. Un cas synthétique de 100 receveurs confirme que la nouvelle méthode
ne mesure qu'une boîte quand la première suffit. Un miroir visible nécessite un
seul parcours de scène au lieu de deux.

Les paramètres du scénario se trouvent dans `tests/fixtures/rendering.cjs` ; il
réutilise la configuration 7-Mid de la campagne de performance. Validation finale :
23 tests rapides passants, test navigateur passant, TypeScript et build passants.

```bash
npm test
npm run test:studio -- --case=shadow-receivers --hardware-gpu
npx tsc --noEmit
npm run build
```

Comparaison des images complètes en ordre avant/après/après/avant, avec profils
CPU et conditions de rendu conservées :

```bash
node scripts/temp_lara_profile.cjs --scene-profile --label=shadow-scan-2026-10-19 --conditions=natural --baseline-ref=3fdd30b4 --baseline-files=src/features/scene/utils/visibleShadowReceivers.ts
```

Le script remplace uniquement ce module pour les passages de référence, sans
modifier les sources sur disque. Il conserve les activités autonomes : les
positions, animations et charges exactes peuvent varier. Les profils CPU et les
compteurs détaillés ajoutent du travail. Cette comparaison ne doit pas servir
à promettre le même FPS dans le Chrome de l'utilisateur.

## Limite de la comparaison globale et pression mémoire observée

La campagne globale a été arrêtée volontairement avant son quatrième passage :
sur l'hôte de 11 Gio, `free -h` indiquait environ 576 Mio disponibles et plus de
10 Gio de swap occupés. `vmstat 1 3` a relevé une période avec 213 228 Kio/s de
sorties vers le swap, puis une avec 159 668 Kio/s d'entrées et 131 144 Kio/s de
sorties. Ce sont des mesures du système entier, pas du seul onglet utilisateur.
Notre navigateur de profilage contribuait lui-même à cette pression.

Les trois passages enregistrés montrent respectivement 13,1 FPS avant, puis
9,5 et 8,6 FPS après. Ils ne démontrent donc pas de gain global. Le coût GPU moyen
varie aussi fortement (38,1 puis 50,3 ms sur les deux premiers passages), tandis
que les charges et les activités ne sont pas figées. La mémoire, le swap et
l'absence du dernier passage de référence empêchent d'attribuer ces écarts à la
modification de code. Ils ne doivent pas être utilisés comme référence approuvée.

Le navigateur et le serveur de ce profilage ont été arrêtés ; la mémoire disponible
est remontée à environ 3 Gio immédiatement après sa fermeture. Le gain ciblé
ci-dessus reste vérifié sur une même image avec les mêmes données. Il ne prouve
pas la disparition des freezes ; il faut aussi réduire la pression mémoire de la
scène et reprendre une mesure globale avec une marge de RAM suffisante.

Artefacts : `/tmp/room-scene-shadow-scan-2026-10-19/summary.json` et les profils
CPU voisins. Le journal `/tmp/room-shadow-scene.log` contient une erreur de cible
fermée attendue lors de cet arrêt volontaire, pas un crash spontané de l'app.
