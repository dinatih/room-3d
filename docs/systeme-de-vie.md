# Système de vie des colocataires

Lara Native, Cha (Charlotte), Vivida, Delphina, Marissa, Rosanna, Sabira, Sara et Helena possèdent chacune leurs besoins, souvenirs, goûts et affinités. La vitesse du temps est commune. Elles commencent avec un besoin de repos à 0 %.

## Lire les jauges

Les pourcentages représentent des **besoins non satisfaits** : 0 % signifie satisfait, 100 % signifie urgent. Les huit besoins sont Repos, Stimulation, Bouger, Faim, Hygiène, Toilettes, Compagnie et Environnement.

Environnement reflète la saleté réelle et partagée des lieux : sols, toilettes et vaisselle. Il ne mesure ni la décoration ni la lumière. Le ménage réellement effectué par les autres PNJ compte également.

## Objets et effets

| Objet / activité | Besoins satisfaits | Spécificités |
| --- | --- | --- |
| Bureau Bollsidan 2 / tablette | Stimulation | Une seule place ; travailler ou lire fatigue progressivement. |
| Yoga du studio voisin Ouest, chez Églantine | Stimulation + Bouger | Huit places ; les exercices eux-mêmes satisfont Bouger, en plus des trajets. Légère fatigue. |
| Danse au Jardin Nord (Pluie), au Fond du Jardin et chez Damien | Stimulation + Bouger | Delphina, Marissa, Rosanna et Sabira ; légère fatigue et hygiène accrue. Chez Damien : tous les slots sauf locomotion et combat. |
| Combat solo chez Damien et duos de la Zone de Combat | Stimulation + Bouger | Cha, Sara, Rajaa et Sandra ; pas de bénéfice de compagnie ni de souvenir amical pendant le combat. |
| Massage sur les points Inter-X du studio et du jardin | Compagnie + Stimulation pour la masseuse ; Repos aussi pour la receveuse | Cha et Vivida donnent les massages, les autres peuvent en recevoir. Rôles et animations synchronisés, invitations soumises aux besoins. |
| Téléphone dans les couloirs du bâtiment B | Stimulation | Slots « Consulter son téléphone », notamment pour Helena. |
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

Une réponse « pas maintenant » garde désormais une proposition privée pour une conversation, un moment d'affection, un massage, un entraînement de combat ou un repos assis partagé. À la prochaine décision après son activité, la colocataire peut retrouver la personne qui l'avait invitée, même si sa jauge de compagnie est basse. Les soins et les urgences restent prioritaires. La place et le partenaire sont vérifiés à nouveau avant de créer le duo ; aucune réservation n'est conservée pendant le report.

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

## Relations personnelles initiales

Les relations sont réciproques : Cha et Delphina ne s’aiment pas ; Cha et Marissa non plus. Sabira est la meilleure amie de Cha (Charlotte), amie de Rosanna et ne s’entend pas avec Marissa. Les autres relations restent à découvrir.

Ces affinités sont distinctes du temps réellement partagé : elles ne créent aucun faux souvenir. Elles favorisent les partenaires amis, déterminent la compagnie préférée et font refuser les invitations autonomes entre personnes qui ne s’entendent pas. Les commandes explicites restent possibles.

La télévision s’éteint quand son spectateur libère le spot, y compris lors d’une interruption. La vidéo partagée avec l’ordinateur ne peut plus allumer un téléviseur éteint.

Le bureau et le point debout pour regarder la télé partagent le même espace physique : leurs réservations sont mutuellement exclusives. Chaque smart action comprend un trajet de sortie vers une place accessible du séjour, en gardant la réservation jusqu’à l’arrivée. Une pause ne laisse donc plus une colocataire devant l’écran alors que le poste est déjà proposé à une autre.

## Repas partagés

Quand elle a faim, une colocataire peut préférer une assise libre sur le même canapé, banc ou bord de lit qu’une personne en train de manger. L’envie de compagnie et les affinités renforcent ce choix ; elles ne forcent pas à manger sans faim et ne passent pas devant un besoin urgent. Les colocataires en conflit ne sont pas recherchées comme partenaires de repas.

Après la préparation en cuisine, les places libres et les repas en cours sont vérifiés à nouveau. Le journal `life_meal_join` indique l’intention de rejoindre une personne. Aucune place voisine n’est réservée pendant la préparation ; la réservation habituelle est vérifiée avant de s’installer.

Chacune joue son animation de repas et finit indépendamment. La faim, le repos et la compagnie peuvent être soulagés simultanément, mais le bénéfice de compagnie et les souvenirs de repas ne comptent que pendant les animations réellement jouées sur des places distinctes du même meuble. Une arrivée, un chargement ou la préparation ne créent aucun temps partagé. Si l’autre part, le repas continue seul ; les logs de début et de résultat distinguent les périodes avec et sans partenaire.

## Lire les relations

La section repliable **Relations** du panneau de vie affiche les relations du personnage sélectionné : meilleure amie, amie, connaissance ou tensions. L’étoile indique sa compagnie préférée. Chaque relation indique le temps réellement partagé, puis sa répartition par activité (repas, discussion, affection, repos…). Les durées sont exprimées en minutes simulées, comme l’horloge de vie. Les relations définies au départ apparaissent même sans rencontre, avec « Aucun moment partagé » ; elles ne créent pas de faux souvenirs. La section est repliée au départ pour garder le panneau compact.

## Espace personnel

Les réservations des assises, lits et places du bain permettent de repérer une colocataire détestée sur le même meuble, y compris dans un duo. Une autre place libre pour la même activité est alors privilégiée. Si aucune alternative adaptée n’existe, la place reste utilisable : une tension n’interdit pas de satisfaire un besoin. Les trajets et les autres activités de la même pièce ne sont pas exclus. Le départ de la voisine supprime cette préférence dès la décision suivante.

Les logs de décision expliquent la préférence d’une place à l’écart et indiquent les voisines évitées pour chaque candidat. Après la préparation d’un repas, la place est revérifiée ; `life_meal_seat_changed` signale un changement d’assise lorsque les disponibilités ou le voisinage ont changé.

Le panneau Vie suit le personnage actif et affiche son icône et sa couleur. Il ne propose plus d’onglets par colocataire. N ouvre ou ferme le panneau ; changer de personnage met directement ses informations à jour. Les fiches Personnages restent fixées au profil consulté. Un personnage sans système de vie affiche une indication explicite, sans emprunter les jauges d’une colocataire.

## Goûts personnels de départ

| Colocataire | Préférences initiales |
|---|---|
| Lara | Bureau et lecture |
| Cha | Combat, massage, marche et discussion |
| Vivida | Bain, massage et affection |
| Delphina | Danse et lecture |
| Marissa | Danse et télévision |
| Rosanna | Danse et marche |
| Sabira | Danse et discussion |
| Sara | Combat et marche |
| Rajaa | Combat et bureau |
| Sandra | Combat et yoga |
| Helena | Bureau, téléphone et lecture |

Ces préférences départagent les activités adaptées aux besoins. Elles ne créent ni besoin, ni souvenir, ni réservation, et ne passent pas devant les urgences, l’hygiène des mains ou le respect de l’espace personnel. La récence continue de favoriser la variété.

Leur poids initial correspond au seuil d’une décision de besoin, réparti entre les activités préférées. Il diminue progressivement avec le soulagement réellement accumulé dans les souvenirs : chacune peut découvrir un loisir favori différent de ses goûts de départ. La section repliable **Goûts** du panneau distingue ces deux informations. Les décisions mentionnent « Goût initial » quand il intervient, et leurs données incluent les préférences du personnage ainsi que les coefficients utilisés.

## Spécialités et nouvelle colocataire

Le groupe par défaut passe de huit à neuf personnages : Helena est ajoutée après Cha, sans retirer les huit précédentes. Sara dispose maintenant d’une vie autonome ; Rajaa et Sandra aussi lorsqu’elles sont affichées. Helena est timide et geek technologique : elle commence sur un spot téléphone, préfère les activités technologiques et décline les nouvelles rencontres lorsqu’elle n’a pas encore besoin de compagnie. Une connaissance déjà rencontrée ou une envie de compagnie atteignant le seuil habituel permet l’invitation ; les soins et commandes utilisateur restent prioritaires.

Les spécialités limitent les initiatives autonomes de danse, de combat et de massage aux profils indiqués. Elles conservent les pools, répétitions et durées des smart actions : six variations chez Damien, quatre au Jardin Nord, quatre répétitions au Fond du Jardin et trois duos dans la Zone de Combat. Les combats en duo ne recrutent que des combattantes disponibles et respectent leurs refus ou reports.

Les actions « Massage » des deux points Inter-X utilisent uniquement les duos marqués massage dans le registre. La masseuse prend le rôle B, la receveuse le rôle A. Une colocataire peut demander à recevoir un massage auprès d’une masseuse disponible, et une invitation reportée reprend avec les mêmes rôles. Les bénéfices et souvenirs distinguent donner et recevoir ; ils ne commencent qu’au démarrage réel des animations. Un point déjà occupé par une autre action ne change pas de séquence pour accueillir la nouvelle demande.

## Sauvegarde et nouvelle vie globale

La vie de toute la colocation est sauvegardée automatiquement dans le navigateur, au plus une fois par seconde réelle, puis lorsque l’onglet est masqué ou fermé. Les besoins, souvenirs, relations, habitudes de lieux et d’horaires, mains sales, dernières activités, horloges, propreté commune et vitesse sont conservés. Les profils masqués, dont Rajaa et Sandra, font partie du même instantané. Aucun temps ne s’écoule hors de l’application.

Après rechargement, chacune choisit selon ses besoins sauvegardés. Les positions, trajets, réservations, animations, invitations en attente et sessions duo sont recréés dans la scène courante : une ancienne place ou un ancien partenaire ne restent pas bloqués.

La section **Sauvegarde de la colocation** indique la dernière sauvegarde et propose **Nouvelle vie**. Cette commande demande confirmation puis efface **tout le système de vie en une seule fois** : besoins, souvenirs, goûts appris, relations apprises, habitudes, horloges, propreté, vitesse et sessions en cours de tous les personnages. Le rechargement rétablit les personnalités et relations de départ. Les autres onglets ouverts appliquent aussi cette remise à zéro, sans recréer les anciens historiques. Il n’existe pas de remise à zéro individuelle. Les autres réglages de l’application sont conservés.

Le chargement valide l’instantané complet avant de l’appliquer. Une sauvegarde illisible, incompatible ou partielle est signalée dans le panneau et conservée sans être écrasée automatiquement ; la commande globale permet de repartir de zéro. Une erreur de stockage est également affichée, et la sauvegarde reprend lorsque le navigateur permet à nouveau l’écriture. La sauvegarde reste locale à ce navigateur.

## Préparations de repas variées

Chaque repas tire au hasard une smart action disponible : prendre un ingrédient au frigo LAGAN ou au congélateur CHIQ, cuisiner sur les plaques ou utiliser le four Ninja. La séquence de l’objet conserve ses animations, ses durées et ses ouvertures/fermetures ; le PNJ rejoint ensuite une vraie place assise pour manger. Les appareils occupés ou ayant échoué dans l’environnement actuel sont exclus, sans bloquer les autres possibilités. La faim ne diminue qu’au moment de manger.

## Vie collective et bilan quotidien

- **Repas à partager** : terminer toute la préparation produit des portions pour la cuisinière et les colocataires présentes qui ont faim. Les portions disponibles sont communes. Une colocataire en réserve une avant de partir manger et saute alors la cuisine, même si les appareils sont occupés. Une interruption avant de manger rend cette portion ; commencer réellement l’animation du repas la consomme. Les préparations simultanées utilisent d’abord le stock déjà disponible. Les mains sales restent incompatibles avec le repas.
- **Invitations précises** : les duos de combat, repos et massage gardent leurs invitations coordonnées. Une danseuse ou une combattante sur un spot individuel peut aussi proposer la même activité à une colocataire appréciée, sur une autre place libre du même lieu. La réponse tient compte des spécialités, des tensions, du contrôle utilisateur et des soins prioritaires. Une réponse « plus tard » reprend l’activité après les soins si la place est toujours disponible. Chaque nouvelle activité propose une invitation une seule fois ; le refus n’interrompt pas la personne invitée.
- **Effort et récupération** : une minute simulée de bureau ajoute 0,5 point de fatigue, la danse 0,8 et le combat 1. Donner un massage ajoute 0,5 ; en recevoir retire 0,35. Ces effets suivent les animations réellement jouées ; le trajet reste une activité physique distincte. Les besoins de repos et les enchaînements existants déterminent la suite.
- **Événements spontanés** : une colocataire en pause peut saluer une amie qui arrive, remercier un ménage terminé, réagir à un repas prêt ou s’inspirer d’une activité commencée dans sa pièce. Elle peut ensuite rejoindre une activité adaptée sur une place libre. Une urgence, des mains sales ou une commande utilisateur restent prioritaires. Deux danseuses jouant réellement leurs animations dans le même lieu peuvent satisfaire la compagnie et mémoriser ce moment, sans imposer une animation duo.
- **Journée vécue** : le panneau Vie et les fiches Personnages présentent le détail de chaque jour : activités effectivement jouées, marche, partenaires, durées de besoins au-dessus du seuil de décision et compteurs d’invitations/réactions. Les durées sont des minutes simulées ; le découpage à minuit est exact. Les attentes et chargements n’inventent ni activité ni compagnie. Les repas préparés, les portions réservées et ces bilans sont sauvegardés avec toute la colocation et effacés ensemble par **Nouvelle vie**.

### Invitations à partager un repas

Après avoir préparé un repas et choisi son assise, une cuisinière peut inviter une colocataire appréciée qui a faim à une autre place du même meuble. Une réponse « plus tard » suffit : elle ne multiplie pas les invitations pendant chaque répétition de l’animation. L’invitée peut terminer ses soins avant de venir ; une faim urgente autorise à accepter un repas déjà prêt, tout en laissant les autres soins urgents prioritaires. La portion n’est réservée qu’à l’acceptation effective, jamais pendant le report. Si la place initiale a été prise, une autre assise libre est choisie ; si les portions sont épuisées, si toutes les assises sont occupées ou si elle a déjà mangé, l’invitation est annulée et la vie reprend ses choix habituels. Le bilan distingue désormais les invitations reprises et annulées. Seules les animations de repas réellement simultanées au même meuble produisent du temps de compagnie.

## Besoins au démarrage

Toutes les vies démarrent avec Repos, Faim et Toilettes à **0 %**, pour laisser la priorité aux loisirs et aux activités personnelles au début. Cette initialisation s’applique aussi après **Nouvelle vie**.

## Musique du Nest Mini

Dans la scène, **Jouer la musique** sur le Nest Mini lance le MP3 intégré `audio/house-music.mp3` ; **Arrêter la musique** coupe sa lecture. La piste est « Orelsan – Jour meilleur instrumental (Prod by NSTRU) », publiée par NSTRU : https://www.youtube.com/watch?v=yW3tSqV6IeM (environ 3 min 09, MP3 192 kbit/s). Aucun fichier n’est à sélectionner sur l’ordinateur. Une danseuse disponible dans le séjour peut écouter brièvement puis choisir un spot de danse libre selon la logique existante. Le signal suit la lecture réellement audible : une demande de lecture, un fichier refusé, le silence ou une preview ne lancent pas de réaction. Pause, buffering, fin de piste et arrêt annulent une inspiration encore en attente ; une danse déjà engagée garde sa séquence normale. Besoins urgents, mains sales et commandes utilisateur restent prioritaires. Les réactions et choix sont journalisés ; écouter ne crée ni soulagement artificiel ni faux temps de compagnie.
