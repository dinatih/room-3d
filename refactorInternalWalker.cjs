const ANIM_URLS = [
  'media/sandbox/anims/anim_falling.glb',
  'media/sandbox/anims/anim_crouch_to_stand.glb',
  'media/sandbox/anims/anim_sitting_idle.glb',
  'media/sandbox/anims/anim_swimming_to_edge.glb',
  'media/sandbox/anims/anim_push_up.glb',
  'media/sandbox/anims/anim_climbing.glb',
  'media/sandbox/anims/anim_open_door_outwards.glb',
  'media/sandbox/anims/anim_texting_while_standing.glb',
  'media/sandbox/anims/anim_laying_idle_1.glb',
  'media/sandbox/anims/anim_belly_dance.glb',
  'media/sandbox/anims/anim_dancing_twerk.glb',
  'media/sandbox/anims/anim_stall_soccerball_1.glb',
  'media/sandbox/anims/anim_body_jab_cross.glb',
  'media/sandbox/anims/anim_female_laying_pose_9.glb',
  'media/sandbox/anims/anim_best_double_leg_takedown_victim.glb',
  'media/sandbox/anims/anim_best_double_leg_takedown_attacker.glb',
  'media/sandbox/anims/anim_female_standing_pose.glb',
  'media/sandbox/anims/anim_female_standing_pose_1.glb',
  'media/sandbox/anims/anim_female_standing_pose_2.glb',
  'media/sandbox/anims/anim_female_sitting_pose.glb',
  'media/sandbox/anims/anim_female_sitting_pose_1.glb',
  'media/sandbox/anims/anim_female_sitting_pose_3.glb',
  'media/sandbox/anims/anim_female_dance_pose.glb',
  'media/sandbox/anims/anim_female_dynamic_pose.glb',
  'media/sandbox/anims/anim_shaking_hands_2.glb',
  'media/sandbox/anims/anim_hand_raising.glb',
  'media/sandbox/anims/anim_hip_hop_dancing.glb',
  'media/sandbox/anims/anim_hip_hop_dancing_1.glb',
  'media/sandbox/anims/anim_hip_hop_dancing_2.glb',
  'media/sandbox/anims/anim_hip_hop_dancing_4.glb',
  'media/sandbox/anims/anim_hip_hop_dancing_6.glb',
  'media/sandbox/anims/anim_locking_hip_hop_dance.glb',
  'media/sandbox/anims/anim_robot_hip_hop_dance.glb',
  'media/sandbox/anims/anim_salsa_dancing.glb',
  'media/sandbox/anims/anim_salsa_dancing_1.glb',
  'media/sandbox/anims/anim_salsa_dancing_3.glb',
  'media/sandbox/anims/anim_salsa_dancing_4.glb',
  'media/sandbox/anims/anim_samba_dancing.glb',
  'media/sandbox/anims/anim_samba_dancing_1.glb',
  'media/sandbox/anims/anim_samba_dancing_2.glb',
  'media/sandbox/anims/anim_house_dancing.glb',
  'media/sandbox/anims/anim_breakdance_uprock.glb',
  'media/sandbox/anims/anim_gangnam_style.glb',
  'media/sandbox/anims/anim_capoeira.glb',
  'media/sandbox/anims/anim_rumba_dancing.glb',
  'media/sandbox/anims/anim_twist_dance.glb',
  'media/sandbox/anims/anim_macarena_dance.glb',
  'media/sandbox/anims/anim_swing_dancing.glb',
  'media/sandbox/anims/anim_jazz_dancing.glb',
  'media/sandbox/anims/anim_can_can.glb',
  'media/sandbox/anims/anim_ymca_dance.glb',
];

const fs = require('fs');

let walkerCode = fs.readFileSync('src/features/scene/Walker.tsx', 'utf-8');

const regexToRemove = /\/\/ Preloaded anim paths[\s\S]*?\]\);/g;
walkerCode = walkerCode.replace(regexToRemove, `  const gltfs = useGLTF(ANIM_URLS) as any[];\n\n  const animGltfs: Record<string, any> = useMemo(() => {\n    const map: Record<string, any> = {};\n    ANIM_URLS.forEach((url, i) => {\n      map[url] = gltfs[i];\n    });\n    return map;\n  }, [gltfs]);`);

walkerCode = `const ANIM_URLS = ${JSON.stringify(ANIM_URLS, null, 2)};\n\n` + walkerCode;

const preloadsToRemove = /useGLTF\.preload\('media\/sandbox\/anims\/miley_blender_idle01_f\.glb'\);[\s\S]*?useGLTF\.preload\('media\/sandbox\/anims\/anim_texting_while_standing\.glb'\);\n\n\n/g;
walkerCode = walkerCode.replace(preloadsToRemove, `useGLTF.preload('media/sandbox/anims/miley_blender_idle01_f.glb');\nuseGLTF.preload('media/sandbox/anims/anim_walking.glb');\nuseGLTF.preload('media/sandbox/anims/anim_running.glb');\nANIM_URLS.forEach(url => useGLTF.preload(url));\n\n`);

fs.writeFileSync('src/features/scene/Walker.tsx', walkerCode);
console.log('InternalWalker refactored!');
