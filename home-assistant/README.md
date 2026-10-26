# Room-3D et Home Assistant

La première intégration relie la lampe 3D du couloir à l’ampoule réelle
`light.entree_entree` (Philips Hue LCT001). Son emplacement a été confirmé
visuellement par l’utilisateur. Le groupe `light.entree_entree_2` n’est pas utilisé.

## Essayer en local

Aucun push ou déploiement n’est nécessaire. Sur le réseau de la maison :

```bash
npm run dev
```

1. Ouvrir `http://localhost:5173` et le panneau **Interactions**.
2. Dans **Home Assistant**, conserver `http://192.168.1.68:8123`, puis cliquer
   sur **Connecter Home Assistant**.
3. Terminer l’autorisation sur Home Assistant. Le navigateur revient à Room-3D
   et affiche **Entrée · Allumée** ou **Entrée · Éteinte**.
4. Utiliser **Lampe Couloir** dans les interactions, ou le menu de la lampe dans
   la scène. Le clic commande réellement l’ampoule, y compris en développement.
5. Modifier la lampe depuis HA ou son interrupteur : la scène doit suivre.
6. Terminer avec **Déconnecter Home Assistant** pour revenir à la simulation.

La connexion utilise le parcours officiel `getAuth()`, avec des jetons OAuth
propres au navigateur. Ils restent dans `sessionStorage`, uniquement dans cet
onglet, pour permettre le retour d’autorisation et le rechargement de page.
La déconnexion les efface localement. Pour révoquer également l’autorisation
côté serveur, utiliser les sessions / jetons du profil Home Assistant.
Aucun secret administrateur, jeton HA-MCP ou identifiant partagé n’est intégré
au site, au dépôt ou à une variable `VITE_*`.

Le réseau du navigateur doit permettre de joindre HA. Sur une version HTTPS,
utiliser une adresse HA HTTPS (préremplie : `https://ha.dinatih.org`). La validation
de l’authentification en iframe et de l’accès distant reste à faire ; commencer
par un onglet normal. Une iframe n’authentifie pas automatiquement l’application.

## Comportement

- Sans connexion explicite, la scène et ses interactions restent simulées.
- En mode connecté, HA fournit l’état marche/arrêt, la luminosité et la couleur
  de la lampe. Le cycle de couleurs simulé est suspendu. La puissance d’éclairage
  3D reste celle du rendu existant, modulée par la luminosité HA.
- Seuls les clics utilisateur dans les interactions ou le menu de la scène
  envoient `light.turn_on` ou `light.turn_off` sur l’ampoule associée.
- La réponse de service ne modifie pas l’état 3D par anticipation : le retour
  d’état HA confirme l’affichage. Les événements reçus n’envoient pas de commande.
- Les PNJ et les capteurs de présence virtuels ne pilotent pas la lampe réelle
  et ne remplacent pas son état affiché. Les previews gardent leurs états locaux.
- Une entité absente, `unknown` ou `unavailable` désactive les commandes et produit
  une indication explicite. Le dernier état connu reste visible, sans être
  interprété comme un nouvel état confirmé.
- En cas de coupure, le panneau signale un état périmé et les commandes sont
  désactivées. La bibliothèque gère la reconnexion ; une nouvelle lecture des
  états est nécessaire avant de réactiver les commandes. Aucune commande hors
  connexion n’est mise en file ou rejouée.
- La fermeture du WebSocket annule les abonnements côté HA. Le démontage React
  et HMR ferment la connexion tout en conservant les jetons de l’onglet ; une
  déconnexion volontaire les efface.

Le modèle géométrique de l’ampoule reste le GLB déjà présent dans le projet ;
son libellé de scène est désormais « Lampe du couloir ». Les autres appareils
ne sont pas encore associés à Home Assistant.

## Points d’intégration

| Fichier | Rôle |
| --- | --- |
| `src/features/home-assistant/connection.ts` | Association à l’entité, OAuth, WebSocket, états et commandes |
| `src/features/home-assistant/HomeAssistant.tsx` | Panneau de connexion et synchronisation vers le store de scène |
| `src/main.tsx` | Cycle de vie de la connexion, indépendant des panneaux |
| `src/features/scene/store/useSceneStore.ts` | Routage des clics vers HA et exclusion des actions IA |
| `src/features/scene/PresenceLightController.tsx` | Suspension de la présence simulée pour la lampe associée |
| `src/features/scene/placements/CorridorPlacements.tsx` | Rendu de la luminosité et de la couleur reçues |

L’action commune est `lampCorridor`, associée à l’instance
`tradfri-bulb-couloir` dans `objectActions.ts`. Le registre des libellés reste
`objectActionRegistry.ts`. L’identifiant d’entité HA existant est conservé.
La connexion et les commandes résident hors des composants de meubles.

## Validation

Avec Vite en cours d’exécution sur le port 5173 :

```bash
npx tsc --noEmit
npm test
npm run test:home-assistant
npm run build
```

Le test spécifique utilise Chromium headless via
`scripts/browser-test-options.cjs`, la bibliothèque HA réelle et un serveur
WebSocket HA simulé. Il monte le panneau d’interactions et le store réels sans
charger la scène complète. Il couvre la synchronisation initiale, un clic
utilisateur sans mise à jour anticipée, l’exclusion d’un ordre PNJ, les retours
marche/arrêt/couleur/luminosité, une entité indisponible, la coupure réseau, la
reconnexion sans commande rejouée, la déconnexion et le retour à la simulation.
Aucun appareil réel n’est commandé par ce test automatique.

L’essai de bout en bout depuis Room-3D sur la vraie ampoule nécessite encore
la connexion du navigateur de l’utilisateur et sa vérification visuelle.
Les appels HA-MCP antérieurs ont permis d’identifier et tester l’ampoule ; ils
ne remplacent pas cet essai de l’interface Room-3D.

## Déploiement et administration

Le build normal reste destiné à la racine du site. L’ancienne copie sous
`/config/www/room-3d` n’a pas été redéployée : elle utilisait des chemins
`/assets/...` incompatibles avec `/local/room-3d/`. Pour choisir cet hébergement,
il faudra adapter la base Vite **et** les URL des ressources construites à
l’exécution, puis vérifier la scène complète avant déploiement.
Le fichier `lovelace-card-example.yaml` est réservé à cette cible une fois validée.
Les fichiers `/config/www` sont publics et ne doivent contenir aucun secret.

L’accès d’administration HA-MCP, distinct de la connexion du navigateur, est
décrit dans [`deploy/ha-mcp/README.md`](../deploy/ha-mcp/README.md).
L’[inventaire](./inventory.md) détaille les appareils et entités enregistrés.

## Références officielles

- [Client JavaScript Home Assistant](https://github.com/home-assistant/home-assistant-js-websocket)
- [Authentification Home Assistant](https://developers.home-assistant.io/docs/auth_api/)
- [Fichiers publics HA](https://www.home-assistant.io/integrations/http/)
- [Carte Webpage / iframe](https://www.home-assistant.io/dashboards/iframe/)
- [Base publique Vite](https://vite.dev/guide/build.html#public-base-path)
