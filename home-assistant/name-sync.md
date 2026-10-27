# Noms : Home Assistant comme référence

## Déjà disponible

Room-3D lit `friendly_name` dans les états HA des quatre lampes et l’affiche dans
le panneau et les interactions. Les événements `state_changed` actualisent ces
libellés sans rechargement. Les appareils supplémentaires affichent aussi leurs
noms HA dans le panneau. Aucun nom n’est écrit vers les applications constructeur.
Les identifiants d’entités restent les clés des associations, indépendamment du nom.

## Smart Life : prérequis manquant

Le compte utilisateur dispose de Smart Life uniquement, sans projet Tuya Developer.
L’intégration HA ne fournit pas de commande de renommage vers Smart Life.
L’API Cloud Tuya documente `PUT /v1.0/devices/{device_id}` avec un champ `name`,
mais demande des identifiants et des autorisations de projet Cloud.
Il faut donc vérifier l’accès à cette API sur un projet lié au compte Smart Life
avant d’implémenter une écriture automatique. Ne pas supposer un accès gratuit ou
permanent ; vérifier les droits et les conditions du projet au moment de sa création.

Références : [intégration Tuya HA](https://www.home-assistant.io/integrations/tuya/),
[API de modification Tuya](https://developer.tuya.com/en/docs/archived-documents/a358769080?id=Ka7kjxvo4fcck).
Le document API est archivé : confirmer le contrat actuel sur le projet avant utilisation.

### Gratuité de l’API

Vérification du 27 octobre 2026 : Tuya annonce un essai IoT Core gratuit d’un mois,
avec possibilité de demander une prolongation. Ce n’est pas une gratuité permanente
garantie. L’édition d’essai annonce 26 000 appels API et 68 000 messages par mois,
avec au plus 50 appareils dont 10 contrôlables. L’accès au renommage reste à vérifier
sur le projet ; aucun abonnement n’a été souscrit.

Sources : [essai gratuit Tuya](https://support.tuya.com/en/help/_detail/K9zsowlj19oaf),
[prolongation après un mois](https://support.tuya.com/en/help/_detail/Kf4xa2nbp7fp0),
[quotas des offres](https://developer.tuya.com/en/docs/iot/membership-service?id=K9m8k45jwvg9j).

## Implémentation proposée

Un petit service côté serveur, distinct du navigateur, suffit. Une liste explicite
associerait l’identifiant stable du registre d’appareils HA à l’identifiant Tuya.
Pour commencer, seule l’OLA serait autorisée ; aucune recherche par nom.

1. Lire le nom utilisateur de l’appareil HA (`name_by_user`). Un appareil sans nom
   explicite n’est pas candidat ; les entités secondaires ne dictent pas le nom.
2. Lire le nom constructeur, comparer, puis présenter un aperçu des modifications.
3. Après validation de ce premier aperçu, écrire uniquement les différences.
4. Relire le nom via l’API et journaliser le résultat ou l’erreur.
5. Pour un fonctionnement continu, écouter les modifications du registre HA et
   refaire la comparaison. Une panne ne doit jamais renommer HA en retour.

Les secrets restent sur le serveur, hors dépôt et variables `VITE_*`. Les erreurs
d’authentification ou d’accès sont visibles et interrompent les écritures concernées.
Une seconde exécution sans changement ne doit envoyer aucune écriture.
Les noms HA, Smart Life et Room-3D peuvent alors converger sans changer les `entity_id`.

Cette partie reste une conception : aucun service de synchronisation Smart Life
n’est installé ni présenté comme opérationnel. Les autres constructeurs demandent
chacun une API de renommage et une association vérifiées séparément.
