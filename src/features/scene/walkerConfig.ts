import { type LaraVariant } from './LaraVariants';
import { WALKER_ANIM_OPTIONS } from './animOptions';

export interface CharacterConfig {
  id: string;
  name: string;
  path: string;
  pos: [number, number, number];
  rot: number;
  variant?: LaraVariant;
  height: number;
  sittingScenePath?: string;
  customIdleAnimPath?: string;
  isLara?: boolean;
}

export const CHARACTERS: CharacterConfig[] = [
  // 11 stylized Laras
  { id: 'native', name: 'Lara (Native)', path: 'characters/lara/lara_native.glb', pos: [140, 0, 30], rot: 1.9, variant: 'native', height: 173.4 },
  { id: 'rosanna', name: 'Rosanna', path: 'characters/lara/lara_native.glb', pos: [251, 0, 178], rot: 1.325 + Math.PI, variant: 'rosanna', height: 173.4 },
  { id: 'marissa', name: 'Marissa', path: 'characters/lara/lara_native.glb', pos: [160, 0, -440], rot: 0, variant: 'marissa', height: 173.4 },
  { id: 'delphina', name: 'Delphina', path: 'characters/lara/lara_native.glb', pos: [120, 0, -250], rot: 1, variant: 'delphina', height: 173.4 },

  // { id: 'sara', name: 'Sara', path: 'characters/lara/lara_native.glb', pos: [340, -40, -310], rot: -Math.PI / 2, variant: 'sara', height: 173.4, sittingScenePath: 'animations/anim_climbing.glb', customIdleAnimPath: 'animations/anim_climbing.glb' },
  { id: 'cha', name: 'Cha', path: 'characters/lara/lara_native.glb', pos: [150, 0, -150], rot: Math.PI / 2, variant: 'cha', height: 173.4,
    customIdleAnimPath: (() => {
      const valid = WALKER_ANIM_OPTIONS.filter(o => {
        const l = o.label.toLowerCase();
        return o.value.includes('.glb') && !l.includes('dance') && !l.includes('pose') && !l.includes('dancing');
      });
      return valid[Math.floor(Math.random() * valid.length)].value;
    })()
  },
  { id: 'vivida', name: 'ViviDa', path: 'characters/lara/lara_native.glb', pos: [200, 0, 215], rot: Math.PI, variant: 'vivida', height: 173.4, sittingScenePath: 'animations/anim_texting_while_standing.glb', customIdleAnimPath: 'animations/anim_texting_while_standing.glb' },
  { id: 'xbot', name: 'Xbot', path: 'characters/xbot/Xbot_official.glb', pos: [288, 0, 603], rot: 0, variant: 'native', height: 173.4, isLara: false },
  {
    id: 'sabira', name: 'Sabira', path: 'characters/lara/lara_native.glb', pos: [100, 0, 370], rot: Math.atan2(158 - 100, 200 - 370), variant: 'sabira', height: 173.4,
    customIdleAnimPath: (() => { const anims = ['animations/anim_hip_hop_dancing.glb', 'animations/anim_hip_hop_dancing_1.glb', 'animations/anim_hip_hop_dancing_6.glb', 'animations/anim_hip_hop_dancing.glb', 'animations/anim_locking_hip_hop_dance.glb', 'animations/anim_robot_hip_hop_dance.glb', 'animations/anim_samba_dancing.glb', 'animations/anim_samba_dancing_2.glb', 'animations/anim_belly_dance.glb', 'animations/anim_gangnam_style.glb']; return anims[Math.floor(Math.random() * anims.length)]; })(),
    sittingScenePath: 'animations/anim_snake_hip_hop_dance.glb'
  },
  // { id: 'safa', name: 'Safa', path: 'characters/lara/lara_native.glb', pos: [150, 0, -400], rot: Math.PI, variant: 'safa', height: 173.4, customIdleAnimPath: 'animations/anim_stall_soccerball_1.glb', sittingScenePath: 'animations/anim_stall_soccerball_1.glb' },
  { id: 'sandra', name: 'Sandra', path: 'characters/lara/lara_native.glb', pos: [-400, 0, 0], rot: 0, variant: 'sandra', height: 173.4 },
  { id: 'rajaa', name: 'Rajaa', path: 'characters/lara/lara_native.glb', pos: [-450, 0, 0], rot: 0, variant: 'rajaa', height: 173.4 },
  // {
  //   id: 'romana', name: 'Romana', path: 'characters/lara/lara_native.glb', pos: [270, 45, -110], rot: Math.PI, variant: 'romana', height: 173.4,
  //   customIdleAnimPath: (() => { const anims = ['animations/anim_female_laying_pose_9.glb', 'animations/anim_female_standing_pose.glb', 'animations/anim_female_standing_pose_1.glb', 'animations/anim_female_standing_pose_2.glb', 'animations/anim_female_sitting_pose.glb', 'animations/anim_female_dance_pose.glb', 'animations/anim_female_dynamic_pose.glb']; return anims[Math.floor(Math.random() * anims.length)]; })()
  // },
  // {
  //   id: 'angelina', name: 'Angelina', path: 'characters/lara/lara_native.glb',
  //   pos: [Math.floor(Math.random() * 200) + 50, 0, -(Math.floor(Math.random() * 300) + 300)] as [number, number, number],
  //   rot: Math.random() * Math.PI * 2, variant: 'angelina', height: 173.4,
  //   customIdleAnimPath: (() => { const anims = ['animations/anim_dancing_twerk.glb', 'animations/anim_belly_dance.glb', 'animations/anim_hip_hop_dancing.glb', 'animations/anim_hip_hop_dancing_1.glb', 'animations/anim_salsa_dancing.glb', 'animations/anim_salsa_dancing_4.glb', 'animations/anim_samba_dancing.glb', 'animations/anim_capoeira.glb', 'animations/anim_rumba_dancing.glb', 'animations/anim_twist_dance.glb']; return anims[Math.floor(Math.random() * anims.length)]; })()
  // },
  // {
  //   id: 'lgbta', name: 'Lgbta', path: 'characters/lara/lara_native.glb',
  //   pos: [Math.floor(Math.random() * 200) + 150, 0, -(Math.floor(Math.random() * 300) + 250)] as [number, number, number],
  //   rot: Math.random() * Math.PI * 2, variant: 'lgbta', height: 173.4,
  //   customIdleAnimPath: (() => { const anims = ['animations/anim_belly_dance.glb', 'animations/anim_dancing_twerk.glb', 'animations/anim_macarena_dance.glb', 'animations/anim_macarena_dance.glb', 'animations/anim_hip_hop_dancing_1.glb', 'animations/anim_swing_dancing.glb', 'animations/anim_jazz_dancing.glb', 'animations/anim_can_can.glb', 'animations/anim_gangnam_style.glb', 'animations/anim_ymca_dance.glb']; return anims[Math.floor(Math.random() * anims.length)]; })()
  // }
];

export const ACCESSORIES_MESH_NAMES = new Set([
  'backpack', 'oxygen',
  'binoculars', 'buckle', 'camera', 'goggles', 'grapple',
  'handgun_left', 'handgun_right', 'mp5', 'mp5_ammo',
  'handgun_left_holster', 'handgun_right_holster', 'mp5_holster', 'holster',
  'headset', 'pda', 'personal_light', 'ribbon', 'purse',
  'grenades', 'accessories', 'handgun_part'
]);

/** PNJ en mode exploration autonome (scénarios aléatoires et vie quotidienne) */
export const AUTONOMOUS_NPC_IDS = new Set([
  'native', 'delphina', 'vivida', 'angelina', 'cha', 'sabira', 'lgbta', 'marissa', 'rosanna'
]);


