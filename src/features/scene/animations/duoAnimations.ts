import { ANIMATION_DEFINITIONS } from './animationRegistry';

export interface DuoAnimationDef {
  id: string;
  label: string;
  icon: string;
  isCombat: boolean;
  animA: string;
  animB: string;
  rotB?: number;
  offsetB?: [number, number, number];
  duration: number;
}

interface RawDuoAnimationDef extends Omit<DuoAnimationDef, 'duration'> {
  duration?: number;
}

const RAW_DUO_ANIMATIONS: RawDuoAnimationDef[] = [
  { id: 'cuddle_kiss', isCombat: false, label: 'Sit Cuddle Kiss', icon: '😘', animA: 'miley-armature-cuddle-kiss-m', animB: 'miley-armature-cuddle-kiss-f', offsetB: [10, 0, 20] },
  { id: 'sit-cuddle', isCombat: false, label: 'Sit Cuddle Hug', icon: '🛋️', animA: 'miley-armature-sit-cuddle-hug-m', animB: 'miley-armature-sit-cuddle-hug-f', offsetB: [0, 0, 20] },
  { id: 'pop_dance', isCombat: false, label: 'Pop Dance', icon: '🕺', animA: 'miley-armature-couple-pop-dance-m', animB: 'miley-armature-couple-pop-dance-f', offsetB: [-30, 0, -5] },
  { id: 'energetic_dance', isCombat: false, label: 'Energetic Dance', icon: '🕺', animA: 'miley-armature-energetic-dance-m', animB: 'miley-armature-energetic-dance-f', offsetB: [-100, 0, 0] },
  { id: 'slow_dance', isCombat: false, label: 'Slow Dance', icon: '💃', animA: 'miley-armature-slow-dance-m', animB: 'miley-armature-slow-dance-f', offsetB: [0, 0, 30] },
  { id: 'eye_to_eye', isCombat: false, label: 'Eye to Eye Kiss', icon: '🤗', animA: 'miley-armature-eye-to-eye-hug-kiss-f', animB: 'miley-armature-eye-to-eye-hug-kiss-m', offsetB: [0, 0, 30] },
  { id: 'kiss_man_woman', isCombat: false, label: 'Baiser Homme / Femme', icon: '💋', animA: 'kiss-from-woman', animB: 'kiss-from-man', rotB: Math.PI, offsetB: [0, 0, 60] },
  { id: 'kiss', isCombat: false, label: 'Baiser', icon: '💏', animA: 'kiss', animB: 'kiss-1', rotB: Math.PI, offsetB: [0, 0, 50] },
  { id: 'farewell_kiss', isCombat: false, label: 'Farewell Kiss', icon: '👋', animA: 'miley-armature-farewell-kiss-m', animB: 'miley-armature-farewell-kiss-f', offsetB: [-70, 0, 0] },
  { id: 'date_bearhug', isCombat: false, label: 'Date Bearhug', icon: '🐻', animA: 'miley-armature-date-bearhug-m', animB: 'miley-armature-date-bearhug-f', offsetB: [0, 0, 610] },
  { id: 'propose', isCombat: false, label: 'Propose', icon: '💍', animA: 'miley-armature-propose-f', animB: 'miley-armature-propose-m', offsetB: [-65, 0, 0] },
  { id: 'high_five', isCombat: false, label: 'High Five', icon: '🖐️', animA: 'high-five-a', animB: 'high-five-b', rotB: Math.PI, offsetB: [-120, 0, -14] },
  { id: 'b1', isCombat: true, label: 'B1', icon: '💥', animA: 'miley-armature-b1-fall-kicked-knockout', animB: 'miley-armature-b1-attack-back-somersault-flip', offsetB: [-100, 0, 0] },
  { id: 'd1', isCombat: true, label: 'D1', icon: '🤺', animA: 'miley-armature-d1-attack-arms-block', animB: 'miley-armature-d1-dodge-sideways', offsetB: [-100, 0, 0] },
  { id: 'd4', isCombat: true, label: 'D4', icon: '🤺', animA: 'miley-armature-d4-attack-reverse-front-snap-kick', animB: 'miley-armature-d4-dodge-roll-back', offsetB: [-120, 0, 0] },
  { id: 'f2', isCombat: true, label: 'F2', icon: '🥊', animA: 'miley-armature-f2-attack-straight-punch02', animB: 'miley-armature-f2-fall-to-ground-face-up01', offsetB: [-100, 0, 0] },
  { id: 'h1', isCombat: true, label: 'H1', icon: '👊', animA: 'miley-armature-h1-hit-punches', animB: 'miley-armature-h1-attack-punches', offsetB: [-100, 0, 0] },
  { id: 'h2', isCombat: true, label: 'H2', icon: '👊', animA: 'miley-armature-h2-attack-side-kicks', animB: 'miley-armature-h2-hit-dodge', offsetB: [-100, 0, 0] },
  { id: 'h4', isCombat: true, label: 'H4', icon: '👊', animA: 'miley-armature-h4-attack-rising-kick', animB: 'miley-armature-h4-hit-staggering', offsetB: [-100, 0, 0] },
  { id: 'ko1', isCombat: true, label: 'Ko1', icon: '😵', animA: 'miley-armature-ko1-fall-to-ground-sprawl', animB: 'miley-armature-ko1-attack-uppercut', offsetB: [-100, 0, 0] },
  { id: 'ko2', isCombat: true, label: 'Ko2', icon: '😵', animA: 'miley-armature-ko2-attack-hood-kicks', animB: 'miley-armature-ko2-fall-to-ground-axel-down', offsetB: [-100, 0, 0] },
  { id: 'ko3', isCombat: true, label: 'Ko3', icon: '😵', animA: 'miley-armature-ko3-attack-hammer-fist', animB: 'miley-armature-ko3-fall-to-ground-side-up02', offsetB: [-100, 0, 0] },
  { id: 'p1', isCombat: true, label: 'P1', icon: '😤', animA: 'miley-armature-p1-standoff-push-knockout', animB: 'miley-armature-p1-standoff-block-straight-punch', offsetB: [-190, 0, 0] },
  { id: 'p2', isCombat: true, label: 'P2', icon: '😤', animA: 'miley-armature-p2-standoff-provokes-m1', animB: 'miley-armature-p2-standoff-provokes-m2', offsetB: [-290, 0, 0] },
  { id: 's1', isCombat: true, label: 'S1', icon: '🥋', animA: 'miley-armature-s1-sparring-punch-m1', animB: 'miley-armature-s1-sparring-punch-m2', offsetB: [-100, -11, 0] },
  { id: 's2', isCombat: true, label: 'S2', icon: '🥋', animA: 'miley-armature-s2-sparring-dodges01', animB: 'miley-armature-s2-sparring-kicks', offsetB: [-100, 0, 0] },
  { id: 's3', isCombat: true, label: 'S3', icon: '🥋', animA: 'miley-armature-s3-sparring-dodges02', animB: 'miley-armature-s3-sparring-reverse-kicks', offsetB: [-100, 0, 0] },
  { id: 's4', isCombat: true, label: 'S4', icon: '🥋', animA: 'miley-armature-s4-sparring-double-kicks-m1', animB: 'miley-armature-s4-sparring-double-kicks-m2', offsetB: [-100, 0, 0] },
  { id: 's5', isCombat: true, label: 'S5', icon: '🥋', animA: 'miley-armature-s5-sparring-block-kick', animB: 'miley-armature-s5-sparring-block-hit', offsetB: [-100, 0, 0] },
  { id: 't1', isCombat: true, label: 'T1', icon: '🤼', animA: 'miley-armature-t1-attack-thrown', animB: 'miley-armature-t1-hit-suplex', offsetB: [-110, 0, 0] },
  { id: 't3', isCombat: true, label: 'T3', icon: '🤼', animA: 'miley-armature-t3-fall-shoulder-throw', animB: 'miley-armature-t3-attack-shoulder-throw', offsetB: [-100, 0, 0] },
  { id: 't4', isCombat: true, label: 'T4', icon: '🤼', animA: 'miley-armature-t4-fall-belly-to-back-slam', animB: 'miley-armature-t4-attack-knee-strike', offsetB: [-100, 0, 0] },
  { id: 't5', isCombat: true, label: 'T5', icon: '🤼', animA: 'miley-armature-t5-attack-headlock-takeover', animB: 'miley-armature-t5-fall-headlock-takeover', offsetB: [-400, 0, 0] },
  { id: 'double_leg_takedown', isCombat: true, label: 'Double Leg Takedown', icon: '🤼', animA: 'best-double-leg-takedown-attacker', animB: 'best-double-leg-takedown-victim', rotB: Math.PI, offsetB: [0, 0, 250] },
  { id: 'double_leg_takedown_pair', isCombat: true, label: 'Double Leg Takedown (Court)', icon: '🤼', animA: 'double-leg-takedown-attacker', animB: 'double-leg-takedown-victim', rotB: Math.PI, offsetB: [0, 0, 250] },
  { id: 'release_hostage', isCombat: true, label: 'Libération d\'otage (Villain / Hostage)', icon: '🚨', animA: 'release-hostage-villain', animB: 'release-hostage-hostage', rotB: 0, offsetB: [0, 0, 40] },
  { id: 'fist_fight', isCombat: true, label: 'Combat de poings (Fist Fight B / A)', icon: '🥊', animA: 'fist-fight-b', animB: 'fist-fight-a', rotB: Math.PI, offsetB: [0, 0, 120] },
  { id: 'taken_hostage', isCombat: true, label: 'Prise d\'otage', icon: '🚨', animA: 'taken-hostage-victim', animB: 'taken-hostage-villain', offsetB: [0, 0, -80] },
  { id: 'shoulder_throw', isCombat: true, label: 'Projection épaule', icon: '🥋', animA: 'shoulder-throw-victim', animB: 'shoulder-throw-aggressor' },
  { id: 'brutal_assassination', isCombat: true, label: 'Assassinat brutal', icon: '🗡️', animA: 'brutal-assassination', animB: 'brutal-assassination-1', rotB: 0, offsetB: [0, 0, -190] },
  { id: 'hokey_pokey', isCombat: false, label: 'Hokey Pokey', icon: '👯', animA: 'hokey-pokey', animB: 'hokey-pokey', offsetB: [-100, 0, 0] }
];

const animDurationMap = new Map<string, number>();
for (const def of ANIMATION_DEFINITIONS) {
  animDurationMap.set(def.id.toLowerCase(), def.duration);
  if (def.aliases) {
    for (const a of def.aliases) {
      animDurationMap.set(a.toLowerCase(), def.duration);
    }
  }
}

export const DUO_ANIMATIONS: DuoAnimationDef[] = RAW_DUO_ANIMATIONS.map((def) => ({
  ...def,
  duration: def.duration ?? animDurationMap.get(def.animA.toLowerCase()) ?? 5.0,
}));

// Index de recherche rapide O(1)
const duoDefById = new Map<string, DuoAnimationDef>();
const duoDefByClipOrPath = new Map<string, DuoAnimationDef>();

for (const def of DUO_ANIMATIONS) {
  const idLower = def.id.toLowerCase();
  duoDefById.set(idLower, def);
  duoDefByClipOrPath.set(idLower, def);
  duoDefByClipOrPath.set(def.animA.toLowerCase(), def);

  const animDef = ANIMATION_DEFINITIONS.find((a) => a.id.toLowerCase() === def.animA.toLowerCase());
  if (animDef) {
    duoDefByClipOrPath.set(animDef.path.toLowerCase(), def);
    duoDefByClipOrPath.set(animDef.id.toLowerCase(), def);
    if (animDef.aliases) {
      for (const al of animDef.aliases) {
        duoDefByClipOrPath.set(al.toLowerCase(), def);
      }
    }
  }
}

/**
 * Retourne dynamiquement tous les IDs d'animations Duo enregistrées.
 */
export function getAllDuoAnimationIds(): string[] {
  return DUO_ANIMATIONS.map((def) => def.id);
}

/**
 * Retrouve une définition d'animation Duo par son identifiant unique.
 */
export function getDuoAnimationDef(id?: string): DuoAnimationDef | undefined {
  if (!id) return undefined;
  return duoDefById.get(id.trim().toLowerCase());
}

/**
 * Retrouve une définition d'animation Duo à partir d'un identifiant de clip (animA) ou de son chemin.
 */
export function getDuoAnimationForClip(clipOrPath?: string): DuoAnimationDef | undefined {
  if (!clipOrPath) return undefined;
  return duoDefByClipOrPath.get(clipOrPath.trim().toLowerCase());
}

/** Xbot participe uniquement aux duos de combat. */
export function canCharacterPerformDuo(characterId: string, def: DuoAnimationDef): boolean {
  return characterId !== 'xbot' || def.isCombat;
}

/** Participants réellement affichés dans un aperçu, sans modifier la fiche ouverte. */
export function resolveDuoPreviewParticipants(def: DuoAnimationDef, leaderId = 'native', partnerId?: string): { leaderId: string; partnerId: string } {
  const leader = canCharacterPerformDuo(leaderId, def)
    ? leaderId
    : partnerId === 'native' ? 'rosanna' : 'native';
  const partner = partnerId && partnerId !== leader && canCharacterPerformDuo(partnerId, def)
    ? partnerId
    : leader === 'native' ? 'rosanna' : 'native';
  return { leaderId: leader, partnerId: partner };
}
