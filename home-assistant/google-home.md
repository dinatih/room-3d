# HA → Google Home sans abonnement Nabu Casa

La voie retenue est l’intégration manuelle officielle `google_assistant`.
Elle expose les appareils HA à Google Home ; elle ne renomme pas les appareils
dans Smart Life et n’importe pas le foyer Google dans HA.

## Préparation et état

- HA dispose déjà de l’URL HTTPS `https://ha.dinatih.org`.
- `google_assistant` n’est pas encore configuré sur le serveur.
- Google Cast est présent ; il ne remplace pas cette liaison.
- Projet Cloud créé : `maison-home-assistant-512902` (« Maison Home Assistant »).
- HomeGraph API activée sur ce projet, état « Enabled » vérifié dans la console.
- La console Google Home revient au formulaire de création sans erreur affichée,
  et sa liste d’import reste vide. La console Actions historique renvoie HTTP 500.
- Import dans Google Home Developer Console et configuration Cloud-to-cloud à terminer.
- Aucun compte de service ni clé n’a encore été créé ; aucune configuration HA
  Google Assistant n’a été installée et aucune association téléphone n’est finalisée.
- Aucun abonnement, compte facturation ou service payant n’est activé par cette préparation.

## Paramètres à renseigner dans Google Home Developer Console

Créer/importer le projet, ajouter une intégration Cloud-to-cloud, puis renseigner :

| Champ | Valeur |
| --- | --- |
| OAuth Client ID | `https://oauth-redirect.googleusercontent.com/r/maison-home-assistant-512902` |
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
  project_id: maison-home-assistant-512902
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
