# Animations 3D — Organisation des sous-dossiers

Ce dossier regroupe les **835 animations GLB** du projet, classées par thématique dans des sous-dossiers dédiés :

```text
public/animations/
├── locomotion/          # Déplacements (marches, courses, sauts, escaliers, chutes, glissades, acrobaties)
│   ├── anim_walking.glb
│   ├── anim_running.glb
│   ├── anim_jump.glb
│   ├── anim_falling.glb
│   └── ... (176 fichiers)
│
├── dances/              # Chorégraphies & danses (hip-hop, salsa, samba, breakdance, twerk, belly, jazz...)
│   ├── anim_belly_dance.glb
│   ├── anim_dancing_twerk.glb
│   ├── anim_salsa_dancing.glb
│   ├── miley_armature_10_dance_like_sidestep.glb
│   └── ... (101 fichiers)
│
├── poses_idles/         # Poses & attentes (debout, assis, couché, repos, poses photo, t-pose)
│   ├── anim_female_standing_pose.glb
│   ├── anim_female_sitting_pose.glb
│   ├── anim_laying_idle_1.glb
│   ├── anim_sitting_idle.glb
│   └── ... (192 fichiers)
│
├── combat/              # Arts martiaux & combats (boxe, coups de pied, esquives, parades, capoeira, armes)
│   ├── anim_body_jab_cross.glb
│   ├── anim_best_double_leg_takedown_attacker.glb
│   ├── anim_armada.glb
│   ├── anim_block.glb
│   └── ... (238 fichiers)
│
├── sports_fitness/      # Fitness, musculation & sports (pompes, squats, yoga, étirements, foot, natation)
│   ├── anim_push_up.glb
│   ├── anim_air_squat_bent_arms.glb
│   ├── anim_swimming_to_edge.glb
│   ├── anim_stall_soccerball_1.glb
│   └── ... (42 fichiers)
│
├── emotes_gestures/     # Gestes expressifs & interactions sociales (saluts, applaudissements, rires, discussions)
│   ├── anim_shaking_hands_2.glb
│   ├── anim_hand_raising.glb
│   ├── anim_waving.glb
│   ├── anim_angry_gesture.glb
│   └── ... (44 fichiers)
│
└── interactions/        # Actions du quotidien & manipulation d'objets (smartphone/sms, ouvrir porte, porter, taper...)
    ├── anim_texting_while_standing.glb
    ├── anim_open_door_outwards.glb
    ├── anim_bartending.glb
    └── ... (42 fichiers)
```

## Utilisation dans le code

Pour charger une animation dans un composant R3F ou via Three.js :

```ts
const animPath = 'animations/locomotion/anim_walking.glb';
// ou
const dancePath = 'animations/dances/anim_salsa_dancing.glb';
```
