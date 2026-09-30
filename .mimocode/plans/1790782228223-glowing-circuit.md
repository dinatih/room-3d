# Plan : Constantes de faces internes de murs

## Objectif

Définir dans `wallData.ts` des constantes représentant les **faces internes** des murs par pièce, pour remplacer l'utilisation brute de `ROOM_D`, `KITCHEN_Z`, `PARTITION_THICKNESS` dans les fichiers de placement.

## Fichier à modifier

`src/features/scene/wallData.ts` — après la section BATH_Z_END (ligne 216)

## Règles de calcul

Quelle fonction `p*` donne la face intérieure d'un mur ?

| Type de mur | Orientation | Face intérieure = | Exemple |
|---|---|---|---|
| Béton Z-axis | Mur ouest | `pEast(pilier)` (bord est du pilier = côté pièce) | `pEast('corner-nw')` = 0 |
| Béton Z-axis | Mur est | `pWest(pilier)` (bord ouest du pilier = côté pièce) | `pWest('corner-ne')` = 316 |
| Béton X-axis | Mur nord | `pSouth(pilier)` (bord sud du pilier = côté pièce) | `pSouth('corner-nw')` = 0 |
| Placo Z-axis | Cloison | `pEast(pilier)` (bord est = côté pièce) | `pEast('kitchen-nw')` = 33.6 |

Un même mur physique → deux valeurs (une par pièce), décalées de `PARTITION_THICKNESS` :
- `ROOM_SOUTH_WALL` ≠ `CORRIDOR_NORTH_WALL`
- `KITCHEN_SOUTH_WALL` ≠ `BATH_NORTH_WALL`

## Constantes à créer

```typescript
// ── Faces internes des murs (repères de placement) ─────────────────────────

// Séjour (Living Room)
export const ROOM_NORTH_WALL     = pSouth('corner-nw');        // Z = 0      (face intérieure façade vitrée)
export const ROOM_SOUTH_WALL     = pNorth('corner-sw');        // Z ≈ 396.6  (face séjour de la partition sud)
export const ROOM_EAST_WALL      = pWest('corner-ne');         // X = 316    (face intérieure mur est)
export const ROOM_WEST_WALL      = pEast('corner-nw');         // X = 0      (face intérieure mur ouest)

// Cuisine (Kitchen) — alvéole au sud du séjour, ouvert au nord
export const KITCHEN_SOUTH_WALL  = pNorth('kitchen-nw');       // Z ≈ 460.0  (face cuisine de la partition cuisine/sdb)
export const KITCHEN_EAST_WALL   = pWest('kitchen-ne');        // X ≈ 126.4
export const KITCHEN_WEST_WALL   = pEast('kitchen-nw');        // X ≈ 33.6
// KITCHEN_NORTH_WALL : pas de mur (ouvert sur le séjour)

// Salle de bain (Bathroom)
export const BATH_NORTH_WALL     = pSouth('bath-nw');          // Z ≈ 463.6  (face sdb de la partition cuisine/sdb)
export const BATH_SOUTH_WALL     = pNorth('shower-nw');        // Z ≈ 610.8
export const BATH_EAST_WALL      = pWest('bath-ne');           // X ≈ 192.0  (face sdb de la cloison couloir)
export const BATH_WEST_WALL      = pEast('corner-sw');         // X ≈ -10    (face intérieure mur ouest béton)

// Couloir (Corridor)
export const CORRIDOR_NORTH_WALL = pSouth('door-living-w');    // Z ≈ 403.8  (face couloir de la partition séjour)
export const CORRIDOR_EAST_WALL  = pWest('corner-se');         // X = 316    (face intérieure mur est)
export const CORRIDOR_WEST_WALL  = pEast('bath-ne');           // X ≈ 199.2  (face couloir de la cloison sdb)
// CORRIDOR_SOUTH_WALL : mur diagonal, exclu volontairement
```

## Récapitulatif

| Constante | Formule | Valeur ~ |
|---|---|---|
| `ROOM_NORTH_WALL` | `pSouth('corner-nw')` | 0 |
| `ROOM_SOUTH_WALL` | `pNorth('corner-sw')` | 396.6 |
| `ROOM_EAST_WALL` | `pWest('corner-ne')` | 316 |
| `ROOM_WEST_WALL` | `pEast('corner-nw')` | 0 |
| `KITCHEN_SOUTH_WALL` | `pNorth('kitchen-nw')` | 460.0 |
| `KITCHEN_EAST_WALL` | `pWest('kitchen-ne')` | 126.4 |
| `KITCHEN_WEST_WALL` | `pEast('kitchen-nw')` | 33.6 |
| `BATH_NORTH_WALL` | `pSouth('bath-nw')` | 463.6 |
| `BATH_SOUTH_WALL` | `pNorth('shower-nw')` | 610.8 |
| `BATH_EAST_WALL` | `pWest('bath-ne')` | 192.0 |
| `BATH_WEST_WALL` | `pEast('corner-sw')` | -10 |
| `CORRIDOR_NORTH_WALL` | `pSouth('door-living-w')` | 403.8 |
| `CORRIDOR_EAST_WALL` | `pWest('corner-se')` | 316 |
| `CORRIDOR_WEST_WALL` | `pEast('bath-ne')` | 199.2 |

## Valeurs partagées (même mur physique)

- `ROOM_EAST_WALL` = `CORRIDOR_EAST_WALL` = 316 (mur béton est)
- `BATH_WEST_WALL` ≈ -10 (mur béton ouest, même que côté séjour via `ROOM_WEST_WALL` = 0 — ⚠️ décalage WT entre les deux faces)

## Vérification

- `tsc --noEmit` passe sans erreur
- Spot-check des valeurs : `console.log` temporaire dans un composant ou vérification via le panneau latéral
