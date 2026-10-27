# HA → Google Home sans abonnement Nabu Casa

La liaison utilise l’intégration manuelle officielle `google_assistant`.
Elle expose les appareils HA à Google Home ; les noms Smart Life restent indépendants.

## État vérifié le 27 octobre 2026

- Projet actif : **`dinatih-home-assistant`**, avec HomeGraph API activée.
- Intégration Cloud-to-cloud **Dinatih Home Assistant** enregistrée dans la console
  Google Home, avec les types Light/Fan/Blinds/TV et l’icône Room-3D adaptée.
- Compte `home-assistant@dinatih-home-assistant.iam.gserviceaccount.com` créé avec
  le rôle **Service Account Token Creator** sur ce seul projet, après autorisation
  explicite de l’utilisateur. Attribution vérifiée dans IAM.
- Clé JSON transférée par SSH vers
  `/opt/homeassistant/config/google-home-service-account.json`, permissions `0600`.
  Le fichier local dans Téléchargements est également en `0600`. Aucune clé ni
  aucun jeton n’est présent dans le dépôt ou affiché dans la conversation.
- Authentification Google validée depuis le conteneur HA avec le scope HomeGraph.
- Configuration HA validée par `check_config`, puis HA redémarré avec succès.
- Le point d’entrée HTTPS `/api/google_assistant` répond **405** en GET : c’est
  attendu, Google lui adresse des requêtes POST authentifiées.
- Douze entités sont explicitement exposées : les quatre lampes, le purificateur,
  le volet, la télévision, les températures des trois capteurs Hue, le
  chauffe-serviettes et la prise Jardin, selon `google-assistant.yaml`.
- Association réussie confirmée par l’utilisateur : la lampe du couloir est ajoutée
  avec **[test] Dinatih Home Assistant**, après correction Cloudflare.
- Après extension à sept entités, configuration HA validée, redémarrage effectué
  et `google_assistant.request_sync` appelé pour l’unique compte associé : HTTP 200,
  aucune nouvelle erreur Google Assistant journalisée à la vérification.
- Aucun abonnement ou service payant n’a été souscrit pour cette installation.

L’ancien projet `finovndononv` est fermé et programmé pour suppression définitive
après le 26 novembre 2026. Le projet préparatoire `maison-home-assistant-512902`
reste inutilisé et n’a pas été supprimé.

## Associer le téléphone

Avec le compte Google utilisé pour créer le projet :

1. Ouvrir Google Home → Ajouter → Fonctionne avec Google Home.
2. Choisir **[test] Dinatih Home Assistant**.
3. Se connecter à HA et terminer l’autorisation, y compris la double authentification.
4. Vérifier l’ajout de la lampe **Entrée**, provenant de ce service, puis sa pièce.
5. Vérifier les équipements synchronisés et tester leurs commandes vocales.

L’ajout de la lampe du couloir a été confirmé par l’utilisateur. Les commandes
physiques des autres appareils depuis Google Home restent à vérifier.

Les liaisons constructeur existantes peuvent produire un doublon pendant l’essai.
Voir le nettoyage ci-dessous. Un autre compte Google doit être ajouté comme
membre du projet et suivre les étapes d’accès test de la documentation officielle.

## Association Android : retour au début après Authenticator

Le bon service est **[test] Dinatih Home Assistant**. L’intégration active a été
renommée pour la distinguer des anciennes entrées « Maison Home Assistant ».
Fermer puis rouvrir Google Home et actualiser la recherche si l’ancien nom reste affiché.
La présence de deux anciens libellés ne permet pas d’identifier leur projet : ne
pas choisir au hasard. Le projet actif reste `dinatih-home-assistant`.

Pour essayer sans quitter Google Home au moment de saisir le code : ouvrir
Authenticator d’abord, attendre un code neuf, le copier, démarrer l’association et
le coller dans l’écran MFA avant son expiration. Si le délai est trop court, cette
méthode ne suffit pas ; ne pas désactiver la MFA pour contourner le problème.

Deux causes possibles restent à vérifier sur le téléphone, sans diagnostic confirmé :

- Si les options développeur Android sont déjà activées, **Ne pas conserver les
  activités** doit être désactivé et la limite des processus en arrière-plan sur
  **Limite standard**. La première option détruit les activités dès qu’on les quitte.
- La documentation HA signale qu’un raccourci web HA installé sur l’écran d’accueil
  peut intercepter le parcours de connexion et empêcher le retour à Google Home.
  Retirer ce raccourci web pour l’essai si ce cas s’applique.

Références : [options développeur Android](https://developer.android.com/studio/debug/dev-options),
[connexion Google Assistant HA](https://www.home-assistant.io/integrations/google_assistant/).

Pour modifier l’intégration existante, utiliser **Open** depuis la page du projet :
`https://console.home.google.com/projects/dinatih-home-assistant/cloud-to-cloud/15919453857445630974`.
La route `/cloud-to-cloud/setup` ouvre un formulaire de création ; ne pas l’utiliser
pour modifier l’intégration enregistrée.

## Configuration et entretien

Le fichier versionné [google-assistant.yaml](./google-assistant.yaml), sans secret,
est copié dans `/opt/homeassistant/config/google-assistant.yaml`. Le fichier
principal contient :

```yaml
google_assistant: !include google-assistant.yaml
```

Sauvegarde avant installation :
`/opt/homeassistant/config/configuration.yaml.before-google-home-20261027-080531`.
La clé privée est un fichier séparé, chargé par `!include` depuis le conteneur HA.
Ne jamais la placer dans Room-3D, `/config/www` ou une variable `VITE_*`.

Pour exposer un autre appareil, ajouter explicitement son entité dans
`entity_config`, valider la configuration, redémarrer HA et demander une
synchronisation Google. Omettre `name` et `room` pour transmettre les noms HA et
les indications de pièce des appareils exposés. Cela ne fusionne pas les pièces Google.
Un pseudonyme personnalisé dans Google Home peut modifier le nom affiché.
Le mode test Google peut demander une réactivation périodique.

Le switch de simulation Room-3D ne suspend que la liaison de Room-3D : les commandes
Google Home et les automatisations HA restent indépendantes.

## Paramètres Google enregistrés

| Champ | Valeur |
| --- | --- |
| OAuth Client ID | `https://oauth-redirect.googleusercontent.com/r/dinatih-home-assistant` |
| Client secret | Texte de remplissage autorisé ; non utilisé par HA |
| Authorization URL | `https://ha.dinatih.org/auth/authorize` |
| Token URL | `https://ha.dinatih.org/auth/token` |
| Cloud fulfillment URL | `https://ha.dinatih.org/api/google_assistant` |
| Scopes | `email`, `name` |

Envoi Client ID/secret via HTTP Basic, Local fulfillment et App Flip désactivés.
Le nom et l’identifiant de projet restent identiques et explicites.

Source : [procédure officielle Home Assistant](https://www.home-assistant.io/integrations/google_assistant/).

## Échec après MFA : blocage réseau confirmé

Google Cloud Logging a montré que Cloudflare renvoyait HTTP 403 et une page HTML
au serveur Google lors de `AUTH_CODE_EXCHANGE`. La règle de blocage HA hors France
a été corrigée avec une exception limitée à AS15169, aux requêtes POST et aux chemins
`/auth/token` et `/api/google_assistant`. L’expression enregistrée a été relue.
La MFA et l’authentification HA restent actives. L’utilisateur a confirmé
l’association et l’ajout de la lampe après cette correction.
Voir [le diagnostic et la règle Cloudflare](./cloudflare-google-home.md).

## Pièces Google existantes et doublons constructeur

HA fournit des **indications de pièce** (`roomHint`) pour les appareils exposés.
Cela ne constitue pas une synchronisation complète du foyer Google : la liaison ne
renomme ni ne fusionne une pièce Google existante et ne reclasse pas les appareils
fournis par une autre liaison Hue/Smart Life. Les noms et affectations personnalisés
Google peuvent rester distincts de ceux de HA. L’affectation automatique des pièces
n’est pas prise en charge lorsqu’il existe plusieurs foyers dans le compte Google.

L’interface Google Home web a confirmé des doublons constructeur/HA. L’utilisateur
a dissocié Somfy TaHoma, qui ne fournissait que le volet. Les services restants
confirmés après retrait de Hue et Philips Air purifier sont Dinatih et Smart Life.

Pour préparer le retrait de Hue, les températures des trois capteurs Cuisine,
Salle de bain et Couloir sont exposées explicitement via HA, en plus des lampes
Entrée, Douche et Barre déjà exposées. Les entités de groupes Hue ne sont pas
ajoutées : elles reproduiraient les lampes individuelles. Les quatre autres
lampes Hue sont indisponibles dans HA et n’étaient pas visibles dans l’inventaire
Google consulté ; elles ne sont pas supprimées de HA.

L’utilisateur a confirmé la dissociation de Hue et Philips Air purifier. Smart Life
reste associé tant que ses équipements supplémentaires ne sont pas repris. Aucun
appareil n’est supprimé des applications constructeur. Les mouvements des capteurs
Hue ne sont pas exposés : Google Assistant HA ne prend pas en charge leur classe.

### Reprise Smart Life en cours

`light.porte` (Lumière Séjour) était déjà exposée. Le chauffe-serviettes
`climate.chauffe_serviettes` et la prise `switch.jardin_socket_1`, disponibles et
affectés à Salle de bain/Jardin dans HA, sont ajoutés à la liste explicite.
Le rétroéclairage du chauffe-serviettes, le verrou enfant et les réglages techniques
ne sont pas exposés comme des appareils supplémentaires.

Avant dissociation Smart Life, identifier la lampe `light.fenetre`, la prise
`switch.tete_socket_1` et les deux sorties
`switch.interrupteurs_salle_de_bain_switch_1` / `_2`. Le « Radiateur » de l’ancien
inventaire Google n’a pas de correspondance HA établie. Les boutons Tuya remontent
comme événements, les détecteurs comme mouvements : ces classes ne sont pas
exposables directement par Google Assistant HA. Leur présence dans HA ne garantit
pas que les appuis ont été testés ni que leurs automatisations ont été transférées.

L’interrupteur rond commande Lumière Séjour et se trouve dans Séjour, selon
l’utilisateur. Il n’a pas été remplacé par un interrupteur virtuel Google.
Les anciennes pièces Google invisibles dans la gestion ont été supprimées par
l’utilisateur après affectation temporaire du Nest Mini à chacune, puis retour
du Mini dans Séjour avant suppression des pièces devenues accessibles.

Les seules pièces HA sont Séjour, Cuisine, Couloir, Salle de bain et Jardin.
Les sept appareils exposés ont une pièce HA ; la télévision Android TV, auparavant
sans pièce, a été affectée à Séjour et une nouvelle synchronisation demandée.

Si « Pièce » et « Séjour » existent déjà dans Google Home, le nettoyage se fait
une fois dans l’application Google Home :

1. Pour chaque appareil encore dans « Pièce », ouvrir ses paramètres, puis
   **Pièce / Emplacement**, et choisir sa pièce cible existante (par exemple Séjour).
2. Vérifier que « Pièce » est vide avant de la supprimer dans **Paramètres du
   domicile → Appareils, groupes et pièces → Pièce → Supprimer la pièce**.
3. Identifier les appareils en double par leur service d’origine avant de décider
   quelle liaison conserver. Dissocier Hue ou Smart Life enlève tous les appareils
   fournis par ce service, y compris ceux qui ne font pas partie des sept exposés HA.

Ne pas dissocier globalement les services constructeur pour retirer un seul doublon.
La gestion des pièces n’est pas exposée dans l’interface web consultée ; aucune
modification de la pièce Google « Pièce » n’a été annoncée comme effectuée.

Références : [indications de pièce HA](https://www.home-assistant.io/integrations/google_assistant/#roomarea-support),
[gestion des pièces Google Home](https://support.google.com/googlehome/answer/15559809),
[liaisons et dissociation des services](https://support.google.com/googlehome/answer/9159862).
