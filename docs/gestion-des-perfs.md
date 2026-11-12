# Gestion des perfs de l’app

## Référence et commandes

Le scénario de suivi est la vue studio orbitale par défaut, caméra fixe, **9 personnages, preset Mid**, animaux et robots par défaut. Deux conditions indépendantes : midi et minuit, date astronomique fixée au 9 novembre 2026, beau temps, sol sec, profil navigateur neuf, graine 20261019, viewport 1362 × 810 et DPR 1. L’horloge mondiale est figée par une transformation Vite réservée aux tests ; les animations continuent. Aucun code de rendu de l’application n’est modifié par ce suivi.

Après redémarrage, laisser la machine revenir à une température stable, fermer les onglets lourds et lancer sur secteur ou sur batterie :

```bash
npm run test:perf -- --case=studio-9-mid-day,studio-9-mid-night --hardware-gpu
```

Le test lance ses propres Vite et Chromium headless ; aucun serveur manuel n’est nécessaire. Trois chargements indépendants par scénario, chargement/préparation puis 15 secondes de chauffe et 60 secondes mesurées. La scène reste active grâce au mécanisme d’activité existant du test, sans forcer l’invalidation continue dans ces nouveaux scénarios. Les anciens cas 0/7/15 conservent leur fonctionnement historique et ne sont pas comparables à ces nouveaux cas.

L’avancement est affiché par défaut, sans option supplémentaire : numéro du passage, démarrage Vite/Chromium, chargement et personnages prêts, puis chauffe et mesure avec un point toutes les cinq secondes (FPS récents, programmes GPU, mémoire disponible et alimentation). Les durées prévues de chaque phase et son résultat sont affichés. Les messages sont horodatés en UTC et écrits immédiatement dans le terminal et `runner.log`. Les warnings Sass et GPU restent visibles et conservés : le mode `verbose` de Sass n’est pas activé. Une commande déjà en cours conserve l’ancien affichage jusqu’à son prochain lancement.

Les rapports JSON/Markdown, captures `scene.png`, erreurs et mesures partielles restent dans `test-results/<date>-perf/`. Les sources de vérité sont le commit, l’indicateur de modifications locales et les conditions enregistrées. Une capture s’ouvre avec `xdg-open '/chemin/absolu/scene.png'`.

Après examen d’une campagne saine, créer explicitement une référence, puis comparer les prochaines features :

```bash
npm run test:perf -- --case=studio-9-mid-day,studio-9-mid-night --hardware-gpu --approve-reference=studio-mid-initial
npm run test:perf -- --case=studio-9-mid-day,studio-9-mid-night --hardware-gpu --reference=studio-mid-initial
```

Le nom fourni est un nom de base : le test détecte l’alimentation et ajoute automatiquement `-ac` (secteur) ou `-battery` (batterie). Ainsi les commandes ci-dessus créent ou comparent `tests/references/studio-mid-initial-ac.json` sur secteur et `tests/references/studio-mid-initial-battery.json` sur batterie. Répéter la commande de création une fois dans chaque condition pour constituer les deux références. Les références ne contiennent aucun résultat fictif avant ces mesures. Si la référence de l’alimentation actuelle manque, la comparaison échoue explicitement ; aucun emprunt à l’autre alimentation n’est effectué.

La première commande effectue une nouvelle campagne : elle ne convertit pas une ancienne exécution. Une référence existante n’est jamais écrasée. Les références utilisent désormais le schéma 3 ; les anciennes références doivent être remesurées. Le navigateur, GPU, OS, résolution, caméra, personnages, calques, graine, scénario et alimentation doivent correspondre exactement. Une alimentation inconnue ou modifiée pendant un passage ou entre les passages empêche la création/comparaison de référence ; les diagnostics restent conservés. Les alimentations secteur et USB prises en charge par Linux sont interrogées au début du passage, pendant les phases mesurées et à la fin. Un branchement/débranchement très bref entre deux relevés peut échapper à l’échantillonnage.

## Indicateurs et interprétation

- FPS = nombre d’intervalles rendus / somme de leur durée. Temps d’image médian, p95, p99 et maximum pour distinguer fluidité et saccades. Le démarrage conserve l’instrumentation rAF historique ; les phases chauffe/session des nouveaux cas suivent les rendus de la scène principale.
- Appels de dessin et triangles : différence des compteurs Three.js autour du rendu principal, incluant les passes imbriquées des miroirs et des ombres. Une passe de miroir n’est pas une nouvelle image à l’écran.
- CPU render : durée inclusive de l’appel au renderer ; elle n’inclut pas toute l’IA ni tous les callbacks R3F. Le temps d’image permet de voir leur effet global. Pour les attribuer, effectuer un profil CPU séparé avec `scripts/profile-npc-startup.cjs`, dont le scénario Low historique diffère du suivi Mid.
- Temps GPU : requêtes asynchrones `EXT_disjoint_timer_query_webgl2`. Les résultats invalidés sont écartés et comptés ; l’absence de l’extension ou de résultats est explicite. Les dernières requêtes peuvent rester en attente en fin de fenêtre. CPU et GPU se chevauchent : ne pas additionner leurs durées.
- Matériaux uniques de la scène, programmes GPU alloués, textures et géométries : indicateurs de complexité et d’allocation, pas mesure directe de coût. Les objets masqués peuvent garder leurs ressources. Un shader complexe peut coûter davantage que plusieurs shaders simples.
- Tas JavaScript et RSS Chromium (les pages partagées sont comptées plusieurs fois), mémoire disponible et swap hôte. Charge système, alimentation et températures des zones thermiques exposées par Linux sont enregistrées chaque seconde ; les capteurs absents sont signalés. Les températures ne démontrent pas à elles seules une baisse de fréquence.

Les écarts absolus et relatifs apparaissent dans le rapport. Une alerte est émise si tous les passages se situent au-delà de la plage min/max de référence dans le mauvais sens (hausse des temps/coûts, baisse des FPS). C’est un signal descriptif sur trois passages, pas un test statistique ni un blocage automatique. Des plages qui se chevauchent demandent une nouvelle mesure si l’écart est préoccupant.

Une hausse du swap ou un changement d’alimentation est signalé. Examiner aussi les températures et la charge : ne pas accepter une référence perturbée. Les FPS ne sont pas corrigés selon l’alimentation ou la mémoire : ce sont deux références distinctes, pas une estimation de ce que donnerait la machine sur secteur. L’absence de GPU matériel vérifié provoque un échec explicite ; SwiftShader/llvmpipe ne servent jamais de référence FPS.

## Procédure pour chaque feature

1. Mesurer avant/après avec les mêmes conditions et alterner les versions (A/B/B/A pour une enquête). Garder une seule instance du navigateur de test à la fois.
2. Lire les écarts de temps d’image, CPU/GPU, appels, triangles, matériaux et programmes ; examiner mémoire, erreurs et captures jour/nuit.
3. Documenter le coût dans la description de la modification. En cas d’alerte, isoler la cause et répéter avant de changer la référence.
4. Optimiser un coût confirmé à la fois. Préserver le rendu ; si une approximation est retenue, documenter son effet visuel et le mode qui garde le rendu détaillé. Vérifier aussi le cycle normal météo/jour/nuit après toute modification du rendu.

Pour isoler une famille de coûts, chaque cas jour/nuit possède les suffixes `-no-shadows`, `-no-environment` et `-no-characters`. Exemple :

```bash
npm run test:perf -- --case=studio-9-mid-day,studio-9-mid-day-no-shadows --hardware-gpu
```

Ces cas sont des diagnostics distincts : ne pas comparer leurs conditions via `--reference`. Leur différence indique une sensibilité du scénario ; elle ne permet pas d’additionner les coûts, ni d’attribuer automatiquement une régression à un commit. `no-characters` conserve animaux et robots.

## Enquête initiale du 9 novembre 2026

Observation utilisateur : 22–24 FPS avant les 7–9 novembre, puis 14–15 FPS en Mid à neuf personnages. L’utilisateur a ensuite constaté une forte chauffe de Chrome et prévoit un redémarrage. La contention et une éventuelle limitation thermique constituent donc une hypothèse importante. Aucune cause n’est confirmée et aucun gain FPS n’est annoncé.

| Changements examinés | Agent | Hypothèse à vérifier |
| --- | --- | --- |
| `506d8a8a`, volume des ombres solaires étendu au monde entier | Codex | Plus de géométrie peut entrer dans les passes d’ombres ; comparer appels/triangles et GPU avec/sans ombres. |
| `249efe47`, ajout de lumière lunaire et ombres | Codex | Coût supplémentaire nocturne ; dépend de l’élévation lunaire. |
| `798bff69`, `f00ca110`, éclairage nocturne et séparation du HD | Codex | Changements successifs ; mesurer l’état final, pas supposer que l’activation HD initiale subsiste. |
| `43584533`, péniches animées ; `f1299ffb`, tracé Seine | Antigravity CLI | Les péniches utilisent 48 points ; le tracé est actuellement désactivé par défaut. Pistes secondaires à mesurer. |
| `f7235bb7`, intensités/distances des lampes | Antigravity CLI | Les valeurs lumineuses ne prouvent pas un surcoût ; relever les lumières et leurs passes actives. |
| `f2d1c8a9`, astronomie ; `a7c664f0`, réduction du travail météo/astronomie | Codex | Une correction CPU existe déjà à HEAD ; il faut comparer avant/après dans des conditions identiques. |

Les changements de raccourcis, libellés et caméra FPV de Gemini paraissent moins susceptibles d’expliquer une baisse dans une vue studio fixe. Cette priorité est une lecture du code, pas une preuve expérimentale.

La tentative réelle de campagne matérielle a été refusée : aucun `/dev/dri` dans l’environnement de travail, Chromium expose un renderer logiciel. Le rapport d’échec a été conservé sous `test-results/2026-11-09T19-03-35.840Z-perf/`. Il ne contient pas de référence FPS valide. Les ressources du test sont fermées.

**Travail restant après redémarrage / accès GPU :** établir les références jour/nuit, comparer HEAD à `86d13f7b` (6 novembre) dans des copies isolées avec la même instrumentation et les mêmes dépendances, resserrer par groupes de commits puis confirmer par mesures alternées. Vérifier les différences d’horloge entre versions avant toute comparaison historique. Ensuite seulement corriger les coûts démontrés et mesurer leurs gains. Le runner actuel utilise les imports de sources Vite : la campagne de production et la vérification visuelle du cycle normal restent également à effectuer ; un build réussi ne les remplace pas.

## Validation du suivi

TypeScript et build de production passent. Les tests ciblés couvrent les alertes, l’incompatibilité des conditions et le comptage d’une seule image incluant une passe imbriquée. La suite globale a été lancée et présente des échecs dans les tests existants (notamment chargement de modules, clips Miley et état de navigation des robots) ; ils ne sont pas corrigés dans cette modification des outils de mesure. L’exécution complète sur GPU, les captures de référence et la validation des requêtes GPU réelles restent nécessaires.

Références techniques : [compteurs WebGLRenderer](https://threejs.org/docs/pages/WebGLRenderer), [coût des ombres](https://threejs.org/manual/pages/shadows.html).

## Première campagne complète : 9 novembre, 20:30 UTC

Rapport : `test-results/2026-11-09T20-30-15.143Z-perf/report.md`. Six passages réussis, sur secteur, buffer réel **1362 × 810 pixels**, DPR 1. FPS moyens par passage : jour 11,81 / 11,75 / 11,40 ; nuit 13,62 / 12,45 / 13,99. Le chiffre 14 correspond au dernier passage nocturne, pas à la moyenne de toute la campagne.

Le jour présente environ 2641–2743 appels et 10,65–11,73 millions de triangles par image (médianes), contre 1824–1897 appels et 6,27–7,84 millions la nuit. Temps CPU inclusif du renderer : 24–30 ms ; temps GPU médian : 33–40 ms. Ces durées ne se somment pas et ne couvrent pas tout le travail CPU. Elles orientent l'enquête vers les passes de rendu, sans prouver encore quelle passe est responsable.

Le swap augmente de 60 à 616 Mio suivant le passage : cette campagne reste une observation initiale perturbée, pas une référence propre automatiquement approuvée. La capture utilisateur indique « En veille » ; la moyenne affichée dans cet état ne constitue pas une mesure d'activité comparable. La taille de la capture inclut les bordures du navigateur et ne donne ni le DPR ni la taille exacte du buffer.

Le diagnostic dispose maintenant aussi du suffixe `-no-mirrors`. Comparer séparément le cas normal, `-no-shadows` et `-no-mirrors` avant de modifier les passes. L'environnement de l'agent ne dispose toujours pas de `/dev/dri` : aucune optimisation de rendu ni aucun gain n'est annoncé sur la seule base de cette lecture.

## Isolation ombres/miroirs sur GPU — 9 novembre, 21:10 UTC

L'accès matériel est confirmé hors du bac à sable : Radeon 840M, ANGLE/Vulkan. La campagne initiale a été arrêtée lorsqu'une autre fenêtre 3D ouverte a été signalée ; ses mesures ne sont pas utilisées. La campagne relancée après fermeture a terminé ses neuf passages sans erreur.

| Scénario jour, 9 personnages, Mid | FPS moyens par passage | Médiane des passages |
| --- | --- | --- |
| Normal | 11,39 / 10,73 / 12,83 | 11,39 |
| Sans ombres | 14,34 / 13,92 / 15,73 | 14,34 |
| Sans miroirs | 10,99 / 11,98 / 11,63 | 11,63 |

Sans ombres, les appels médians passent d'environ 2700 à 1760–1974, et les triangles de 10,9–11,7 à 6,8–8,0 millions. Le GPU médian passe de 36–41 à 29–34 ms. La hausse de FPS médiane est de 26 %, mais ce n'est pas un gain applicatif livré : elle provient de la désactivation diagnostique des ombres. Sans miroirs, les plages de FPS et coûts de rendu chevauchent le fonctionnement normal ; aucun gain significatif n'est démontré pour cette caméra. Le Reflector installé suspend déjà les mises à jour d'ombres pendant ses réflexions.

Les cas ont été exécutés successivement, sans alternance ABBA. Le swap augmente sur plusieurs passages (jusqu'à environ 320 Mio pour un passage sans miroirs). Les chiffres orientent les travaux, mais ne constituent pas une référence parfaitement stable ni une attribution de la régression historique.

Un profil CPU distinct de 20 secondes est conservé dans `/tmp/room-cpu-profile-EweKIw/cpu.json`. Pour reproduire :

```bash
node scripts/profile-studio-cpu.cjs --hardware-gpu
```

Le script utilise le même scénario, attend 15 secondes après son chargement puis profile 20 secondes ; il ferme navigateur et serveur et conserve le profil brut dans un répertoire temporaire indiqué dans sa sortie. Il ne mesure pas un gain FPS.

Sur ce profil, environ 1,21 s inclusives concernent le runtime des personnages, dont 0,83 s pour l'animation et 0,37 s pour la simulation. La calibration de marche représente 0,39 s inclusives : vérifier les premières utilisations de nouveaux clips avant d'en déduire un coût permanent. Le rouge-gorge représente 0,49 s inclusives, dont 0,27 s de mesure d'appui. Les limites animées représentent environ 0,20 s sur un chemin du renderer. Ces durées inclusives se chevauchent et ne doivent pas être additionnées.

Les plus gros coûts propres identifiés sont dans le renderer Three.js (paramètres/programmes de matériaux et soumission des maillages). La catégorie native `(program)` ne permet pas d'attribuer son temps à une fonction applicative ou au GPU. Prochaines investigations : compter les changements de programmes et de versions des matériaux, identifier les principaux émetteurs de draw calls et les géométries rendues dans la passe solaire ; comparer ensuite une correction ciblée en alternance avant/après. Aucune baisse de qualité ni optimisation non mesurée n'est appliquée à partir de ce seul profil.

## Audit de comparabilité avec Chrome visible — 9 novembre, vers 22 h UTC

La même cible studio, le même mode orbit, le preset Mid, les neuf personnages, les calques et le sol ont été vérifiés dans l'onglet utilisateur via DevTools. Son buffer réel était 1423 × 735, pour un viewport 1067 × 551 et DPR voisin de 4/3 ; il ne faut pas déduire ces valeurs de la capture seule.

L'effet de la sonde GPU a été testé dans cet onglet en quatre fenêtres successives de 12 secondes : sans/avec/avec/sans les requêtes de `render-metrics.cjs`. Résultats : 18,37 / 18,13 / 18,60 / 18,19 FPS. L'heure simulée avançait (20 h 22 à 21 h 59) : cet essai ne fige pas tous les facteurs, mais ne montre pas de ralentissement important dû aux requêtes GPU dans ce navigateur.

Après fermeture de l'onglet utilisateur, deux essais headless légers ont été exécutés successivement à midi, viewport 1067 × 551 et DPR 4/3, buffer mesuré 1422 × 734. Ils utilisent 15 secondes de chauffe puis 20 secondes de comptage des rendus, sans collecteur complet ni requêtes GPU : Chromium Puppeteer 156.0.8078.47 donne 11,38 FPS ; Chrome installé 157.0.8103.38 donne 10,17 FPS. Pilote et renderer AMD/Vulkan identiques. Un passage par navigateur ne permet pas d'attribuer une différence aux versions ; changer de version ou retirer le collecteur ne suffit pas ici à retrouver les FPS de l'onglet visible.

Dans un contexte Chrome visible isolé de la sauvegarde utilisateur, l'heure a été fixée à midi après chargement, la météo à beau temps et la cadence mesurée sans sonde GPU. Le premier résultat, 12,51 FPS, utilisait un buffer 2256 × 1430 et doit être séparé des essais à petite taille. Après réduction, le buffer était 1450 × 762 et la cadence 17,64 FPS. Le contexte isolé a ensuite été fermé. Le chemin visible et l'initialisation de son état diffèrent du test headless ; l'écart observé ne prouve pas que le seul mode headless explique tout. Il ne peut pas être corrigé par un coefficient multiplicateur.

**Conséquence :** conserver les campagnes headless comme comparaisons relatives entre modifications sous conditions identiques, et vérifier séparément la fluidité visible. Ne plus présenter leur FPS absolu comme celui de l'onglet utilisateur. Le mode headless est désormais enregistré dans les conditions et annoncé dans le terminal ; les anciennes références sans ce champ doivent être remesurées.

Le compteur de l'app utilisait une moyenne arithmétique des FPS instantanés arrondis. Il utilise maintenant les durées brutes des 80 dernières images actives : `1000 × nombre d'images / somme des durées`. Cela aligne la définition du FPS avec le benchmark, sans rendre identiques une fenêtre de 80 images et une session de 60 secondes. Exemple : une image de 20 ms et une de 100 ms donnent 16,67 FPS réels, pas la moyenne instantanée de 30 FPS. Cette correction améliore la mesure, pas la vitesse de l'application.

## Mémoire des modèles de scène — 10 novembre 2026

L'utilisateur a choisi de privilégier la mémoire en scène, en conservant les originaux haute définition dans les previews. Le manifeste `src/features/scene/scene-models.json` sélectionne 63 modèles d'objets effectivement présents dans la scène. Leurs variantes utilisent des textures de 512 px au maximum, avec le ratio d'origine ; les images entièrement uniformes deviennent des PNG de 1 × 1 pixel. Ce palier ne touche ni les personnages, ni leurs tatouages, ni le panorama, ni les textures procédurales du sol. Les géométries, matériaux, samplers, UV et animations des GLB sont inchangés. Les fichiers originaux restent intacts.

La scène principale choisit ces variantes par contexte React. Les canevas de preview utilisent les originaux. Les préchargements des composants ont été alignés sur ce choix pour éviter de décoder aussi les grandes textures au démarrage. Une fois un GLTF chargé, le hook de clonage abandonne la référence au parseur et à ses buffers intermédiaires, qui ne sont consultés par aucun composant du projet. Les images et géométries encore utilisées restent disponibles.

Les sources HD des modèles concernés sont retirées du cache et libérées après le démontage de leur dernier clone de preview. Les sources allégées de la scène restent partagées. Les références globales de diagnostic aux scènes et renderers démontés sont également supprimées afin de ne pas retenir un ancien canevas. Une preview HD peut temporairement consommer davantage de mémoire tant qu'elle est ouverte.

### Résultats mesurés

Campagne headless originale / allégée / allégée / originale, navigateurs neufs successifs, GPU Radeon 840M, studio à midi, neuf personnages, Mid, 1362 × 810, DPR 1, sur secteur. Après 15 secondes de chauffe et un GC explicite identique dans chaque cas, quatre relevés sont espacés de cinq secondes. Les originaux de contrôle conservent leurs parseurs, pour reproduire le comportement précédent. Les essais incluent donc le gain des textures et celui de la libération des parseurs.

| Métrique | Originaux | Scène allégée |
| --- | --- | --- |
| Pic RSS du processus de rendu, deux passages | 3,92 / 3,93 Gio | 2,65 / 2,65 Gio |
| Pic PSS de l'ensemble des processus du navigateur de test | 4,33 / 4,34 Gio | 3,06 / 3,07 Gio |
| Pixels de base des textures de matériaux, estimation RGBA8 | 1733 / 1735 Mio | 669 / 664 Mio |

Le processus de rendu économise environ **1,27 Gio (32 %)** : approximativement **4,21 Go vers 2,85 Go** en unités décimales. Le total du navigateur reste supérieur au seul processus de rendu : ne pas présenter ce résultat comme une garantie de moins de 3 Go pour tout Chrome. Le gestionnaire des tâches de Chrome peut utiliser un autre périmètre de comptage. La mesure des pixels de base exclut notamment mipmaps et render targets ; elle n'est pas une mesure de mémoire GPU totale. Aucun gain de FPS n'est déduit de cette campagne mémoire.

Résultats détaillés et captures : `/tmp/room-memory-FeBqw1/`. Les états de scène intermédiaires à 1K et les premiers contrôles des parseurs restent dans `/tmp/room-memory-96PkPH/` et `/tmp/room-memory-xhMRCI/`. Le compteur RSS représente les pages résidentes d'un processus ; sommer les RSS compte plusieurs fois les pages partagées. La PSS répartit ces pages entre processus.

### Reproduction et validation

```bash
python scripts/build-scene-models.py
python tests/assets/test_scene_models.py
node scripts/profile-scene-memory.cjs original scene scene original --hardware-gpu
node scripts/test-scene-model-previews.cjs --hardware-gpu
```

Le générateur nécessite Pillow. Les tests Python vérifient les 63 modèles : données binaires hors images identiques, mêmes animations/matériaux/samplers, images inchangées sous le palier et redimensionnement attendu des autres images. Le contrôle navigateur ouvre et ferme deux fois la preview du DJI : elle charge bien ses textures originales 2K, puis la scène reprend sans conserver de clone HD monté. Ce contrôle autorise explicitement l'annulation `ERR_ABORTED` de la requête transitoire du drone pendant la sélection de l'inventaire ; il exige ensuite que le véritable modèle HD soit chargé. Les autres erreurs réseau restent bloquantes.

Un plan très rapproché dans la scène peut montrer moins de détail sur ces objets ; l'inventaire conserve la résolution d'origine. Faire un rechargement complet après mise à jour pour mesurer proprement : HMR et les caches d'une ancienne session peuvent conserver des ressources déjà chargées. Les références précédentes doivent être remesurées : les conditions de performance enregistrent désormais le palier `sceneModels`.

TypeScript, build, tests d'intégrité des GLB et 32 contrôles unitaires ciblés passent. La suite globale présente les échecs déjà observés avant ce travail (chargements de modules dans les mocks, warm-up, clips Miley, état partagé de navigation). Le seul échec ajouté pendant l'adaptation des mocks UTÅKER a été corrigé et son groupe ciblé repassé.

## Réfraction des petits objets — 10 novembre 2026

Le profil CPU de la scène aux textures 512 px montre encore un coût important dans `getParameters` et `getProgram`. Le comptage des soumissions révèle de nombreux changements de programmes pour les mêmes matériaux entre la passe de transmission et l'image finale. Dans Three.js r186, un objet visible avec `MeshPhysicalMaterial.transmission > 0` déclenche une passe qui redessine les objets opaques dans une texture, sans tone mapping, avant le rendu final. Le coût dépasse donc largement celui du verre lui-même.

Ces changements ne signifient pas que tous les shaders sont recompilés à chaque image : les programmes sont en cache. Le coût vient du rendu supplémentaire et du travail de sélection/configuration des variantes.

Trois petits objets activent cette passe dans la vue studio par défaut :

- Téléphone Xiaomi : vitre, transmission 0,5.
- Mini-four Ninja : matériau `Material.002` de la porte, transmission 1 et masque texturé.
- Télécommande Air Performer, intégrée ou indépendante : matériau `ASSET_MAT_MR.001`, transmission 1 et masque texturé.

La correction est réservée à ces composants. Dans tous les presets, High compris, `useSceneGlass` remplace leurs matériaux transmissifs par des clones transparents sans réfraction. Le rouge du masque de transmission devient un masque d'opacité, en conservant les régions opaques, les UV et les paramètres d'échantillonnage. La réflectance à incidence normale, calculée depuis l'IOR, garde une faible opacité au verre clair. Couleurs, normales, rugosité, géométrie et animations sont conservées. Il n'y a pas de travail supplémentaire par image : le masque est calculé au montage ou à la bascule de comparaison, puis réutilisé.

**Compromis visuel explicite :** l'approximation ne déforme plus ce qui est derrière le verre et ne reproduit pas exactement sa réponse selon l'angle. Les previews affichent les matériaux d'origine par défaut. Le bouton « Vitrage optimisé », réservé aux objets concernés, permet de comparer les deux rendus sans changer les textures HD ni les matériaux de la scène principale. Ce choix reste local à chaque preview. Les matériaux et masques créés sont libérés au démontage ou au retour à l'original ; les images sources partagées restent intactes. Les deux matériaux transmissifs des surcouches anatomiques masquées ne sont pas modifiés : activer ces surcouches peut réintroduire une passe de transmission.

### Reproduire la comparaison

```bash
node scripts/profile-studio-rendering.cjs --hardware-gpu
node scripts/profile-studio-rendering.cjs original scene --night --hardware-gpu
node scripts/test-scene-glass-previews.cjs --hardware-gpu
```

Le premier script alterne original/scène/scène/original dans quatre navigateurs headless neufs, avec la scène standard, 15 secondes de chauffe et 30 secondes mesurées par passage. L'option `--night` choisit minuit. Il utilise les mêmes collecteurs CPU/GPU/mémoire et les mêmes diagnostics d'alimentation/swap que la campagne habituelle ; ses rapports sont dans `test-results/glass-<day|night>-*/report.md`. Il s'agit d'une enquête, pas d'une référence approuvée.

Le suffixe `-refractive-glass` permet aussi une campagne complète de trois passages de 60 secondes avec les matériaux précédents, en gardant les textures 512 px :

```bash
npm run test:perf -- --case=studio-9-mid-day-refractive-glass,studio-9-mid-day --hardware-gpu
```

Cette variante neutralise uniquement le hook de simplification, par une transformation Vite réservée au diagnostic. Les conditions des rapports indiquent désormais `sceneGlass` ; les anciennes références doivent être recréées après examen d'une campagne saine. Les scénarios standard continuent à mesurer le rendu normal de l'application.

L'essai exploratoire sur une même page, en désactivant la transmission, donne 11,28 / 12,87 FPS avant contre 20,21 / 21,25 FPS sans cette passe. Il sert à identifier le coût, pas à valider le rendu de l'approximation ni une référence. Une séparation expérimentale des matériaux d'ombres n'a pas amélioré les FPS ; elle n'est pas intégrée au code de l'application.

### Validation isolée de jour

Campagne A/B/B/A dans `test-results/glass-day-QBZAWm/report.md`, AMD Radeon 840M via ANGLE/Vulkan, secteur, 1362 × 810, DPR 1, neuf personnages en Mid. Chaque ligne est un navigateur neuf ; la simulation autonome continue, les positions peuvent donc diverger entre passages.

| Passage | Verre | FPS | Image p95 | CPU rendu médian | GPU médian | Appels médians | Triangles médians |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| A1 | Réfraction d'origine | 12,41 | 96,6 ms | 28,8 ms | 37,80 ms | 2723 | 11,38 M |
| B1 | Approximation Mid | 19,54 | 64,6 ms | 15,1 ms | 20,72 ms | 1874 | 7,69 M |
| B2 | Approximation Mid | 19,11 | 62,7 ms | 15,3 ms | 21,19 ms | 1856 | 7,70 M |
| A2 | Réfraction d'origine | 12,91 | 95,5 ms | 31,2 ms | 41,24 ms | 2782 | 11,53 M |

Sur les moyennes des deux passages par version : environ **+53 % de FPS**, **−49 % de temps CPU de rendu** et **−47 % de temps GPU**. Les appels et triangles baissent d'environ un tiers, parce qu'une passe disparaît, sans suppression de géométrie. Ce gain headless ne prédit pas une valeur absolue dans le Chrome interactif de l'utilisateur.

Le swap augmente de 72,5 Mio pendant A1, puis diminue légèrement sur les trois autres passages ; l'alimentation reste sur secteur. La campagne reste donc une enquête, pas une nouvelle référence approuvée. Refaire les scénarios standard de trois passages de 60 secondes dans des conditions stables avant de créer la référence.

### Contrôle nocturne

Deux passages isolés supplémentaires, 15 secondes de chauffe puis 30 secondes mesurées, secteur, même GPU et même scénario à minuit. Rapport : `test-results/glass-night-xb7WUC/report.md`.

| Verre | FPS | Image p95 | CPU rendu médian | GPU médian | Appels médians | Triangles médians |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Réfraction d'origine | 12,94 | 92,1 ms | 25,1 ms | 31,96 ms | 1871 | 6,57 M |
| Approximation Mid | 21,83 | 57,5 ms | 12,5 ms | 17,25 ms | 1039 | 3,80 M |

Le contrôle retrouve le gain de nuit, sans hausse de swap ni changement d'alimentation. Il ne comporte qu'un passage par version et ne remplace pas les trois répétitions de la campagne standard.

### Contrôles de non-régression

Le contrôle navigateur `test-scene-glass-previews.cjs` vérifie le vitrage optimisé en High et Mid après rendu effectif, puis les bascules original → optimisé → original dans les previews du four, de l'Air Performer et du téléphone. Le rendu d'origine est sélectionné par défaut dans les previews ; changer ce choix ne modifie pas le studio. Les tests unitaires vérifient aussi la conservation des UV/samplers, des images partagées et la libération des ressources créées.

Validation finale du changement : `npx tsc --noEmit` et `npm run build` réussissent ; les six passages GPU isolés (quatre de jour, deux de nuit) et le contrôle navigateur des previews réussissent. Les warnings de dépendances Sass et de taille de bundle restent présents.


## Éclairage sans contribution — recherche suivante du 10 novembre

Le profil après optimisation du verre (`/tmp/room-cpu-profile-UcN4El/cpu.json`) ne montre plus le même coût de sélection de programmes : environ 128 ms de `getParameters` sur 20 secondes, contre 806 ms dans le profil précédent. Les transformations des hiérarchies et les animations restent des pistes CPU ; aucune modification arbitraire de leur cadence n'est appliquée.

Dans la vue standard de jour, 10 des 14 lumières ont une intensité nulle. Les cacher améliore les FPS, mais change le nombre de sources et donc les variantes de shaders. **Cette approche est rejetée** : le premier allumage du frigo a produit 3464 ms de rendu CPU et un cache montant à 385 programmes, contre environ 19 ms et 134 programmes avec les lumières conservées. Rapports d'interactions : `test-results/light-switches-scene-KEPiIX/switches.json` et `test-results/light-switches-original-CzGSNT/switches.json`. Ces observations expliquent le choix final ; le code qui cachait les sources n'est pas conservé.

### Variante retenue : garder les sources et ignorer leur travail inutile

`zeroEnergyLights.ts` conserve les sources, les uniformes et les clés de cache. Il entoure les cinq boucles d'éclairage direct de Three.js d'un test RGB exactement nul, puis évite le BRDF lorsque Three.js indique déjà `directLight.visible === false` (atténuation nulle ou hors du cône). Aucun seuil de luminosité ou de distance n'est ajouté. Couleurs, intensités, ombres, cadence, résolution et géométrie restent inchangées.

Le module est installé avant la compilation des canevas studio et preview. Son adaptation au chunk GLSL installé est vérifiée explicitement : cinq boucles et quatre appels directs doivent être présents, sinon l'application échoue avec un message de dépendance inattendue. Une modification de ce module en HMR restaure le chunk puis recharge la page pour éviter des programmes déjà compilés avec l'ancienne source.

### Mesure alternée et limites

Comparaison exploratoire A/B/B/A dans la même scène headless, 1362 × 810, DPR 1, neuf personnages, Mid, midi, secteur ; 15 secondes de chauffe après chaque bascule et 20 secondes mesurées. Le diagnostic utilise `onBeforeCompile` et une clé de cache distincte pour la variante témoin, sans modifier les lumières. Les matériaux de la variante optimisée réutilisent leurs programmes. Les programmes supplémentaires du diagnostic ne sont pas créés en fonctionnement normal.

| Passage | Shader | FPS | GPU médian | Appels médians |
| --- | --- | ---: | ---: | ---: |
| A1 | Original | 19,38 | 19,83 ms | 1846 |
| B1 | Optimisé | 21,27 | 17,12 ms | 1804 |
| B2 | Optimisé | 21,99 | 19,08 ms | 1889 |
| A2 | Original | 19,02 | 20,40 ms | 1841 |

Moyennes par variante : environ **+13 % de FPS** et **−10 % de temps GPU médian**. Les positions des PNJ continuent d'évoluer, ce qui explique une partie de la dispersion des appels et triangles. Le swap varie de moins de 1 Mio pendant les trois premiers passages et augmente de 14 Mio au dernier ; cette enquête n'est pas une référence approuvée. Les valeurs absolues du Chrome interactif ne se déduisent pas de ce test headless. Résultats conservés dans `test-results/lights-shader-abba/abba.json`.

Une comparaison antérieure en navigateurs neufs, limitée au test RGB nul avant ajout de la garde d'atténuation, est dans `test-results/lights-day-XUCctb/report.md` : GPU 20,70 → 16,68 ms, FPS 17,28 → 18,37. La hausse de swap (398 puis 72 Mio) rend cette campagne impropre à l'approbation d'une référence.

### Validation visuelle et interactions

La comparaison GPU de quatre matériaux (Standard, Physical avec clearcoat, Phong, Lambert), avec trois états de lumières directionnelles/ponctuelles/spot et des ombres PCF, donne **zéro différence d'octet dans les 12 cas**. Les contextes de comparaison possèdent chacun leurs cibles d'ombres. Résultat : `test-results/lights-shader-pixels/pixels.json`.

Le contrôle de nuit sur la vraie scène à neuf personnages effectue deux cycles d'allumage/extinction du séjour, du four et du frigo : **123 programmes restent présents pendant les 12 bascules**. Le maximum CPU de rendu observé est de 23,1 ms ; aucune pause de compilation de plusieurs secondes n'est retrouvée. Après collecte explicite du tas au début et à la fin, le RSS cumulé des renderers passe de 2,960 à 2,967 Go ; la PSS du navigateur complet termine à 3,096 Go. Le total Chrome dépasse donc encore 3 Go, même si le RSS renderer reste sous ce seuil après GC. Rapport : `test-results/light-switches-scene-0zPegP/switches.json`.

### Reproduire

```bash
node scripts/profile-studio-rendering.cjs --lights --hardware-gpu
node scripts/test-zero-light-shader.cjs --hardware-gpu
node scripts/test-light-switches.cjs --night --hardware-gpu
npm run test:perf -- --case=studio-9-mid-day-original-light-shader,studio-9-mid-day --hardware-gpu
```

Le profilage permanent conserve quatre navigateurs indépendants et 30 secondes mesurées par passage ; il complète l'enquête sur une même session. `--night` choisit minuit. La variante de diagnostic `-original-light-shader` neutralise seulement l'installation du chunk optimisé. Le mode apparaît dans la configuration du passage, sans devenir un critère d'incompatibilité d'une référence : le rendu visuel est identique. Le suivi standard continue donc à pouvoir comparer les implémentations à conditions égales.

Validation finale : 28 tests unitaires ciblés passent (shaders, vitrage, astronomie/jour-nuit, appareils, métriques, ombres de preview et boucle VR), ainsi que le contrôle Air Performer ciblé. TypeScript et le build de production réussissent. Le dernier contrôle High/Mid et les neuf bascules dans les trois previews réussissent ; captures dans `/tmp/room-glass-previews-7IFWwF/`. Les avertissements Sass et de taille de bundle préexistants restent présents.

## Profil CPU sur batterie — 12 novembre 2026

Le profil de 20 secondes, au commit `d9756122`, reprend le cas studio de jour, neuf personnages, Mid, 1362 × 810, DPR 1, avec GPU matériel en headless. L'alimentation détectée est `battery`. Il sert à localiser les coûts ; il ne remplace pas une campagne FPS ni une référence sur secteur. Profil brut : `/tmp/room-cpu-profile-BIhKwB/cpu.json`.

Le temps inclusif échantillonné attribue environ 1202 ms à la boucle des personnages, 524 ms à celle du rouge-gorge, dont 266 ms à la mesure de ses pattes, et 216 ms à la recherche des receveurs d'ombres. Ces durées se recouvrent : elles ne s'additionnent pas. Le reste comprend notamment le rendu Three.js, les matrices et les appels WebGL ; la catégorie native `(program)` ne permet pas d'attribuer son temps au GPU seul.

Une correction supprime la fin inutile du parcours des receveurs d'ombres. Le retour dans le callback de `traverseVisible` arrêtait seulement le traitement du nœud courant ; tous les descendants et frères restaient visités. Le parcours s'arrête désormais dès que chaque lumière active possède un receveur. Les branches invisibles, les calques, les déformations, les miroirs et les vues multiples conservent les mêmes règles. Neuf tests passent, dont un contrôle du nombre de visites dans une branche imbriquée. TypeScript et le build de production réussissent.

Contrôle sur la scène réelle : 4866 nœuds visibles, 180 images, ancienne et nouvelle fonctions appelées sur les mêmes images en alternant leur ordre. Les décisions d'ombres sont identiques sur les 180 comparaisons. Le coût CPU moyen passe de 0,638 à 0,378 ms, la médiane de 0,5 à 0,3 ms, le p95 de 2,1 à 1,2 ms. Cela économise environ **0,26 ms CPU par image**, sans démontrer un gain global de FPS. Rapport brut et durées individuelles : `/tmp/room-shadow-traversal-4liGWG/comparison.json`. Alimentation `battery` au début et à la fin ; swap en hausse pendant le chargement, donc cette session n'est pas approuvée comme référence de fluidité.

La suite de l'enquête doit cibler les matrices et les animations à partir du profil, puis mesurer le rendu complet : les économies locales ne se traduisent pas automatiquement en FPS lorsque le GPU ou la cadence de présentation limite la scène. Les animations et la résolution des ombres n'ont pas été réduites pour obtenir cette économie.

## Matrices et calibration des marches — 12 novembre 2026

Trois calculs redondants sont retirés :

- La restauration d'un squelette assemble désormais toute la hiérarchie avant d'initialiser ses matrices monde en un seul parcours. Elle recalculait auparavant chaque sous-arbre à chaque niveau de construction.
- La calibration de la foulée met à jour les matrices des pieds et de leurs ancêtres via `getWorldPosition`, sans parcourir aussi tous les autres joints à chaque échantillon.
- Le suivi de caméra conserve `getWorldPosition` pour la tête, les yeux et les hanches, en retirant les quatre appels `updateWorldMatrix` immédiatement précédents : Three.js r186 effectue déjà cette mise à jour dans le getter. Les positions restent fraîches à chaque image.

Comparaison CPU locale sur batterie, ancien code `cfa1d33c` contre nouveau code, squelette réel `lara_native.glb` utilisé par les neuf personnages du cas standard. Pour chaque clip : quatre passages de chauffe puis douze passages mesurés de chaque version, ordre alterné, nouveaux clips pour mesurer la calibration sans son cache. Le retargeting et la lecture des fichiers sont exclus du chronométrage. Temps médians :

| Clip | Avant | Après | Calculs de matrices avant → après |
| --- | ---: | ---: | ---: |
| walking | 4,07 ms | 2,36 ms | 31323 → 5078 |
| running | 1,16 ms | 0,72 ms | 3273 → 488 |
| miley-armature-catwalk-loop | 4,53 ms | 2,87 ms | 37703 → 6122 |
| goofy-running | 0,73 ms | 0,55 ms | 3053 → 452 |

Les quatre vitesses de foulée calculées sont strictement identiques entre versions. Le coût médian de calibration baisse d'environ 24 à 42 %, avec 84 à 85 % de compositions de matrices en moins. Cette calibration est déjà mémorisée par clip : l'économie concerne principalement sa première utilisation, pas chaque image. **Ces chiffres ne sont pas un gain global de FPS.** Le retrait des doublons du suivi caméra évite également du travail par image, sans gain FPS quantifié ici. Rapport brut : `/tmp/room-animation-matrices-bdwd5G/comparison.json`, alimentation `battery` au début et à la fin.

Validation : 19 tests passent (moteur des personnages, marches sur tous les humanoïdes, grounding de cinq modèles, animation et transfert worker du H2), TypeScript et build de production réussissent. Deux régressions couvrent la restauration en un parcours avec matrices monde identiques, et une foulée avec bassin animé sous des ancêtres tournés et redimensionnés. La fréquence des animations, les pistes et les réglages de physique restent identiques.
