import { getAnimationDef } from '../animations/animationResolver';

export interface DuoAnimationDef {
  id: string;
  label: string;
  icon: string;
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
  { id: 'b1', label: 'B1', icon: '💥', animA: 'miley-armature-b1-fall-kicked-knockout', animB: 'miley-armature-b1-attack-back-somersault-flip', offsetB: [-100, 0, 0] },
  { id: 'd1', label: 'D1', icon: '🤺', animA: 'miley-armature-d1-attack-arms-block', animB: 'miley-armature-d1-dodge-sideways', offsetB: [-100, 0, 0] },
  { id: 'd4', label: 'D4', icon: '🤺', animA: 'miley-armature-d4-attack-reverse-front-snap-kick', animB: 'miley-armature-d4-dodge-roll-back', offsetB: [-120, 0, 0] },
  { id: 'f2', label: 'F2', icon: '🥊', animA: 'miley-armature-f2-attack-straight-punch02', animB: 'miley-armature-f2-fall-to-ground-face-up01', offsetB: [-100, 0, 0] },
  { id: 'h1', label: 'H1', icon: '👊', animA: 'miley-armature-h1-hit-punches', animB: 'miley-armature-h1-attack-punches', offsetB: [-100, 0, 0] },
  { id: 'h2', label: 'H2', icon: '👊', animA: 'miley-armature-h2-attack-side-kicks', animB: 'miley-armature-h2-hit-dodge', offsetB: [-100, 0, 0] },
  { id: 'h4', label: 'H4', icon: '👊', animA: 'miley-armature-h4-attack-rising-kick', animB: 'miley-armature-h4-hit-staggering', offsetB: [-100, 0, 0] },
  { id: 'ko1', label: 'Ko1', icon: '😵', animA: 'miley-armature-ko1-fall-to-ground-sprawl', animB: 'miley-armature-ko1-attack-uppercut', offsetB: [-100, 0, 0] },
  { id: 'ko2', label: 'Ko2', icon: '😵', animA: 'miley-armature-ko2-attack-hood-kicks', animB: 'miley-armature-ko2-fall-to-ground-axel-down', offsetB: [-100, 0, 0] },
  { id: 'ko3', label: 'Ko3', icon: '😵', animA: 'miley-armature-ko3-attack-hammer-fist', animB: 'miley-armature-ko3-fall-to-ground-side-up02', offsetB: [-100, 0, 0] },
  { id: 'p1', label: 'P1', icon: '😤', animA: 'miley-armature-p1-standoff-push-knockout', animB: 'miley-armature-p1-standoff-block-straight-punch', offsetB: [-190, 0, 0] },
  { id: 'p2', label: 'P2', icon: '😤', animA: 'miley-armature-p2-standoff-provokes-m1', animB: 'miley-armature-p2-standoff-provokes-m2', offsetB: [-290, 0, 0] },
  { id: 's1', label: 'S1', icon: '🥋', animA: 'miley-armature-s1-sparring-punch-m1', animB: 'miley-armature-s1-sparring-punch-m2', offsetB: [-100, -11, 0] },
  { id: 's2', label: 'S2', icon: '🥋', animA: 'miley-armature-s2-sparring-dodges01', animB: 'miley-armature-s2-sparring-kicks', offsetB: [-100, 0, 0] },
  { id: 's3', label: 'S3', icon: '🥋', animA: 'miley-armature-s3-sparring-dodges02', animB: 'miley-armature-s3-sparring-reverse-kicks', offsetB: [-100, 0, 0] },
  { id: 's4', label: 'S4', icon: '🥋', animA: 'miley-armature-s4-sparring-double-kicks-m1', animB: 'miley-armature-s4-sparring-double-kicks-m2', offsetB: [-100, 0, 0] },
  { id: 's5', label: 'S5', icon: '🥋', animA: 'miley-armature-s5-sparring-block-kick', animB: 'miley-armature-s5-sparring-block-hit', offsetB: [-100, 0, 0] },
  { id: 't1', label: 'T1', icon: '🤼', animA: 'miley-armature-t1-attack-thrown', animB: 'miley-armature-t1-hit-suplex', offsetB: [-110, 0, 0] },
  { id: 't3', label: 'T3', icon: '🤼', animA: 'miley-armature-t3-fall-shoulder-throw', animB: 'miley-armature-t3-attack-shoulder-throw', offsetB: [-100, 0, 0] },
  { id: 't4', label: 'T4', icon: '🤼', animA: 'miley-armature-t4-fall-belly-to-back-slam', animB: 'miley-armature-t4-attack-knee-strike', offsetB: [-100, 0, 0] },
  { id: 't5', label: 'T5', icon: '🤼', animA: 'miley-armature-t5-attack-headlock-takeover', animB: 'miley-armature-t5-fall-headlock-takeover', offsetB: [-400, 0, 0] },
  { id: 'pop_dance', label: 'Pop Dance', icon: '🕺', animA: 'miley-armature-couple-pop-dance-m', animB: 'miley-armature-couple-pop-dance-f', offsetB: [-30, 0, 0] },
  { id: 'energetic_dance', label: 'Energetic Dance', icon: '🕺', animA: 'miley-armature-energetic-dance-m', animB: 'miley-armature-energetic-dance-f', offsetB: [-100, 0, 0] },
  { id: 'slow_dance', label: 'Slow Dance', icon: '💃', animA: 'miley-armature-slow-dance-m', animB: 'miley-armature-slow-dance-f', offsetB: [0, 0, 40] },
  { id: 'cuddle_kiss', label: 'Cuddle Kiss', icon: '😘', animA: 'miley-armature-cuddle-kiss-m', animB: 'miley-armature-cuddle-kiss-f', offsetB: [-50, 0, 0] },
  { id: 'eye_to_eye', label: 'Eye to Eye Kiss', icon: '🤗', animA: 'miley-armature-eye-to-eye-hug-kiss-f', animB: 'miley-armature-eye-to-eye-hug-kiss-m', offsetB: [-30, 0, 0] },
  { id: 'farewell_kiss', label: 'Farewell Kiss', icon: '👋', animA: 'miley-armature-farewell-kiss-m', animB: 'miley-armature-farewell-kiss-f', offsetB: [-70, 0, 0] },
  { id: 'date_bearhug', label: 'Date Bearhug', icon: '🐻', animA: 'miley-armature-date-bearhug-m', animB: 'miley-armature-date-bearhug-f', offsetB: [0, 0, 610] },
  { id: 'propose', label: 'Propose', icon: '💍', animA: 'miley-armature-propose-f', animB: 'miley-armature-propose-m', offsetB: [-65, 0, 0] },
  { id: 'sit-cuddle', label: 'Sit Cuddle', icon: '🛋️', animA: 'miley-armature-sit-cuddle-hug-m', animB: 'miley-armature-sit-cuddle-hug-f', offsetB: [0, 0, 20] },
  { id: 'double_leg_takedown', label: 'Double Leg Takedown', icon: '🤼', animA: 'anim-best-double-leg-takedown-attacker', animB: 'anim-best-double-leg-takedown-victim', rotB: Math.PI, offsetB: [0, 0, 250] },
  { id: 'double_leg_takedown_pair', label: 'Double Leg Takedown (Court)', icon: '🤼', animA: 'anim-double-leg-takedown-attacker', animB: 'anim-double-leg-takedown-victim', rotB: Math.PI, offsetB: [0, 0, 250] },
  { id: 'release_hostage', label: 'Libération d\'otage (Villain / Hostage)', icon: '🚨', animA: 'anim-release-hostage-villain', animB: 'anim-release-hostage-hostage', rotB: 0, offsetB: [0, 0, 40] },
  { id: 'fist_fight', label: 'Combat de poings (Fist Fight B / A)', icon: '🥊', animA: 'anim-fist-fight-b', animB: 'anim-fist-fight-a', rotB: Math.PI, offsetB: [0, 0, 120] },
  { id: 'taken_hostage', label: 'Prise d\'otage', icon: '🚨', animA: 'anim-taken-hostage-victim', animB: 'anim-taken-hostage-villain', offsetB: [0, 0, -80] },
  { id: 'shoulder_throw', label: 'Projection épaule', icon: '🥋', animA: 'anim-shoulder-throw-victim', animB: 'anim-shoulder-throw-aggressor' },
  { id: 'kiss_man_woman', label: 'Baiser Homme / Femme', icon: '💋', animA: 'anim-kiss-from-woman', animB: 'anim-kiss-from-man', rotB: Math.PI, offsetB: [0, 0, 50] },
  { id: 'kiss', label: 'Baiser', icon: '💏', animA: 'anim-kiss', animB: 'anim-kiss-1', rotB: Math.PI, offsetB: [0, 0, 50] },
  { id: 'brutal_assassination', label: 'Assassinat brutal', icon: '🗡️', animA: 'anim-brutal-assassination', animB: 'anim-brutal-assassination-1', rotB: 0, offsetB: [0, 0, -190] },
  { id: 'hokey_pokey', label: 'Hokey Pokey', icon: '👯', animA: 'anim-hokey-pokey', animB: 'anim-hokey-pokey', offsetB: [-100, 0, 0] }
];

export const DUO_ANIMATIONS: DuoAnimationDef[] = RAW_DUO_ANIMATIONS.map((def) => ({
  ...def,
  duration: def.duration ?? getAnimationDef(def.animA)?.duration ?? 5.0,
}));
