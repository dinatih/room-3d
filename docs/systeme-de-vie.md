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
| Points câlins du studio et du jardin, points d'affection Inter-X du studio et du jardin | Compagnie + Stimulation | Séquences des smart actions conservées ; effets uniquement pendant les duos réellement joués. Le point Inter-X ×10 reste hors des choix de vie. |
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

Le spot de conversation debout tire un duo parmi « Discuter » (Mixamo), `interx-g022t008a029r019` et `interx-g041t009a029r008`, avec sa durée naturelle.

Les effets dépendent du temps réellement joué : une activité courte peut se terminer avant de satisfaire complètement une jauge. Une attente, un chargement d'animation ou un trajet ne doit pas être compté comme l'interaction elle-même. Plusieurs besoins peuvent être satisfaits simultanément, par exemple repos et compagnie lors d'un duo assis, ou faim et repos pendant un repas assis.

## Choix des activités

Les choix tiennent compte des besoins, des urgences, de l'heure, des places disponibles, de l'activité précédente, des expériences et des lieux déjà visités. Le yoga peut être choisi pour la stimulation ou l'envie de bouger. Le bureau et le yoga font partie des possibilités de journée.

Hors urgence, à priorité de routine égale, le besoin est pondéré par le goût appris et le temps écoulé depuis cette activité. Une activité appréciée peut donc être choisie même si un autre besoin est un peu plus élevé. Les activités récentes perdent de l'attrait ; les activités encore inconnues restent des occasions de découverte. Chaque colocataire construit ses propres goûts à partir du soulagement réellement obtenu. Les urgences, les mains à laver et la disponibilité des places restent prioritaires.

Tous les smart objects ne sont pas automatiquement des activités de vie : les associations sont définies dans `src/features/scene/ai/autonomousActivities.ts`. Les effets et la sélection se trouvent dans `src/features/scene/ai/laraLife.ts`, et la saleté partagée dans `src/features/scene/ai/lifeHousekeeping.ts`.

## Journal de vie

Dans la console, sélectionner la catégorie **💚 Vie**, puis éventuellement filtrer sur une colocataire ou une action :

- `life_decision` : activité choisie, besoin, urgence, routine, expérience et récence. Le détail JSON inclut les candidats disponibles avec leurs besoins et coefficients de préférence, ainsi que les cibles temporairement exclues après échec.
- `life_started` : première animation réellement jouée dans une phase, avec le partenaire éventuel. Le chargement et le trajet ne déclenchent pas cet événement.
- Les événements de lecture et de bilan indiquent le clip réellement joué, avec un lien direct vers sa fiche **Animations**. Le lien de l'objet retrouve son produit d'inventaire et lance sa smart action avec le personnage et le clip enregistrés, pour les slots solo. Chaque variation réellement jouée est journalisée séparément.
- `life_result` : fin de phase, durée réellement jouée, besoins avant/après et variations. Le message indique les besoins soulagés ; le détail conserve aussi ceux qui ont augmenté.
- `life_abandoned` : activité indisponible, avant de refaire un choix.
- `life_interrupted` : interruption par une commande ou une invitation.
- `life_partner` : partenaire retenu et affinité connue, pour les conversations, câlins et autres duos non combattants.
- `life_invitation_accepted`, `life_invitation_later`, `life_invitation_declined` : réponse aux invitations et motif.
- `life_invitation_resumed`, `life_invitation_cancelled` : reprise d'une invitation reportée ou raison de son annulation. Le détail de la réponse « pas maintenant » indique si une proposition a effectivement été gardée.
- `life_reaction` : petite réaction à un événement réel, avec le clip choisi et sa raison.

Ces événements portent l'identité du PNJ, l'heure simulée et l'objet concerné lorsqu'il existe. Ils sont enregistrés dans le journal JSONL de développement (`/tmp/room-3d-logs/latest.jsonl`) même lorsque la console est fermée ou filtrée. Aucun événement de vie n'est émis à chaque image ; les bilans portent sur les phases d'interaction, pas sur toute la durée du trajet.

## Affinités et invitations

Pour les duos non combattants, les colocataires choisissent parmi les partenaires visibles et disponibles en tenant compte de leurs affinités, puis de la proximité. L'affectation initiale d'un PNJ à un objet ne remplace pas cette préférence relationnelle. Le joueur n'est pas sollicité spontanément, et une invitation seule ne renforce pas les relations : seul le temps réellement partagé compte.

Avant une invitation autonome, la colocataire consultée peut accepter, répondre « pas maintenant » pour terminer un repas, dormir, aller aux toilettes, se laver ou satisfaire un besoin corporel urgent, ou refuser pendant une commande utilisateur ou une visite. Cette vérification précède les réservations. Le demandeur reste libre de chercher un autre partenaire ou de poursuivre sa vie.

Une réponse « pas maintenant » garde désormais une proposition privée pour une conversation, un moment d'affection ou un repos assis partagé. À la prochaine décision après son activité, la colocataire peut retrouver la personne qui l'avait invitée, même si sa jauge de compagnie est basse. Les soins et les urgences restent prioritaires. La place et le partenaire sont vérifiés à nouveau avant de créer le duo ; aucune réservation n'est conservée pendant le report.

Si la personne partage déjà une autre activité, si le spot est indisponible ou si le partenaire devient masqué ou indisponible, la proposition est annulée. Une commande utilisateur, une visite ou la suspension de la vie autonome l'annulent également. Une nouvelle proposition remplace la précédente, avec un log explicatif. Un contrôle de disponibilité lors de la reprise ne crée pas une invitation inverse : il n'y a pas de ping-pong de reports.

Les séquences des smart actions sont conservées, y compris leurs variations. Pour un duo tiré dans une assise mixte, la reprise conserve le duo proposé. Une colocataire sélectionnée mais encore autonome peut répondre à la reprise de sa propre invitation ; un contrôle manuel n'est jamais interrompu. Les commandes explicites de l'utilisateur gardent la main.

## Habitudes personnelles

Chaque colocataire apprend, au cours de la session, les places et les périodes de journée qui lui ont réellement apporté du soulagement. Arriver devant un fauteuil ou attendre le chargement ne crée pas une préférence. La répétition d'expériences satisfaisantes donne progressivement plus de poids à ce lieu ou à ce moment dans ses choix. Une place utilisée récemment reste moins attractive, et une autre place libre peut remplacer sa favorite. Les urgences et la disponibilité passent avant ces habitudes ; aucun horaire personnel n'est imposé.

Les logs de décision indiquent les préférences de lieu ou de moment prises en compte. Le détail JSON contient leur coefficient pour chaque candidat, et les souvenirs gardent les contributions par place et par période.

## Enchaînements naturels

Après une activité réellement achevée, les besoins restants peuvent donner priorité à une suite logique avant la routine générale :

- Yoga → douche si le besoin d'hygiène le justifie.
- Repas → vaisselle si son état atteint le seuil habituel de nettoyage.
- Travail, lecture, marche, yoga ou ménage → repos assis si la fatigue le justifie.

Une urgence ou un lavage de mains prioritaire passe d'abord. Une suite indisponible ne bloque pas les autres choix, et une action courte n'oblige pas à remplir une jauge avant de poursuivre. Les pauses et les réactions ne remplacent pas le souvenir de la dernière activité significative. Les logs expliquent la suite retenue.

## Petites réactions

Pendant une pause disponible, une colocataire peut saluer une connaissance qui arrive dans la même pièce (`waving`), remercier une personne qui vient de finir de nettoyer cette pièce (`thankful`), ou réagir à une activité devenue indisponible (`thoughtful-head-shake`). Le ménage des PNJ sans système de vie peut aussi déclencher un remerciement. Le chargement d'un clip ou une pièce encore sale ne le déclenche pas.

Les réactions utilisent la durée du clip existant, attendent son chargement et ne se remplacent pas pendant leur lecture. Elles ne coupent ni une commande utilisateur ni un soin en cours, et sont écartées face à une urgence. Elles n'apportent pas de compagnie, de repos ou de souvenirs d'activité artificiels. Le personnage reprend ensuite ses choix habituels. Les réponses « pas maintenant » à une invitation restent expliquées dans les logs sans interrompre l'activité en cours.

## Mémoire des moments partagés

Les relations retiennent aussi le temps réellement passé ensemble par activité : discussion, affection ou repos assis. Pour choisir un partenaire, une colocataire tient donc compte des expériences partagées dans l'activité proposée, en plus de l'affinité générale, de la récence et de la disponibilité. Elle peut rechercher une personne pour discuter et une autre pour partager un moment d'affection.

Une invitation, un salut, un chargement ou un combat n'alimente pas cette mémoire. Le détail de `life_partner` contient l'activité envisagée et l'historique du partenaire retenu.

## État des étapes

| Étape | État |
| --- | --- |
| 1. Choix plus lisibles | Logs de décision, lecture réelle et bilan. |
| 2. Activités selon les affinités | Partenaires choisis selon les relations et les moments partagés. |
| 3. Invitations avec réponse | Accepter, reporter puis reprendre après l'activité, ou annuler si la situation a changé ; sans réservation pendant le report. |
| 4. Petites habitudes personnelles | Préférences apprises de lieu et de période. |
| 5. Enchaînements naturels | Suites conditionnelles aux besoins et à la saleté. |
| 6. Réactions aux autres | Saluts, remerciements et réaction à une activité indisponible. |
| 7. Mémoire des moments partagés | Historique par partenaire et par activité réellement jouée. |
