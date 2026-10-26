# Room-3D et Home Assistant

Objectif : afficher les équipements réels dans l’appartement 3D et les commander
par les interactions existantes. Room-3D reste utilisable sans Home Assistant.
Ce document décrit la cible et les étapes à réaliser ; il ne constitue pas une
intégration déjà fonctionnelle.

## État vérifié le 26 octobre 2026

| Élément | Constat |
| --- | --- |
| Serveur | Accessible par `ssh -F ~/.ssh/config homeserver` |
| Home Assistant | Conteneur `homeassistant`, réponse HTTP locale sur le port 8123 |
| Configuration HA | `/opt/homeassistant/config` monté sur `/config` |
| Copie de Room-3D | Présente dans `/config/www/room-3d`, environ 3,4 Go |
| Build déployé | Références `/assets/...` incompatibles avec le sous-chemin `/local/room-3d/` |
| Connexion dans l’application | Absente ; dépendance `home-assistant-js-websocket` non installée |
| Entités réelles | Inventaire et correspondances avec les objets 3D à établir |

Ces vérifications portent sur l’infrastructure et les fichiers, pas sur le
fonctionnement du rendu déployé, des appareils ou de l’accès distant.
Les anciens exemples de client et de mapping ont été retirés : ils n’étaient
pas utilisés et ne décrivaient pas les équipements réels.

## Architecture retenue

```text
Interaction utilisateur dans Room-3D
    → action existante → adaptateur Home Assistant → appel de service HA
État reçu de Home Assistant
    → adaptateur → store Zustand existant → affichage 3D
```

Un seul module gère la connexion et son cycle de vie. Les composants de meubles
ne créent pas de WebSocket et ne connaissent pas les identifiants des entités HA.
La bibliothèque officielle `home-assistant-js-websocket` fournit la connexion,
les abonnements aux entités et les appels de service ; ne pas réimplémenter le
protocole ou sa reconnexion.

Les points d’intégration existants sont :

- `src/features/scene/objectActions.ts` : actions proposées par objet ;
- `src/features/scene/objectActionRegistry.ts` : identifiants, libellés et comportements ;
- `src/features/scene/store/useSceneStore.ts` : états et interactions de la scène.

Le mapping à créer associera une instance d’objet placée, son action et sa clé
d’état à une entité HA réellement découverte. Utiliser les identifiants stables
du projet, pas des noms de meshes supposés. Les clés `lampBath`, `lampCorridor`
et `lampKitchen` existent déjà ; leur présence ne prouve pas qu’un équipement
réel leur correspond. Toutes les positions 3D sont en centimètres.

## États et commandes

Pour un équipement associé, Home Assistant fait autorité sur l’état affiché.
Un clic envoie une commande ; l’événement reçu met à jour le store sans envoyer
de nouvelle commande. Une réponse de service réussie ne prouve pas à elle seule
que l’équipement a atteint l’état demandé.

- Privilégier les commandes explicites `turn_on` et `turn_off` pour une intention
  connue. Vérifier les capacités de l’entité avant luminosité ou couleur.
- Distinguer connecté, connexion en cours, déconnecté et échec d’authentification.
- Traiter une entité absente, `unknown` ou `unavailable` comme indisponible,
  jamais comme éteinte. Signaler l’erreur et empêcher une commande inadaptée.
- En cas de perte de connexion, indiquer que le dernier état est périmé et
  désactiver les commandes réelles. Ne pas conserver de file à rejouer plus tard.
- Après reconnexion, récupérer l’état courant avant de réactiver les commandes.
- À la déconnexion volontaire ou au démontage, désabonner, retirer les écouteurs
  et fermer la connexion. Éviter les connexions multiples lors des remontages React.

Les objets sans association gardent leurs interactions locales. Les previews
et les PNJ ne doivent jamais commander les appareils réels : seul un geste
explicite de l’utilisateur dans la scène connectée peut le faire.
Ne pas abonner toute la scène React à chaque changement de toutes les entités :
l’adaptateur ne met à jour que les données associées qui ont changé.

## Authentification

Prévoir une action explicite « Connecter Home Assistant », utilisant le parcours
`getAuth()` de la bibliothèque officielle. Aucun compte ni jeton partagé ne doit
être embarqué dans le dépôt, le build, une URL ou une variable `VITE_*`.
Les jetons ne doivent pas apparaître dans les journaux de développement.

Le premier parcours sera validé en ouvrant Room-3D directement dans un onglet.
L’intégration iframe vient ensuite : elle n’authentifie pas automatiquement
Room-3D et les redirections ou le stockage peuvent dépendre du navigateur.
Définir et tester la conservation éventuelle des jetons ainsi que leur effacement
à la déconnexion avant de proposer une session persistante.

Utiliser HTTPS et WSS pour l’accès distant. Une page HTTPS ne doit pas tenter
de joindre une instance HTTP. L’URL HA doit être accessible depuis le navigateur
utilisé, y compris hors du réseau local.

## Hébergement et tableau de bord

L’hébergement statique et la connexion HA sont deux sujets distincts. Une iframe
ne fait qu’afficher Room-3D ; elle ne réalise aucune synchronisation.

Conserver pour commencer la cible existante `/local/room-3d/`, sans redéploiement
avant correction et validation des chemins. Pour préparer un build à cet emplacement :

```bash
npm run build -- --base=/local/room-3d/
```

Cette option corrige les références traitées par Vite. Il faut aussi auditer les
URL construites à l’exécution : modèles GLB, textures, environnement, vidéos et
autres fichiers publics. Préfixer les URL concernées par `import.meta.env.BASE_URL`
lorsque nécessaire, sans modifier les URL externes. Un changement de `base` seul
ne garantit pas que toute la scène charge correctement.

Avant toute copie sur le serveur :

1. Valider le build sous son sous-chemin réel et vérifier l’absence de ressources
   manquantes, de réponses HTML à la place des assets et d’erreurs navigateur.
2. Vérifier que le build normal à la racine continue de fonctionner.
3. Examiner le contenu à publier et conserver une version déployée récupérable.
4. Déployer uniquement dans le répertoire Room-3D, puis tester la scène complète.

Les fichiers de `/config/www` sont servis sous `/local` sans authentification HA :
ils ne doivent contenir aucun secret ni donnée domotique privée. La présence
publique de la scène ne doit jamais donner accès aux commandes de la maison.

Après validation en accès direct, utiliser la carte de
[`lovelace-card-example.yaml`](./lovelace-card-example.yaml) dans une vue Panneau.
Vérifier le parcours de connexion, le redimensionnement et les interactions sur
le navigateur et le téléphone réellement utilisés. Ne pas désactiver le sandbox
pour contourner un problème non diagnostiqué.

## Première livraison : une lampe

1. Relever la version HA, choisir une véritable entité `light` et un objet 3D
   correspondant, puis confirmer ses capacités et permissions.
2. Ajouter la dépendance officielle et la connexion explicite dans l’application.
3. Associer cette seule lampe aux actions et au store existants.
4. Synchroniser marche/arrêt, puis ajouter luminosité et couleur si disponibles.
5. Valider les critères ci-dessous avant d’étendre à d’autres équipements.

| Vérification | Résultat attendu |
| --- | --- |
| Sans connexion HA | Application et interactions locales utilisables |
| Connexion initiale | État réel affiché sans commande envoyée |
| Changement depuis HA ou interrupteur physique | Objet 3D actualisé |
| Clic volontaire dans la scène | Une seule commande, puis affichage de l’état reçu |
| Preview ou activité d’un PNJ | Aucune commande réelle |
| Entité absente ou indisponible | Indication explicite, commande désactivée |
| Réseau coupé puis rétabli | État périmé signalé, resynchronisation sans commande rejouée |
| Authentification refusée ou expirée | Erreur visible et possibilité de se reconnecter |
| Déconnexion ou remontage React | Aucun abonnement ou socket abandonné |
| Build sous `/local/room-3d/` | Scène et ressources chargées sans erreur de chemin |

Après modification de code, lancer `npx tsc --noEmit` et `npm run build`.
Les tests navigateur suivent `scripts/browser-test-options.cjs` et restent
headless. Un essai sur la lampe réelle complète les tests simulés ; il ne peut
pas être remplacé par une simple compilation.

Les capteurs, volets, prises et éventuelles détections Frigate viendront après
cette première validation. Aucun nouveau backend, MQTT ou composant HA personnalisé
n’est nécessaire pour cette première étape avec l’API WebSocket existante.

## Références officielles

- [Client JavaScript Home Assistant : authentification, états et services](https://github.com/home-assistant/home-assistant-js-websocket)
- [Authentification Home Assistant](https://developers.home-assistant.io/docs/auth_api/)
- [Serveur HTTP et fichiers publics HA](https://www.home-assistant.io/integrations/http/)
- [Carte Webpage / iframe](https://www.home-assistant.io/dashboards/iframe/)
- [Vite : déploiement sous un chemin public](https://vite.dev/guide/build.html#public-base-path)

## Administration de Home Assistant

La préparation de HA-MCP pour organiser les pièces et appareils est décrite dans
[`deploy/ha-mcp/README.md`](../deploy/ha-mcp/README.md). Cet accès d’administration
est distinct de la connexion temps réel à implémenter dans Room-3D.
