# Plan d'implémentation — Navigation & Pathfinding par Graphe de Waypoints (Anti-traversée de murs)

Ce plan décrit la solution architecturale pour empêcher les personnages de traverser les cloisons et murs lorsqu'ils se déplacent vers des Smart Objects situés dans des pièces différentes (séjour, couloir, SDB, jardin, extérieur).

---

## 🛑 Diagnostic du Problème

Actuellement, lorsqu'un PNJ autonome ou une action déclenchée passe d'un objet A à un objet B :
1. **Déplacement en ligne droite directe (vol d'oiseau)** : Si Delphina se trouve au lit (`Lit_Ouest` dans le séjour, $Z=150$) et choisit ensuite le placard couloir ($Z=435$) ou le miroir ($Z=350$), l'agent trace une ligne droite reliant les deux points.
2. **Absence de conscience des pièces (Room Boundary)** : Le séjour ($Z \in [0, 400]$), la SDB ($X \le 192, Z \ge 460$), le couloir ($X \ge 192, Z \ge 400$) et le jardin ($Z < 0$) sont séparés par des murs physiques :
   - **Cloison Séjour / Couloir** : $Z = 400$, passage uniquement par la porte de salon ($X \in [200, 286]$).
   - **Cloison Couloir / SDB** : $X = 192$, passage uniquement par la porte SDB ($Z \approx 560$).
   - **Mur Nord / Baie Vitrée** : $Z = 0$, passage uniquement par la baie vitrée ($X \in [100, 260]$).
   - **Mur Extérieur Entrée** : Mur diagonal, passage uniquement par la porte d'entrée.

```mermaid
graph LR
    Jardin[Jardin / Extérieur Nord] <-->|Baie Vitrée Z=0| Sejour[Séjour Principal Z: 0-400]
    Sejour <-->|Porte Séjour Z=400| Couloir[Couloir Central Z: 400-600]
    Couloir <-->|Porte SDB X=192| SDB[Salle de Bain]
    Couloir <-->|Porte Entrée Diag| ExtB[Bâtiment B / Sortie]
```

Si l'agent va directement de `Baignoire` (Jardin) à `Toilette` (SDB) sans passer par les waypoints de transition (`Devant_Baie_Vitree`, `Couloir_Central`, `Couloir_SDB`, `Entree_SDB`), il traverse tous les murs de l'appartement.

---

## 💡 Solution Proposée : Graphe de Navigation Topologique (Room Graph / Waypoint Pathfinding)

Plutôt que d'écrire manuellement chaque chemin possible dans chaque objet, nous introduisons un **graphe de navigation topologique léger** et automatique :

### 1. Découpage en Zones / Pièces (`RoomZone`)
Chaque Waypoint et Smart Object est assigné à sa pièce d'appartenance :
- `'living'` : Séjour (Lits, Bureaux, Cuisine, Congélateur, Kallax NE, Miroir Sud, Smörkull...)
- `'corridor'` : Couloir central (Placard couloir, Linky, Mackapar...)
- `'bathroom'` : Salle de bain (WC, Douche, Vasque, Armoire SDB...)
- `'garden'` : Jardin / Fond du jardin / Canapés extérieurs / Baignoire
- `'building-b'` : Cours et couloirs extérieurs du bâtiment B

### 2. Portails de Transition (Door / Portal Nodes)
Les connexions entre les pièces se font exclusivement via des transitions identifiées :
- `living` $\leftrightarrow$ `garden` : via `['Devant_Baie_Vitree', 'Dans_Jardin']` (avec gestion ouverture/fermeture baie vitrée)
- `living` $\leftrightarrow$ `corridor` : via `['Devant_Porte_Sejour', 'Couloir_Central']` (avec porte de salon)
- `corridor` $\leftrightarrow$ `bathroom` : via `['Couloir_SDB', 'Entree_SDB']` (avec porte SDB)
- `corridor` $\leftrightarrow$ `building-b` : via `['Couloir_Entree', 'Sortie']` (avec porte d'entrée)

### 3. Résolution automatique du chemin (`findNavigationPath(fromPos, toTarget)`)
Lorsqu'une instruction `USE_OBJECT` ou `MOVE_TO` est demandée :
1. Identifier la pièce de départ (`fromRoom`) à partir de la position actuelle du personnage.
2. Identifier la pièce de destination (`toRoom`) du Smart Object ou Waypoint cible.
3. Si `fromRoom === toRoom` : Déplacement direct (aucun obstacle majeur intra-pièce).
4. Si `fromRoom !== toRoom` : Calculer le plus court chemin dans le graphe des pièces (ex: `garden -> living -> corridor -> bathroom`) et injecter automatiquement les waypoints de passage et les ouvertures de portes requises !

---

## 🛠️ Modifications de Fichiers

### Component 1: Moteur de Navigation & Pathfinding (`src/features/scene/ai/`)

#### [NEW] `src/features/scene/ai/navigationGraph.ts`
- Définition des pièces (`RoomId`), des boîtes englobantes simples pour détecter la pièce courante d'un point $(x, z)$.
- Définition du graphe de transitions de pièces avec waypoints de passage et clés d'événements de portes associés (`livingDoor`, `bathroomDoor`, `eastGlassDoor`).
- Fonction `resolvePath(fromPos: [number, number, number], toPos: [number, number, number], destRoom?: RoomId): AgentInstruction[]`.

#### [MODIFY] `src/features/scene/ai/smartObjectRegistry.ts`
- Associer chaque Smart Object à sa pièce (`room: 'living' | 'bathroom' | 'corridor' | 'garden' | 'outdoor'`).
- Enrichir les métadonnées de slots si nécessaire.

#### [MODIFY] `src/features/scene/ai/useAgentController.ts`
- Lorsque le contrôleur démarre un `USE_OBJECT` ou un `MOVE_TO` vers une autre pièce, il interpole automatiquement les étapes de navigation (passage de porte et ouverture) générées par `resolvePath()`.

#### [MODIFY] `src/features/scene/ai/ZoneNodes.ts`
- Nettoyer et simplifier drastiquement les scénarios comme `ACTION_GO_TO_TOILET` ou `ACTION_SHOWER` : ils n'ont plus besoin d'écrire en dur chaque waypoint de porte ! La navigation inter-pièces est résolue automatiquement par le graphe.

---

## 🧪 Plan de Vérification

### 1. Tests Automatisés & Typage
- Exécuter `npx tsc --noEmit` pour garantir l'absence d'erreurs TypeScript.
- Exécuter `npm run build` pour vérifier la compilation Vite.

### 2. Vérification Comportementale Manuelle
1. **Transition Jardin $\leftrightarrow$ Salle de bain** : Déclencher `Aller aux toilettes` depuis le fond du jardin $\rightarrow$ Vérifier que l'agent passe par la baie vitrée, traverse le salon, ouvre la porte du couloir, ouvre la porte SDB et entre sans traverser aucun mur.
2. **PNJ Autonome (Delphina)** : Laisser tourner la simulation autonome $\rightarrow$ Constater qu'elle navigue entre les canapés de jardin, son bureau, la cuisine et la douche en empruntant toujours les portes adéquates.
