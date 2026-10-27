# Room-3D et Home Assistant

Quatre éclairages de la scène sont associés aux ampoules physiques HA :

| Éclairage | Entité physique | Clé du store |
| --- | --- | --- |
| Entrée / Couloir | `light.entree_entree` | `lampCorridor` |
| Salle de bain | `light.douche_douche` | `lampBath` |
| Lumière Séjour — OLA | `light.porte` | `lampOn` |
| Barre — coin cuisine | `light.cuisine_barre` | `lampKitchen` |

Le couloir a été validé en fonctionnement réel par l’utilisateur. Les trois
associations suivantes correspondent aux lampes qu’il a identifiées. Les groupes
Hue ne sont pas utilisés comme cibles supplémentaires. La lampe Tuya anciennement nommée « Porte »
est renommée « Lumière Séjour » dans les noms d’appareil et d’entité HA ainsi que
dans le libellé du tableau de bord Maison ; son identifiant technique est conservé.
La fiche Hue `light.principale_porte`, indisponible, est un autre appareil :
elle n’est pas associée à l’OLA. Son nom « Porte » reste inchangé.

Le groupe Hue `light.principale_principale` et ses trois ampoules inutilisées
`light.principale_porte`, `light.principale_rosanna` et `light.principale_cha`
sont désactivés dans le registre HA (`disabled_by: user`). Les trois ampoules
étaient indisponibles alors que le pont annonçait encore le groupe allumé,
ce qui polluait l’Overview. Aucun appareil n’a été supprimé du pont Hue.
Pour les réutiliser, réactiver les entités dans Paramètres → Appareils et services
→ Entités, en affichant les entités désactivées.

## Essayer en local

Aucun push ou déploiement n’est nécessaire. Sur le réseau de la maison :

```bash
npm run dev
```

1. Ouvrir `http://localhost:5173` et le panneau **Interactions**.
2. Dans **Home Assistant**, conserver `http://192.168.1.68:8123`, puis cliquer
   sur **Connecter Home Assistant**.
3. Terminer l’autorisation sur Home Assistant. Le navigateur revient à Room-3D
   et affiche l’état de chacun des quatre éclairages.
4. Utiliser **Lampe Couloir**, **Lampe SDB**, **Lumière Séjour (OLA)** ou
   **Barre · Cuisine** dans les interactions, ou leur menu dans la scène. Chaque
   clic commande uniquement l’ampoule associée, y compris en développement.
5. Modifier la lampe depuis HA ou son interrupteur : la scène doit suivre.
6. Terminer avec **Déconnecter Home Assistant** pour revenir à la simulation.

La connexion utilise le parcours officiel `getAuth()`, avec des jetons OAuth
propres au navigateur. Ils restent dans `sessionStorage`, uniquement dans cet
onglet, pour permettre le retour d’autorisation et le rechargement de page.
Les paramètres OAuth de retour (`auth_callback`, `code`, `state`) sont retirés
de l’URL une fois traités. Un rechargement sur la même origine reprend la session
et renouvelle le jeton expiré automatiquement, sans nouvelle connexion ni double
authentification. La déconnexion efface les jetons localement. Pour révoquer
également l’autorisation côté serveur, utiliser les sessions / jetons du profil
Home Assistant.
Aucun secret administrateur, jeton HA-MCP ou identifiant partagé n’est intégré
au site, au dépôt ou à une variable `VITE_*`.

Le réseau du navigateur doit permettre de joindre HA. Sur une version HTTPS,
utiliser une adresse HA HTTPS (préremplie : `https://ha.dinatih.org`). La validation
de l’authentification en iframe et de l’accès distant reste à faire ; commencer
par un onglet normal. Une iframe n’authentifie pas automatiquement l’application.

## Développer sans agir sur les appareils

Dans **Interactions → Home Assistant**, désactiver **Lier les appareils réels**.
La connexion OAuth et le WebSocket restent ouverts, mais les clics et les actions
3D fonctionnent en simulation locale. Les états HA continuent d’être reçus en
arrière-plan sans modifier la scène ; couleurs, présence et purificateur retrouvent
leur simulation. Les commandes réelles du panneau sont masquées.

Ce choix est conservé dans l’onglet après rechargement et HMR. Réactiver le switch
resynchronise la scène avec les derniers états HA, sans rejouer les actions de dev.
Une commande déjà envoyée avant la suspension peut encore se terminer.
**Déconnecter Home Assistant** reste disponible pour effacer la session OAuth.

## Comportement

- Sans connexion explicite, la scène et ses interactions restent simulées.
- En mode connecté, HA fournit l’état marche/arrêt, la luminosité et la couleur
  de chaque lampe. Le cycle de couleurs simulé du couloir est suspendu. La puissance d’éclairage
  3D reste celle du rendu existant, modulée par la luminosité HA.
- Seuls les clics utilisateur dans les interactions ou le menu de la scène
  envoient `light.turn_on` ou `light.turn_off` sur la seule ampoule associée.
- La réponse de service ne modifie pas l’état 3D par anticipation : le retour
  d’état HA confirme l’affichage. Les événements reçus n’envoient pas de commande.
- Les PNJ et les capteurs de présence virtuels ne pilotent pas la lampe réelle
  et ne remplacent pas son état affiché. Les previews gardent leurs états locaux.
- Une entité absente, `unknown` ou `unavailable` désactive les commandes et produit
  une indication explicite pour la lampe concernée ; les autres éclairages
  restent utilisables. Le dernier état connu reste visible, sans être
  interprété comme un nouvel état confirmé.
- En cas de coupure, le panneau signale un état périmé et les commandes sont
  désactivées. La bibliothèque gère la reconnexion ; une nouvelle lecture des
  états est nécessaire avant de réactiver les commandes. Aucune commande hors
  connexion n’est mise en file ou rejouée.
- La fermeture du WebSocket annule les abonnements côté HA. Le démontage React
  et HMR ferment la connexion tout en conservant les jetons de l’onglet ; une
  déconnexion volontaire les efface.

Les modèles géométriques existants sont conservés. Les couleurs et luminosités
reçues pilotent les sources lumineuses et les matériaux émissifs des lampes.
Les previews ne lisent pas la connexion HA et gardent leurs matériaux propres.
Le réglage graphique `lightsHD` ne remplace pas l’état de l’OLA en mode connecté.
Le purificateur, le volet et la télévision sont aussi associés :

| Objet | Entité | Commandes |
| --- | --- | --- |
| Philips Air Performer AMF870/15 | `fan.living_room` | Marche/arrêt, vitesse selon le pas HA |
| Fonction Philips | `select.living_room_function` | `fan`, `circulation`, `heating` selon les options HA |
| Volet | `cover.volet` | Ouverture/fermeture, positions du menu 3D |
| Télé Android TV | `media_player.tele` | Marche/arrêt |

La télévision a été appairée avec Android TV Remote dans HA ; `remote.tele` existe
également, mais ses touches ne sont pas encore exposées dans Room-3D.
Le volet HA indique un pourcentage **ouvert**, converti en pourcentage **fermé**
pour la scène. L’arrêt est désactivé car cette intégration n’annonce pas cette capacité.
Les valeurs et commandes du purificateur remplacent la simulation en mode connecté,
y compris les PM2.5 et la consigne de température lorsqu’elles sont disponibles.
Les particules et l’oscillation restent des animations, sans mesure physique associée.
L’écran TV indique son alimentation ; son image reste locale, sans capture du téléviseur.
Les commandes restent réservées à l’utilisateur, sans mise à jour anticipée ni rejeu.
Les essais physiques de ces trois appareils depuis Room-3D restent à effectuer.

Les noms HA des lampes suivent automatiquement les événements d’état dans le panneau
et les interactions. Les identifiants techniques restent fixes : changer un `entity_id`
nécessite de mettre à jour l’association. Voir [la synchronisation des noms](./name-sync.md).

## Points d’intégration

| Fichier | Rôle |
| --- | --- |
| `src/features/home-assistant/connection.ts` | Association à l’entité, OAuth, WebSocket, états et commandes |
| `src/features/home-assistant/HomeAssistant.tsx` | Panneau de connexion et synchronisation vers le store de scène |
| `src/main.tsx` | Cycle de vie de la connexion, indépendant des panneaux |
| `src/features/scene/store/useSceneStore.ts` | Routage des clics vers HA et exclusion des actions IA |
| `src/features/scene/PresenceLightController.tsx` | Suspension de la présence simulée pour la lampe associée |
| `src/features/scene/placements/CorridorPlacements.tsx` | Rendu de la luminosité et de la couleur reçues |

Les associations objet/actions résident dans `objectActions.ts` et leurs libellés
dans `objectActionRegistry.ts`. Les actions `lampCorridor`, `lampBath`,
`lamp-toggle` et `kolvatten-toggle` utilisent les clés du store indiquées plus haut.
Tous les identifiants d’entités HA existants sont conservés.
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
charger la scène complète. Il couvre aussi le retour OAuth, le rechargement avec
renouvellement du jeton et une URL de retour déjà consommée avec session existante.
Il couvre les quatre associations, leur disponibilité indépendante, les réglages
graphiques de l’OLA, la synchronisation initiale, les clics utilisateur sans mise
à jour anticipée, l’exclusion des ordres PNJ et les retours
marche/arrêt/couleur/luminosité, une entité indisponible, la coupure réseau, la
reconnexion sans commande rejouée, la déconnexion et le retour à la simulation.
Il vérifie aussi les commandes du purificateur, du volet et de la télévision,
la conversion de position et le renommage automatique des libellés HA.
Aucun appareil réel n’est commandé par ce test automatique.

L’essai de bout en bout depuis Room-3D a été confirmé sur le couloir. La salle
de bain, l’OLA et la barre de cuisine restent à vérifier visuellement depuis le
navigateur de l’utilisateur ; aucune commande réelle n’est envoyée au chargement.
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

## Noms et Google Home

Le panneau connecté contient **Comparer les noms Smart Life / HA**, disponible
aussi lorsque la liaison des objets réels est suspendue. Le relevé Tuya est celui
conservé par HA, avec filtre des écarts et actualisation manuelle.
Voir [les noms](./name-sync.md) et [la liaison Google Home](./google-home.md).
