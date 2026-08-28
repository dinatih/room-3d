# Scénario Concierge pour Xbot (État des lieux)

Ce document décrit l'architecture et le déroulement du scénario d'état des lieux et de conciergerie automatisé pour le personnage **Xbot** (concierge humanoïde collectif/hôtelier).

## 1. Vue d'ensemble

Xbot effectue des rondes de contrôle et d'inspection dans les logements :
1. **Arrivée** par l'extérieur / couloir d'entrée.
2. **Entrée** dans l'appartement via la porte d'entrée.
3. **Salle de bain** : rejoint le centre de la pièce et effectue une rotation à 360° lente pour inspecter l'espace.
4. **Salon / Séjour** : rejoint le centre de la pièce et effectue une rotation à 360° lente.
5. **Couloir** : rejoint le centre du couloir et effectue une rotation à 360° lente.
6. **Sortie** de l'appartement en refermant la porte.
7. **Suite du parcours** : se déplace dans le couloir extérieur vers l'appartement voisin (palier sud/ouest).

---

## 2. Déroulé des étapes (Instructions IA)

| Étape | Nœud / Cible | Type d'instruction | Description & Déclencheurs |
|---|---|---|---|
| 0 | `outdoor-entry-door` | `MOVE_TO` | Positionnement devant la porte d'entrée (X: 288, Z: 603) |
| 1 | Porte d'entrée | `INTERACT` | Ouverture de la porte (`entryDoor = true`) |
| 2 | `corridor-entry-door` | `MOVE_TO` | Franchissement du seuil |
| 3 | Porte d'entrée | `INTERACT` | Fermeture de la porte (`entryDoor = false`) |
| 4 | `bathroom-center` | `MOVE_TO` | Déplacement vers le centre de la SDB (X: 100, Z: 550) |
| 5 | SDB | `ROTATE_360` | Tour complet à 360° lent (~5s) pour inspection |
| 6 | `living-center` | `MOVE_TO` | Déplacement vers le centre du séjour (X: 160, Z: 200) |
| 7 | Salon | `ROTATE_360` | Tour complet à 360° lent (~6s) pour inspection |
| 8 | `corridor-center` | `MOVE_TO` | Déplacement vers le centre du couloir (X: 240, Z: 480) |
| 9 | Couloir | `ROTATE_360` | Tour complet à 360° lent (~4s) pour inspection |
| 10 | Porte d'entrée | `INTERACT` | Ouverture de la porte (`entryDoor = true`) |
| 11 | `outdoor-entry-door` | `MOVE_TO` | Sortie vers le couloir extérieur |
| 12 | Porte d'entrée | `INTERACT` | Fermeture de la porte (`entryDoor = false`) |
| 13 | `outdoor-neighbor-door` | `MOVE_TO` | Marche jusqu'au palier de l'appartement voisin |

---

## 3. Évolutions futures prévues

- Tâches d'hygiène et d'entretien ciblées :
  - Nettoyage douche / vasque / toilettes.
  - Entretien plan de travail / évier cuisine.
