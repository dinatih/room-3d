# reDaverse 🕋

> **Concept :** Jumeau numérique 3D interactif et inventaire personnel de mon studio.  
> **Structure :** Monolithe Rails (Vite + React / R3F, SQLite, RSpec).  
> **OS de dev :** Omarchy OS (Option Devcontainer pour portabilité).

---

## 📌 Vision du Projet

L'objectif est de modéliser entièrement mon espace de vie en 3D afin de répertorier, organiser et interagir visuellement avec tout ce que je possède (meubles, tech, livres, outils). Chaque objet physique a son double numérique cliquable dans la scène R3F, relié dynamiquement à l'inventaire géré par le backend Rails.

L'application est un monolithe unifié : Rails gère la sécurité, la base de données et sert l'application React/R3F qui pilote le Canvas 3D.

---

## 🛠️ Architecture & Stack Technique

### Backend & Sécurité (Rails)
* **Framework :** Ruby on Rails (Monolithe avec contrôleurs JSON).
* **Base de données :** SQLite (Léger, embarqué, idéal pour une application mono-utilisateur).
* **Sécurité :** Authentification native via `has_secure_password` et sessions sécurisées par **Cookies HttpOnly**. Protection CSRF transparente (pas de soucis de CORS car le front et le back partagent le même domaine).
* **Gestion des Assets :** Active Storage pour le stockage et le service des modèles 3D (`.glb` / `.gltf`).

### Frontend (Intégré via Vite Ruby)
* **Build Tool :** `vite-rails` pour compiler le JSX et gérer le Hot Module Replacement (HMR).
* **Moteur 3D :** React Three Fiber (R3F) & `@react-three/drei` pour le rendu WebGL de la pièce.
* **Interface (UI) :** Composants React classiques imbriqués autour du Canvas pour les menus, formulaires d'édition et fiches d'objets.

### Qualité & Outils de Dev
* **Environnement (Hybride) :** Développement direct sur l'OS hôte par défaut. Présence d'un **Devcontainer** optionnel (`.devcontainer/`) pour encapsuler et transférer l'environnement de dev complet (Ruby, Node, SQLite) sur n'importe quelle machine de bureau ou homelab sans altérer le système hôte.
* **Tests :** RSpec & FactoryBot pour valider la logique des modèles et des endpoints JSON.
* **Éditeur principal :** Zed
* **Assistance IA :** Antigravity-cli (`agy`) propulsé par les modèles Google, utilisé comme agent de pair programming pour concevoir l'architecture, générer le code et debugger en continu.
* **Versionnage :** Git (Dépôt unique : `dinatih/reDaverse`).

---

## 📂 Structure du Code Source

```text
reDaverse/
├── .devcontainer/         # 🐳 Configuration de l'environnement portable (optionnel)
│   ├── devcontainer.json
│   └── Dockerfile
├── app/
│   ├── controllers/       # Contrôleurs Rails (Authentication, ItemsController)
│   ├── models/            # Modèles ActiveRecord (User, Item)
│   ├── views/             # Contient la vue racine unique (home/index.html.erb)
│   └── javascript/        # 📦 Tout le frontend vit ici
│       ├── entrypoints/
│       │   └── application.jsx  # Point d'entrée qui monte React (#root)
│       ├── components/
│       │   ├── StudioCanvas.jsx # Scène 3D (R3F)
│       │   └── ItemModal.jsx    # UI de l'inventaire (Fiches, formulaires)
│       └── hooks/
├── config/
└── db/                    # Base SQLite locale
```
---

## 🗺️ Roadmap & Fonctionnalités

### Étape 1 : Squelette du Monolithe & Sécurité 🏗️
- [ ] Initialiser l'application Rails et configurer `vite-rails` avec le support React.
- [ ] Ajouter les fichiers de configuration `.devcontainer/` (sans obligation de les lancer).
- [ ] Mettre en place le modèle `User` (`has_secure_password`) et le système de session par cookie.
- [ ] Créer le modèle `Item` (nom, catégorie, coordonnées X/Y/Z) et ses tests RSpec.
- [ ] Configurer la vue Rails racine pour injecter l'application React.

### Étape 2 : Scène 3D (R3F) 📦
- [ ] Monter le Canvas R3F de base dans `application.jsx`.
- [ ] Modéliser et charger la structure brute du studio (murs, fenêtres, sol).
- [ ] Effectuer un `fetch` sur l'endpoint Rails `/items` pour instancier les objets en 3D selon leurs coordonnées en BDD.

### Étape 3 : Interactivité & Persistance ⚡
- [ ] Implémenter le Raycasting pour détecter le clic sur un mesh 3D et ouvrir sa fiche d'inventaire.
- [ ] Mode "Édition" : Activer le drag-and-drop des objets 3D et sauvegarder leurs nouvelles coordonnées en envoyant une requête `PATCH` sécurisée à l'API locale Rails.

---

## 📦 Inventaire des Objets Majeurs à Modéliser

| Catégorie | Objet Physique | Statut Modèle 3D | Statut Base Rails |
| :--- | :--- | :--- | :--- |
| **Tech** | Framework Laptop 13 | ⏳ En cours | ❌ À faire |
| **Tech** | HackRF One + PortaPack | ❌ À faire | ❌ À faire |
| **Meuble**| Bureau / Workspace | ⏳ En cours | ❌ À faire |
| **Audio** | Setup Enceintes | ❌ À faire | ❌ À faire |

---

## 🚀 Commandes utiles

* **Lancer l'environnement de dev local (Rails + Vite) :** `bin/dev`
* **Lancer les tests :** `bundle exec rspec`
* **Pair programming avec l'IA (Modèles Google via agy) :** `agy "Réfléchissons ensemble à la meilleure structure pour le composant R3F du Framework 13, puis génère le squelette"`
