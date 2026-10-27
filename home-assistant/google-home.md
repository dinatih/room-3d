# HA → Google Home sans abonnement Nabu Casa

La liaison utilise l’intégration manuelle officielle `google_assistant`.
Elle expose les appareils HA à Google Home ; les noms Smart Life restent indépendants.

## État vérifié le 27 octobre 2026

- Projet actif : **`dinatih-home-assistant`**, avec HomeGraph API activée.
- Intégration Cloud-to-cloud **Maison Home Assistant** enregistrée dans la console
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
- **Seule la lampe du couloir `light.entree_entree` est exposée pour le premier essai.**
- L’association dans l’application Google Home reste à confirmer par l’utilisateur.
- Aucun abonnement ou service payant n’a été souscrit pour cette installation.

L’ancien projet `finovndononv` est fermé et programmé pour suppression définitive
après le 26 novembre 2026. Le projet préparatoire `maison-home-assistant-512902`
reste inutilisé et n’a pas été supprimé.

## Associer le téléphone

Avec le compte Google utilisé pour créer le projet :

1. Ouvrir Google Home → Ajouter → Fonctionne avec Google Home.
2. Choisir **[test] Maison Home Assistant**.
3. Se connecter à HA et terminer l’autorisation, y compris la double authentification.
4. Vérifier l’ajout de la lampe **Entrée**, provenant de ce service, puis sa pièce.
5. Tester une commande vocale sur cette lampe avant d’exposer les autres appareils.

Les liaisons Smart Life/Hue existantes peuvent produire un doublon pendant l’essai.
Elles n’ont pas été supprimées. Un autre compte Google doit être ajouté comme
membre du projet et suivre les étapes d’accès test de la documentation officielle.

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
synchronisation Google. Omettre `name` et `room` pour utiliser les noms et pièces HA.
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
