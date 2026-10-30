# Réutilisation des réseaux de navigation — 29 octobre 2026

Le moteur maison est conservé. Les modifications portent sur les préparations
de géométrie, les détours et leurs diagnostics, sans modification des animations.

## Modifications

- Après une invalidation, comparer la définition des obstacles effectivement
  retenus pour le profil et les propriétaires exclus. Si elle est identique,
  garder la préparation, même si elle est encore en cours.
- Acquérir la nouvelle préparation avant de libérer la précédente afin de
  conserver les références partagées entre profils et lecteurs.
- Si les empreintes des autres personnages changent, vérifier tous les segments
  restants du détour avant de le remplacer. Une obstruction réelle le renouvelle.
- Conserver les contrôles des portes, du mobilier actuel et des capacités des
  pièces. Les empreintes des PNJ restent consultatives pendant les calculs.
- Journaliser les causes de préparation et les réutilisations. Terminer un
  diagnostic d'arrêt dès que le personnage avance ou commence une activité sans
  attendre la disparition d'un ancien libellé d'erreur.

## Protocole de mesure

Référence figée : `fe0c19dd7a209ef221ff4afac8fb81cd7c9ade07`. Le lanceur extrait
les sources de cette référence et substitue seulement `navigation/service.ts` et
`navigation/pathfindingClient.ts` dans les sessions corrigées. Les évolutions
concurrentes des activités et de l'interface restent hors de cette comparaison.
Le correctif de diagnostic du contrôleur est validé séparément par test unitaire.

Chaque version utilise automatiquement les 25 PNJ du catalogue, les quatre drones,
les collisions, le préréglage bas, une vue de 1 280 × 720 et Chromium headless sur
le GPU AMD Radeon 840M via ANGLE/Vulkan. Les sessions commencent après confirmation
de la fin du déploiement des 25 personnages. L'activité est maintenue dès l'ouverture.

Les versions alternent pour les graines `20261019`, `20261020` et `20261021`, avec
cinq minutes de mesure et le décor masqué. La dernière session dure dix minutes
avec le décor visible. Les graines fixent la suite de tirages aléatoires ; les
chargements et l'ordonnancement ne garantissent pas des trajets identiques.

Le temps worker est la somme des durées des constructions mesurées dans le worker,
hors préparation de la page et restauration locale des résultats. Les attentes
vont du premier événement `nav_job_wait` à la consommation ou à l'annulation.
Chaque attente supérieure à 250 ms conserve sa chronologie et les temps de file,
de calcul, de livraison et de reprise dans son rapport.

Les anciens diagnostics pouvaient conserver « Construction du réseau » pendant
une activité déjà commencée. `stopDurations` répartit les causes et borne ces
anciens signalements avec les instantanés du contrôleur ; `snapshotClippedStops`
identifie ces fins déduites, dont la précision dépend de l'intervalle des
instantanés (environ une seconde). `maxReportedStopMs` conserve le signalement brut
et ne constitue pas une durée d'immobilité confirmée. Les attentes des jobs sont
mesurées par leurs événements horodatés, indépendamment de ces anciens libellés.

Les premières tentatives du matin restent des diagnostics : départ trop tôt dans
le déploiement, délais de protocole, veille ou fermeture du navigateur. Elles ne
participent pas à la comparaison. Chaque tentative et chaque session possède son
propre rapport et son journal.

## Examen des attentes longues de la référence 20261021

Les 21 attentes sont toutes suivies d'un événement de consommation : aucune n'est
restée sans reprise. Les identifiants ci-dessous sont ceux de cette session.

| Composante dominante | Jobs examinés |
| --- | --- |
| File d'attente | 243, 322, 324, 373, 374, 513, 514, 528, 531, 532 |
| Livraison à la page | 229, 233, 237, 295, 298, 299, 556, 606, 694, 720 |
| Calcul worker du placement de duo | 231 |

Le job 528 présente l'attente maximale : de 445 299,6 à 447 163,0 ms dans la
session, soit 1 863,4 ms. Ses composantes depuis la soumission sont : file
1 381,4 ms, calcul 89,1 ms, livraison 278,4 ms et reprise 127,3 ms. L'attente
commence après la soumission ; ces composantes ne s'additionnent donc pas
exactement à sa durée. La chronologie complète de chacun des 21 jobs et leurs
composantes figure dans `analysis.navigation.waitsOver250Ms` du rapport JSON.

## Résultats des trois paires

| Graine | Constructions/min avant → après | Calcul worker avant → après | Attentes terminées avant → après | Attente maximale avant → après |
| --- | --- | --- | --- | --- |
| 20261019 | 218,9 → 139,0 | 10,347 → 7,705 s | 89 → 74 | 204 → 222 ms |
| 20261020 | 280,7 → 144,1 | 10,312 → 11,663 s | 70 → 60 | 220 → 208 ms |
| 20261021 | 119,6 → 143,9 | 24,897 → 11,292 s | 64 → 73 | 1 863 → 626 ms |

Sur les trois fenêtres de cinq minutes : 3 107 → 2 143 constructions (−31,0 %),
45,555 → 30,660 s de calcul worker (−32,7 %) et 33,502 → 24,153 s d'attentes
cumulées. Les départs inaccessibles passent de 2 à 1. Aucune attente de ces six
fenêtres ne reste ouverte à leur fin. Le gain n'est pas uniforme : la troisième
graine construit davantage de réseaux et la deuxième consomme davantage de temps
worker après modification.

Les six attentes corrigées supérieures à 250 ms appartiennent à la troisième
graine et se terminent toutes par une reprise : calcul pour le job 450 ; file
pour 518 et 580 ; livraison pour 585, 664 et 665. Les valeurs et chronologies
individuelles restent dans les rapports JSON.

Durées cumulées des signalements d'arrêt par cause sur les trois fenêtres,
en secondes, avec la précision des instantanés indiquée plus haut :

| Cause | Avant | Après |
| --- | ---: | ---: |
| Construction du réseau | 40,648 | 35,028 |
| Calcul de navigation en cours | 3,941 | 4,020 |
| Placement du duo | 3,462 | 4,341 |
| Battant salle de bains | 3,972 | 41,358 |
| Battant entrée | 4,633 | 2,707 |
| Battants vitrés gauche / droit | 1,652 / 2,560 | 1,136 / 2,624 |
| Battant séjour / douche | 0,359 / 0 | 0,327 / 0,194 |
| Couloir complet | 4,820 | 13,282 |
| Salle de bains complète | 7,510 | 15,730 |
| Séjour complet | 0 | 9,695 |
| Contournement PNJ / pièce complète | 0,595 / 0,216 | 1,106 / 0,370 |
| Trajet coupé par la géométrie actuelle | 0 | 2,339 |
| Aucun chemin / aucune sortie du lit / hors sol | 0,120 / 0,005 / 0,006 | 0,059 / 0 / 0 |
| Aucun déplacement, cause non identifiée | 1,167 | 2,489 |

La réduction des constructions ne prouve donc pas une baisse de tous les arrêts.
Le signalement utilisateur de Sabira a ensuite permis de reproduire une boucle
de porte réelle, décrite ci-dessous.

## Dix minutes avec le décor visible

Session terminée : 114,6 constructions/min, 25,762 s de calcul worker,
261 attentes terminées et un placement de duo encore en attente depuis 197 ms
à la fin de la fenêtre. Aucun départ inaccessible ni erreur JavaScript ; les
contrôles périodiques des capacités passent.

Les 51 attentes supérieures à 250 ms ont toutes repris. Composantes dominantes :

- Calcul : 261, 311, 386, 537, 691, 825, 995, 1198, 1201.
- File : 107, 450, 594, 595, 643, 997, 1210, 1211.
- Livraison : 120, 121, 237, 418, 424, 538, 560, 568, 577, 607, 614, 619,
  624, 629, 632, 637, 640, 692, 702, 747, 768, 774, 831, 1120, 1204, 1205,
  1207, 1268, 1293, 1314, 1315, 1367.
- Reprise : 562, 770.

Le maximum est de 4 929,9 ms pour le job 1207 : calcul 3,9 ms, file
1 432,1 ms, livraison 3 413,9 ms, reprise 80,3 ms. Le job de duo 1201 passe
1 576,4 ms dans le worker. Ces pauses demeurent visibles et ne sont pas masquées
par une modification des animations. La composante « livraison » ne permet pas
à elle seule d'identifier l'instruction JavaScript ou GPU responsable.

## Boucle de Sabira dans la porte de salle de bains

La session utilisateur `8c62c236-b247-4979-9b84-fbd82ef11dc6` contient les
coordonnées de la capture : `(167,76966 ; 525,70338)`, angle du battant
`0,217658316` rad, limite mobilier `π/2`. Elle contient 935 signalements de
blocage par ce battant. Sabira alterne déplacement de dégagement et retour vers
le même coin pendant plus de dix minutes, ce qui remet son compteur de mouvement
à zéro sans résoudre son trajet. Delphina fait aussi des dégagements au même
endroit ; Xbot apparaît de l'autre côté du battant dans l'instantané examiné.

Le défaut est reproductible sans Xbot sur le moteur de référence : après s'être
dégagé, le personnage rentre trop tôt dans l'arc et retient à nouveau l'ouverture.
Le correctif partage le rayon de débattement existant entre récupération et
passage. Lorsqu'un personnage entre dans cet arc, son trajet restant doit être
libre dans la pose réelle du battant. Il conserve la demande d'ouverture en
attendant à l'extérieur. Les ouvertures partielles restent utilisables ; murs,
meubles et capacités des pièces ne sont pas contournés.

Ce correctif de porte est postérieur aux mesures ci-dessus. Il passe le test
unitaire qui échoue sur la référence et un test headless dans l'appartement réel,
aux coordonnées enregistrées, avec attente puis arrivée à `(500 ; 300)`.

## Validation et reproduction

362 tests unitaires réussis, TypeScript sans erreur, puis test de porte réel
réussi. Les tests couvrent aussi les préparations partagées et leur libération,
les obstacles exclus, les détours conservés ou obstrués, les destinations occupées,
les ouvertures partielles et les pièces pleines.

```bash
npm test
npx tsc --noEmit
npm run test:studio -- --case=sabira-door-loop --hardware-gpu
ROOM_NAV_BASELINE_REF=fe0c19dd7a209ef221ff4afac8fb81cd7c9ade07 node scripts/navigation-rebuild-campaign.cjs > /tmp/room-nav-campaign.log 2>&1
node scripts/navigation-rebuild-campaign.cjs --report=test-results/navigation-rebuild-2026-10-29T22-21-02.261Z
```

Rapports de cette exécution :

- `test-results/navigation-rebuild-2026-10-29T22-21-02.261Z/summary.json` et les
  sept sous-dossiers contenant chacun `report.json` et `session.jsonl`.
- `test-results/2026-10-30T04-01-15.865Z-studio/report.json` pour Sabira.
