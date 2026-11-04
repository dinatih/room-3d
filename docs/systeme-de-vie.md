# Système de vie des colocataires

Lara Native, Cha et Vivida possèdent chacune leurs besoins, souvenirs, goûts et affinités. La vitesse du temps est commune. Elles commencent avec un besoin de repos à 0 %.

## Lire les jauges

Les pourcentages représentent des **besoins non satisfaits** : 0 % signifie satisfait, 100 % signifie urgent. Les huit besoins sont Repos, Stimulation, Bouger, Faim, Hygiène, Toilettes, Compagnie et Environnement.

Environnement reflète la saleté réelle et partagée des lieux : sols, toilettes et vaisselle. Il ne mesure ni la décoration ni la lumière. Le ménage réellement effectué par les autres PNJ compte également.

## Objets et effets

| Objet / activité | Besoins satisfaits | Spécificités |
| --- | --- | --- |
| Bureau Bollsidan 2 / tablette | Stimulation | Une seule place ; travailler ou lire fatigue progressivement. |
| Yoga du studio voisin Ouest, chez Églantine | Stimulation + Bouger | Huit places ; les exercices eux-mêmes satisfont Bouger, en plus des trajets. Légère fatigue. |
| Télévision | Stimulation | Ne remplace pas le repos. |
| Conversation au jardin | Compagnie + Stimulation | Effets pendant la discussion réellement jouée à deux ; attendre seul ne suffit pas. |
| Chaises, canapés et bords de lit assis | Repos | Les places assises sont variées selon les visites. Un duo assis réellement joué peut aussi satisfaire Compagnie. |
| Lits, position couchée | Repos | Récupération plus forte qu'assis ; sommeil favorisé la nuit ou en cas de grande fatigue. |
| Baignoire extérieure | Repos + petits bénéfices de Stimulation et d'Hygiène | Trois places ; le bain ne satisfait pas Bouger. |
| Sortie au jardin | Bouger pendant le trajet + Stimulation sur place | Aucune jauge « prendre l'air » séparée. |
| Cuisine puis repas assis | Faim + Repos + petit bénéfice de Stimulation | Cuisiner ne rassasie pas et ne repose pas. Seule la phase où le personnage mange sur une assise apporte ces bénéfices. Les places explicitement duo sont exclues des repas. |
| Douche | Hygiène + petits bénéfices de Repos et de Stimulation | Utilise les variations et durées de sa smart action. |
| Toilettes puis lavabo | Toilettes, puis propreté des mains | Tirer la chasse ou marcher ne soulage pas le besoin de toilettes. Le lavage des mains apporte un petit bénéfice d'hygiène, sans remplacer la douche. |
| Balayage, vaisselle et nettoyage des toilettes | Environnement partagé + petit bénéfice de Stimulation | Le ménage fatigue et salit légèrement. Balayer joue une seule animation par défaut pour tous les PNJ ; arrêt anticipé possible lorsque le sol est propre. |

## Déplacements et animations

Tous les déplacements autonomes réels satisfont Bouger, quelle que soit leur destination. Le trajet ne donne pas les bénéfices de l'activité prévue à l'arrivée. Le yoga apporte en plus un bénéfice physique pendant les poses.

Les activités réutilisent les animations, variations, répétitions et durées définies par les smart actions. Le yoga conserve ses six poses tirées aléatoirement ; le balayage n'a plus les trois répétitions forcées. Les repas utilisent une animation dédiée pour manger sur une assise.

Les effets dépendent du temps réellement joué : une activité courte peut se terminer avant de satisfaire complètement une jauge. Une attente, un chargement d'animation ou un trajet ne doit pas être compté comme l'interaction elle-même. Plusieurs besoins peuvent être satisfaits simultanément, par exemple repos et compagnie lors d'un duo assis, ou faim et repos pendant un repas assis.

## Choix des activités

Les choix tiennent compte des besoins, des urgences, de l'heure, des places disponibles, de l'activité précédente, des expériences et des lieux déjà visités. Le yoga peut être choisi pour la stimulation ou l'envie de bouger. Le bureau et le yoga font partie des possibilités de journée.

Hors urgence, à priorité de routine égale, le besoin est pondéré par le goût appris et le temps écoulé depuis cette activité. Une activité appréciée peut donc être choisie même si un autre besoin est un peu plus élevé. Les activités récentes perdent de l'attrait ; les activités encore inconnues restent des occasions de découverte. Chaque colocataire construit ses propres goûts à partir du soulagement réellement obtenu. Les urgences, les mains à laver et la disponibilité des places restent prioritaires.

Tous les smart objects ne sont pas automatiquement des activités de vie : les associations sont définies dans `src/features/scene/ai/autonomousActivities.ts`. Les effets et la sélection se trouvent dans `src/features/scene/ai/laraLife.ts`, et la saleté partagée dans `src/features/scene/ai/lifeHousekeeping.ts`.

## Journal de vie

Dans la console, sélectionner la catégorie **💚 Vie**, puis éventuellement filtrer sur une colocataire ou une action :

- `life_decision` : activité choisie, besoin, urgence, routine, expérience et récence. Le détail JSON inclut les candidats disponibles avec leurs besoins et coefficients de préférence, ainsi que les cibles temporairement exclues après échec.
- `life_started` : première animation réellement jouée dans une phase, avec le partenaire éventuel. Le chargement et le trajet ne déclenchent pas cet événement.
- `life_result` : fin de phase, durée réellement jouée, besoins avant/après et variations. Le message indique les besoins soulagés ; le détail conserve aussi ceux qui ont augmenté.
- `life_abandoned` : activité indisponible, avant de refaire un choix.
- `life_interrupted` : interruption par une commande ou une invitation.

Ces événements portent l'identité du PNJ, l'heure simulée et l'objet concerné lorsqu'il existe. Ils sont enregistrés dans le journal JSONL de développement (`/tmp/room-3d-logs/latest.jsonl`) même lorsque la console est fermée ou filtrée. Aucun événement de vie n'est émis à chaque image ; les bilans portent sur les phases d'interaction, pas sur toute la durée du trajet.
