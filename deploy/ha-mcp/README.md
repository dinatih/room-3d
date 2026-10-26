# Accès privé à Home Assistant avec HA-MCP

Cette stack sert à administrer Home Assistant depuis un client MCP. Elle est
indépendante de la future synchronisation de Room-3D, qui utilisera directement
la bibliothèque WebSocket officielle HA.

## Configuration installée

- HA-MCP 8.7.0, image figée par digest.
- Home Assistant joint depuis le serveur sur `http://127.0.0.1:8123`.
- Endpoint MCP écoutant exclusivement sur `127.0.0.1:8086/mcp` du serveur.
- Aucun port MCP publié sur le LAN ou dans Cloudflare.
- Accès depuis le poste par tunnel SSH sur `127.0.0.1:18086`.
- Données HA-MCP persistées dans un volume Docker ; interface de réglages web désactivée.
- Jeton dédié dans `.env`, hors Git, avec permissions `600`.

Le jeton possède les droits du compte HA qui le crée. Les modifications des
registres demandent des droits administrateur. Ne pas publier l’endpoint MCP :
le tunnel SSH fournit ici le contrôle d’accès. Les comptes locaux autorisés à
joindre loopback peuvent également atteindre cet endpoint.

## Installation

Copier `compose.yaml` dans `~/stacks/ha-mcp/` sur `homeserver`. Créer un jeton
dédié depuis le profil HA, puis écrire `HOMEASSISTANT_TOKEN=...` dans le `.env`
privé du serveur. Ne pas passer le secret dans une commande visible ou un log.

Depuis le dossier de la stack, sur le serveur :

```bash
chmod 600 .env
docker compose config -q
docker compose up -d
docker compose ps
```

Depuis la racine du dépôt, sur le poste :

```bash
bash deploy/ha-mcp/open-tunnel.sh
codex mcp add home-assistant --url http://127.0.0.1:18086/mcp
codex mcp list
python deploy/ha-mcp/check.py --tool ha_list_floors_areas
```

Ouvrir une nouvelle session Codex si les outils n’apparaissent pas dans la
session existante. Valider une initialisation MCP, le catalogue des outils et
une lecture d’état HA avant toute modification. La présence du serveur dans
la configuration Codex ne suffit pas à confirmer la connexion.

Le tunnel lancé par ce script n’est pas un service au démarrage. Après un
redémarrage du poste ou une rupture SSH, relancer le script ; si le port est
déjà occupé, identifier le processus avant de relancer. Ne pas créer une seconde
entrée MCP pour la même instance.

Pour révoquer l’accès, retirer le jeton « Codex HA-MCP » depuis le profil HA et
arrêter la stack avec `docker compose down`. Le volume persistant reste présent.

## Organisation appliquée le 26 octobre 2026

| Pièce affichée | Identifiant HA conservé | Opération |
| --- | --- | --- |
| Séjour | `living_room` | Fusion de Living Room, Principale et Bedroom |
| Cuisine | `cuisine` | Fusion de Cuisine et Kitchen |
| Couloir | `entree` | Renommage d’Entrée |
| Salle de bain | `douche` | Renommage de Douche |
| Jardin | `jardin` | Création |

Les six appareils de Principale ont été transférés vers Séjour avant suppression
de l’ancienne pièce. Bedroom et Kitchen étaient vides. Les identifiants internes
des pièces conservées restent inchangés ; ils ne sont pas les noms affichés.
Les 52 appareils et 330 entités sont conservés et aucun identifiant d’entité
n’a été renommé. Le tableau de bord YAML référence des entités, pas les pièces
supprimées ; ses références restent valides.

Sept appareils initialement sans pièce ont reçu une affectation :

- Jardin : appareil « Jardin » et « Détecteur jardin » ;
- Salle de bain : chauffe-serviettes, interrupteurs et capteur Douche ;
- Cuisine : capteur Cuisine ;
- Séjour : purificateur Philips AMF870 nommé « Living room ».

Il reste 28 appareils sans pièce, dont des services techniques et des appareils
à identifier. Les noms ambigus et les affectations contradictoires n’ont pas été
corrigés par supposition. Par exemple, « Strip Blanc Jardin » reste dans Salle de
bain conformément à son affectation existante, en attente d’identification.
Les noms importés de Hue / Tuya restent distincts des noms de pièces HA ; les
regroupements de lumières ne sont pas des ampoules supplémentaires.

### Ampoule actuellement nommée Entrée

| Entité | Nature |
| --- | --- |
| `light.entree_entree` | Ampoule Signify / Philips Hue, modèle LCT001 |
| `light.entree_entree_2` | Groupe Hue de l’ancienne pièce Entrée |

L’API HA-MCP a accepté un test `light.turn_on` avec `flash: short` sur l’ampoule,
puis `light.turn_off` ; l’état final `off` a été vérifié. Ce résultat confirme
l’appel et l’état retourné, pas l’emplacement physique ni un clignotement observé.
L’utilisateur a ensuite confirmé avoir vu la lampe du couloir réagir : cette
ampoule est donc identifiée. Son identifiant est conservé et son raccordement à Room-3D a ensuite été
validé en fonctionnement réel par l’utilisateur.

### Accès et sauvegardes

HA-MCP 8.7.0 est démarré, son écoute sur `127.0.0.1:8086` a été vérifiée et
l’entrée globale Codex `home-assistant` pointe vers le tunnel local. Le jeton
dédié « Codex HA-MCP » a été créé avec une durée d’un an, conservé uniquement
dans le `.env` privé du serveur (mode `600`). La copie locale temporaire a été
supprimée et le récepteur local fermé. Le serveur HA n’a pas été redémarré.

Avant les changements, les registres de pièces, appareils et entités ainsi que
les fichiers d’automatisations, scripts et scènes ont été archivés dans :

```text
/opt/homeassistant/config/backups/room-ha-organization-20261026T214557Z.tar.gz
```

Le relevé avant/après se trouve à côté, dans
`room-ha-organization-20261026T214557Z-before-after.json`. Il documente les
appareils déplacés et les identifiants conservés. Ne pas restaurer les registres
`.storage` directement pendant que HA fonctionne.

Validations réalisées : configuration Compose, digest de l’image, permissions
du secret, écoute loopback, initialisation MCP, catalogue des outils, lecture
des cinq pièces via HA-MCP et premier appel de service sur une ampoule.

Le script `check.py` teste le protocole MCP et permet une lecture ou un appel
explicite avec `--tool` et `--arguments`. Les outils nouvellement enregistrés
peuvent nécessiter une nouvelle session Codex pour apparaître dans son catalogue.
Le tunnel reste à relancer après un redémarrage ou une rupture SSH.

Sources : [HA-MCP](https://github.com/homeassistant-ai/ha-mcp),
[configuration MCP Codex](https://developers.openai.com/learn/docs-mcp).

Le détail des 52 fiches appareils et 330 entités, avec les entités désactivées,
figure dans [l’inventaire](../../home-assistant/inventory.md).

### Extension aux éclairages de salle de bain, séjour et cuisine

L’utilisateur a identifié « Porte » comme la lampe OLA du séjour et « Barre »
comme l’éclairage du coin cuisine. « Porte » a été renommée « Lumière Séjour »
dans le registre d’appareil et le nom affiché de `light.porte` via
HA-MCP. L’identifiant n’a pas changé. Le libellé explicite du tableau de bord
`dashboard-maison.yaml` a également été mis à jour, avec sauvegarde dans
`dashboard-maison.yaml.before-sejour-rename`.

Room-3D associe désormais ces trois lampes et le couloir ; voir la table de
correspondance du [guide d’intégration](../../home-assistant/README.md).
La bonne OLA est la lampe Tuya `light.porte`, confirmée par l’utilisateur et
observée allumée. Elle est affectée au Séjour. L’autre « Porte »,
`light.principale_porte` (Hue), est distincte et conserve son nom d’origine.
Les tests automatisés couvrent l’indépendance des quatre commandes, y compris
une OLA indisponible simulée et la présence de cette autre lampe homonyme.
