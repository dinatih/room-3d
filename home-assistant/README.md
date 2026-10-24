# Intégration Home Assistant & Room-3D (3D Floorplan)

Ce dossier regroupe la documentation, les modèles de configuration et les guides d'architecture pour intégrer la scène 3D **Room-3D (React Three Fiber)** dans **Home Assistant**.

---

## 🏗️ Architecture Globale

```
+-------------------------------------------------------------+
|                  Home Assistant (Lovelace)                  |
|                                                             |
|   +-----------------------------------------------------+   |
|   |         Carte Webpage (Iframe) / Plein écran        |   |
|   |                                                     |   |
|   |        +-----------------------------------+        |   |
|   |        |      Room-3D (React / R3F)        |        |   |
|   |        |                                   |        |   |
|   |        |   * Scène 3D, Meshs, Matériaux    |        |   |
|   |        |   * PointLights / SpotLights      |        |   |
|   |        +-----------------+-----------------+        |   |
|   +--------------------------|--------------------------+   |
+------------------------------|------------------------------+
                               |
               WebSocket (ws://<ha-ip>:8123/api/websocket)
                               |
                               v
+-------------------------------------------------------------+
|               Home Assistant Backend (Core)                 |
|                                                             |
|   - light.salon, light.cuisine (États, Couleurs, Dimming)   |
|   - binary_sensor.frigate_person (Présence IA Frigate)      |
|   - sensor.temperature_salon (Métriques capteurs)           |
|   - switch.prise_pc, media_player.*                         |
+-------------------------------------------------------------+
```

---

## 🚀 Options de Déploiement

### Option A : Hébergé directement dans Home Assistant (Recommandé)

1. **Build de l'application :**
   ```bash
   cd ~/Projects/room-3d
   npm run build
   ```
2. **Copie dans le dossier public de Home Assistant (`/config/www/`) :**
   ```bash
   # Sur le mini-pc (via SSH)
   ssh homeserver "mkdir -p /opt/homeassistant/config/www/room-3d"
   rsync -av --delete dist/ homeserver:/opt/homeassistant/config/www/room-3d/
   ```
3. **Accès Web :**
   L'application est immédiatement servie par HA sur :
   `http://192.168.1.68:8123/local/room-3d/index.html`

4. **Configuration du Dashboard Lovelace :**
   Voir le fichier [`lovelace-card-example.yaml`](./lovelace-card-example.yaml).

---

### Option B : Hébergé via le Nginx de la stack Webapp

1. Le build est servi par le conteneur Nginx (`~/stacks/webapp/`).
2. L'URL est soit locale (`http://192.168.1.68`), soit via le tunnel Cloudflare (`https://dinatih.org`).
3. Dans Home Assistant, la carte iframe pointe vers cette URL.

---

## ⚡ Synchronisation Bidirectionnelle (Temps Réel)

Pour faire communiquer la 3D avec Home Assistant, on utilise le package officiel :

```bash
npm install home-assistant-js-websocket
```

### 1. Home Assistant ➔ Room-3D (Mise à jour de la scène)
- **Lumières :** Lorsqu'une lampe physique s'allume ou change de couleur/intensité, l'événement WebSocket est reçu. On met à jour l'intensité et la couleur de la `PointLight` ou `SpotLight` Three.js correspondante.
- **Frigate NVR (Détection de présence) :** Dès qu'une personne est détectée par la caméra, la pièce peut s'éclairer en surbrillance ou faire apparaître un marqueur 3D.
- **Capteurs (Température, Humidité, Puissance) :** Affichage d'étiquettes 3D flottantes (`<Html>` de `@react-three/drei`) au-dessus des meubles ou pièces.

### 2. Room-3D ➔ Home Assistant (Contrôle tactile / clic)
- Un clic sur un objet 3D (ex: la lampe de bureau, le plafonnier, la TV) déclenche un appel de service :
  ```ts
  callService(connection, "light", "toggle", { entity_id: "light.salon" });
  ```

---

## 📁 Contenu du Dossier

- [`README.md`](./README.md) : Ce guide général.
- [`lovelace-card-example.yaml`](./lovelace-card-example.yaml) : Configuration de la carte Lovelace dans Home Assistant.
- [`entity-mapping.example.json`](./entity-mapping.example.json) : Dictionnaire associant les noms de meshs / lumières 3D aux entités Home Assistant.
- [`ha-websocket-client.example.ts`](./ha-websocket-client.example.ts) : Exemple de code TypeScript pour initialiser la connexion WebSocket et écouter les entités.
