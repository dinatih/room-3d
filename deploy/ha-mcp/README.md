# Accès privé à Home Assistant avec HA-MCP

Cette stack sert à administrer Home Assistant depuis un client MCP. Elle est
indépendante de la future synchronisation de Room-3D, qui utilisera directement
la bibliothèque WebSocket officielle HA.

## Configuration préparée

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

## Organisation HA : inventaire initial du 26 octobre 2026

Pièces présentes : `Living Room`, `Kitchen`, `Bedroom`, `Principale`, `Cuisine`,
`Entrée`, `Douche`. Le rapprochement entre ces noms et les pièces physiques doit
être confirmé avant fusion, suppression ou déplacement d’appareils.

La pièce `Entrée` contient deux entités Hue distinctes :

| Entité | Nature |
| --- | --- |
| `light.entree_entree` | Ampoule physique Hue color lamp |
| `light.entree_entree_2` | Groupe de pièce Hue |

La correspondance de cette ampoule avec la lampe du couloir reste à confirmer.
Commencer par les noms affichés et les affectations de pièces. Conserver les
identifiants d’entités tant que leurs références n’ont pas été examinées.
Effectuer les changements via les API HA, jamais en modifiant les registres
`.storage` pendant que HA fonctionne. Conserver un relevé avant/après.

Sources : [HA-MCP](https://github.com/homeassistant-ai/ha-mcp),
[configuration MCP Codex](https://developers.openai.com/learn/docs-mcp).

### État de la préparation

Image téléchargée et digest vérifié sur le serveur. `compose.yaml` copié dans
`~/stacks/ha-mcp/` et validé avec `docker compose config --no-env-resolution -q`.
Le jeton, le démarrage du service, le tunnel et l’entrée Codex restent à réaliser :
le transfert du jeton attend une autorisation explicite. Aucun renommage ni
changement d’état d’équipement n’a été effectué pendant cet inventaire.
