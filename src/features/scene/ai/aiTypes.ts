export type SmartObjectCategory =
  | 'seating'      // Canapés, chaises, fauteuils
  | 'bed'          // Lits (repos, sommeil)
  | 'hygiene'      // Douche, lavabo, baignoire, WC
  | 'surface'      // Bureaux, plans de travail, tables
  | 'appliance'    // Four ninja, réfrigérateur, congélateur, Linky, Nest Mini
  | 'storage'      // Kallax, placards, armoires
  | 'door'         // Portes simples, coulissantes, baies vitrées
  | 'outdoor'      // Jardin, fond du jardin, entrées bâtiment
  | 'decor'        // Plantes, miroirs, oiseaux
  | 'dance';       // Pistes et spots de danse

export interface InteractionSlot {
  slotId: string;             // ex: 'seat_1', 'seat_2', 'lie_down', 'use'
  name: string;               // Label lisible
  relative?: boolean;         // Si true, offset et approachOffset sont exprimés dans le repère local de l'objet parent
  offset?: [number, number, number]; // Position relative ou absolue d'interaction [x, y, z] (hérite de obj.position si absent)
  approachOffset?: [number, number, number]; // Position d'arrivée avant d'interagir
  arrival?: 'approach' | 'front'; // 'front' reste dans la largeur de la face accessible
  approachWidth?: number;     // Largeur physique de la face accessible, requise pour arrival='front'
  navigationOwner?: string;   // Volume physique utilisé par ce slot d'un objet composé
  excludes?: string[];       // Actions du même meuble qui utilisent le même espace physique
  rotY?: number;              // Orientation (radians relative si relative=true ou absolue) ; hérite de obj.rotationY si non spécifié
  entryAnimation?: string;    // Transition animée entre l’approche et la pose d’interaction
  animation?: string;         // Chemin vers le clip d'animation GLB
  duration?: number;          // Durée par défaut en secondes (si vide/non fourni, l'animation est jouée repeatCount fois)
  repeatCount?: number;       // Nombre de fois où l'animation est jouée si duration est omis (défaut: 1)
  repeatVariation?: boolean;  // Si repeatCount > 1 avec animationsRandom : true = animation différente tirée à chaque répétition, false = même anim répétée X fois (défaut: false)
  availableAnims?: string[];  // Variantes possibles pour l'aléatoire
  animationsRandom?: string | string[]; // Tag (ex: 'seated-front', 'dance'), tableau de tags/alias, ou alias unique
  triggerEventKey?: string;   // Event à déclencher (ex: 'wc-flush')
  triggerEventValue?: boolean; // Valeur explicite à passer au trigger (ex: true ou false)
  // ── Support Duo Animation ──
  isDuo?: boolean;            // Indique une interaction à deux personnages synchronisés
  duoAnimId?: string;         // Identifiant de l'animation duo (dans DUO_ANIMATIONS, ex: 'sit_cuddle')
  duoPool?: string[];         // Liste restreinte d'IDs pour tirage aléatoire (ex: hugs ou combat)
  duoCount?: number;          // Nombre d'animations à enchaîner dans la session (défaut: 1 ou 3)
  duoRole?: 'roleA' | 'roleB'; // Rôle assigné au slot
}

export interface SmartObjectDef {
  id: string;                 // Identifiant unique (ex: 'bed-west', 'toilet', 'sofa-garden-east')
  name: string;               // Nom affiché (ex: 'Lit Utåker Ouest')
  category: SmartObjectCategory;
  itemId?: string;            // Identifiant de l'objet 3D / inventaire lié (ex: 'sdb-closet', 'desk-bollsidan-1', 'bed-double')
  position?: [number, number, number]; // Position monde de référence [x, y, z] (optionnel si itemId présent)
  rotationY?: number;         // Orientation monde de l'objet (optionnel si itemId présent)
  slots: InteractionSlot[];   // Slots d'interaction disponibles
  ownerCharacterId?: string;  // Permanent access restriction, independent of occupancy
  exclusive?: boolean;        // Si true, un seul personnage à la fois peut utiliser cet objet (exclusivité partagée par tous ses slots)
  approachDoor?: import('./navigation/doorRequests').DoorKey;
}

export type ResolvedSmartObject = SmartObjectDef & {
  position: [number, number, number];
  rotationY: number;
};

export interface SmartAction {
  actionId: string;
  position: [number, number, number]; // [x, y, z] target
  rotationY: number; // orientation target
  animation?: string;
  duration?: number;
}

export type InteractionType =
  | 'sit'
  | 'sleep'
  | 'cook'
  | 'wash'
  | 'shower'
  | 'work'
  | 'relax'
  | 'dance'
  | 'admire'
  | 'storage';

/**
 * SPATIAL ZONE : Volume englobant 3D (Pièce, Jardin, etc.)
 */
export interface SpatialZoneDef {
  id: string;
  name: string;
  environment: 'indoor' | 'outdoor';
  bounds: {
    min: [number, number, number];
    max: [number, number, number];
  };
}

export type InstructionType = 'MOVE_TO' | 'PREPARE_OBJECT' | 'INTERACT' | 'WAIT' | 'RETURN_TO_START' | 'USE_OBJECT' | 'ROTATE_360' | 'OBSERVE_OBJECT';

export interface AgentInstruction {
  /** Departure step consumed when the rise already reached free standing space. */
  postureExit?: boolean;
  type: InstructionType;
  /** Déplacement de dégagement hors du débattement d'une porte. */
  doorKey?: 'living' | 'glassRight';
  protectedDoor?: 'living' | 'glassRight'; // Limiter le débattement autour de l'interaction jusqu'au dégagement
  smartObjectId?: string; // target smart object ID
  slotId?: string; // specific slot inside the smart object
  targetZoneId?: string; // Destination intentionnelle déduite de la géométrie de zone
  navigation?: 'interaction'; // Transition locale autorisée uniquement avec son objet
  targetLocalPos?: [number, number, number]; // Coordonnées locales du SmartObject, résolues au déplacement
  targetPos?: [number, number, number]; // direct position instead of waypoint
  actionId?: string; // for INTERACT
  /** Wait for real one-shot playback, including asynchronous clip loading. */
  waitForAnimation?: boolean;
  animation?: string; // animation to play
  duration?: number; // for WAIT, INTERACT, ROTATE_360 or OBSERVE_OBJECT
  repeatCount?: number; // number of repetitions if duration is not set (default 1)
  repeatVariation?: boolean; // whether to re-randomize animation on each repeat cycle
  triggerEventKey?: string; // event to dispatch
  triggerEventValue?: boolean; // état explicite de l'action (sinon bascule)
  rotY?: number; // target rotation to face during interaction
}
