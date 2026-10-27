# HA → Google Home sans abonnement Nabu Casa

La voie retenue est l’intégration manuelle officielle `google_assistant`.
Elle expose les appareils HA à Google Home ; elle ne renomme pas les appareils
dans Smart Life et n’importe pas le foyer Google dans HA.

## Préparation et état

- HA dispose déjà de l’URL HTTPS `https://ha.dinatih.org`.
- `google_assistant` n’est pas encore configuré sur le serveur.
- Google Cast est présent ; il ne remplace pas cette liaison.
- Projet Google Home actif : `dinatih-home-assistant`, créé et vérifié dans la
  console Google Home. L’identifiant et le nom sont explicites.
- L’ancien projet `finovndononv` est fermé et en attente de suppression définitive
  après le 26 novembre 2026, selon la confirmation affichée par Google Cloud.
- Le projet préparatoire `maison-home-assistant-512902` reste inutilisé : la console
  Google Home ne le proposait pas à l’import. Il n’a pas été supprimé.
- HomeGraph API activée sur `dinatih-home-assistant`, état « Enabled » vérifié.
- Formulaire Cloud-to-cloud « Maison Home Assistant » préparé avec les URL HA
  ci-dessous, les scopes `email`/`name`, les types Light/Fan/Blinds/TV et l’icône
  Room-3D adaptée au format demandé. Enregistrement non effectué sur ce projet.
- Le contrôle automatique exige un accord explicite pour enregistrer la chaîne
  de remplissage `HomeAssistantLink` dans le champ Google « Client secret », malgré
  la documentation HA qui précise que ce champ n’est pas utilisé.
- Aucun compte de service ni clé JSON n’a été créé sur le nouveau projet. L’accord
  IAM demandé pour l’ancien projet ne s’applique pas au nouveau ; l’attribution du
  rôle `Service Account Token Creator` et la création/transmission d’une clé
  nécessitent l’accord explicite demandé par le contrôle automatique.
- La configuration HA et l’association téléphone ne sont pas encore finalisées.
- Aucun abonnement, compte facturation ou service payant n’est activé par cette préparation.

## Paramètres à renseigner dans Google Home Developer Console

Paramètres préparés dans le formulaire Cloud-to-cloud, à enregistrer après accord :

| Champ | Valeur |
| --- | --- |
| OAuth Client ID | `https://oauth-redirect.googleusercontent.com/r/dinatih-home-assistant` |
| Client secret | Chaîne alphanumérique ; HA n’utilise pas ce champ |
| Authorization URL | `https://ha.dinatih.org/auth/authorize` |
| Token URL | `https://ha.dinatih.org/auth/token` |
| Cloud fulfillment URL | `https://ha.dinatih.org/api/google_assistant` |
| Scopes | `email`, `name` |

Laisser désactivé l’envoi Client ID / secret via HTTP Basic.
Dans ce même projet (HomeGraph API déjà activée), créer le compte de service selon la
documentation HA et télécharger sa clé JSON. La clé doit être transférée
confidentiellement vers `/opt/homeassistant/config/google-home-service-account.json`,
avec accès restreint, sans être collée dans la conversation ni ajoutée au dépôt.

## Configuration HA à installer une fois la clé disponible

Fragment à fusionner dans `configuration.yaml` :

```yaml
google_assistant:
  project_id: dinatih-home-assistant
  service_account: !include google-home-service-account.json
  report_state: true
  expose_by_default: false
  entity_config:
    light.entree_entree:
      expose: true
```

Commencer par le couloir, vérifier la configuration, redémarrer HA, puis associer
`[test]` dans Google Home → Ajouter → Fonctionne avec Google Home.
Après validation réelle, exposer explicitement les autres appareils désirés.
Omettre `name` et `room` dans la configuration pour que HA fournisse ses noms et pièces.
Un pseudonyme personnalisé dans Google Home peut empêcher l’affichage attendu du nom HA.
Ne pas supprimer les liaisons Smart Life/Hue existantes avant validation : elles
peuvent créer des doublons pendant cette phase de test.

Le mode test Google peut demander une réactivation périodique ; ce montage sans
abonnement demande donc un peu de maintenance.

Source : [procédure officielle Home Assistant](https://www.home-assistant.io/integrations/google_assistant/).
