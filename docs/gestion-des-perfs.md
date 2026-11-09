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
4. Optimiser un coût confirmé à la fois, sans diminuer la qualité visuelle. Vérifier aussi le cycle normal météo/jour/nuit après toute modification du rendu.

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
