"""Convert AMASS (SSM, CMU, DanceDB) sports, couple & enjoy animations to Mixamo GLB
and register them in animationRegistry.ts.

Usage:
  blender --background --python scripts/convert_sports_and_vibe.py
"""

import math
import struct
import json
from pathlib import Path
import bpy
import numpy as np
from mathutils import Quaternion, Vector

ROOT = Path(__file__).resolve().parents[1]
TEMPLATE = ROOT / 'public/animations/mixamo/anim_salsa_dancing.glb'
REGISTRY_PATH = ROOT / 'src/features/scene/animations/animationRegistry.ts'

BONE_NAMES = [
    'mixamorig:Hips', 'mixamorig:LeftUpLeg', 'mixamorig:RightUpLeg', 'mixamorig:Spine',
    'mixamorig:LeftLeg', 'mixamorig:RightLeg', 'mixamorig:Spine1', 'mixamorig:LeftFoot',
    'mixamorig:RightFoot', 'mixamorig:Spine2', 'mixamorig:LeftToeBase', 'mixamorig:RightToeBase',
    'mixamorig:Neck', 'mixamorig:LeftShoulder', 'mixamorig:RightShoulder', 'mixamorig:Head',
    'mixamorig:LeftArm', 'mixamorig:RightArm', 'mixamorig:LeftForeArm', 'mixamorig:RightForeArm',
    'mixamorig:LeftHand', 'mixamorig:RightHand',
]

MIXAMO_TRANSLATION_SCALE = 1.17
ROOT_CANCEL = Quaternion((1, 0, 0), -math.pi / 2)

ANIMATIONS = [
    # 🏀 Basket
    {
        'id': 'basketball-shoot',
        'label': 'Basket : Tir & Dribble',
        'src': '/home/dinatih/3D Resources/animations/SSM/20160930_50032/dribble_shoot_sync_stageii.npz',
        'sub_dir': 'sports',
        'filename': 'anim_basketball_shoot.glb',
        'category': 'sports_fitness',
        'tags': ['basketball', 'basket', 'shoot', 'dribble', 'ball', 'sports'],
        'aliases': ['basketball', 'basket', 'tir-panier'],
    },
    {
        'id': 'basketball-cmu',
        'label': 'Basket : Jeu & Dribbles',
        'src': '/home/dinatih/3D Resources/animations/CMU/06/06_01_stageii.npz',
        'sub_dir': 'sports',
        'filename': 'anim_basketball_cmu.glb',
        'category': 'sports_fitness',
        'tags': ['basketball', 'basket', 'dribble', 'play', 'sports'],
        'aliases': ['basketball-play', 'jouer-basket'],
    },

    # ⚽ Foot
    {
        'id': 'soccer-dribble-kick',
        'label': 'Football : Conduite & Frappe',
        'src': '/home/dinatih/3D Resources/animations/SSM/20160930_50032/dribble_kick_sync_stageii.npz',
        'sub_dir': 'sports',
        'filename': 'anim_soccer_dribble_kick.glb',
        'category': 'sports_fitness',
        'tags': ['soccer', 'football', 'kick', 'dribble', 'ball', 'sports'],
        'aliases': ['soccer', 'football', 'foot', 'tir-foot'],
    },
    {
        'id': 'soccer-kick',
        'label': 'Football : Frappe au but',
        'src': '/home/dinatih/3D Resources/animations/CMU/10/10_01_stageii.npz',
        'sub_dir': 'sports',
        'filename': 'anim_soccer_kick.glb',
        'category': 'sports_fitness',
        'tags': ['soccer', 'football', 'kick', 'shot', 'sports'],
        'aliases': ['soccer-kick', 'frappe-foot'],
    },

    # 💑 Couple & Duo
    {
        'id': 'hasaposerviko-duo',
        'label': 'Hasaposerviko : Danse de couple folk',
        'src': '/home/dinatih/3D Resources/animations/DanceDB/DanceDB/20180501_AndreasdelaVara/ANDREAS_Hasaposerviko_poses.npz',
        'sub_dir': 'dances',
        'filename': 'anim_hasaposerviko_duo.glb',
        'category': 'dances',
        'tags': ['dance', 'couple', 'duo', 'folk', 'greek', 'partner'],
        'aliases': ['hasaposerviko', 'danse-couple-folk'],
    },
    {
        'id': 'zorbas-dance',
        'label': 'Danse Zorba : Duo folk',
        'src': '/home/dinatih/3D Resources/animations/DanceDB/DanceDB/20180501_CliodelaVara/CLIO_Zorbas_poses.npz',
        'sub_dir': 'dances',
        'filename': 'anim_zorbas_dance.glb',
        'category': 'dances',
        'tags': ['dance', 'couple', 'zorba', 'folk', 'greek', 'partner'],
        'aliases': ['zorba', 'danse-zorba'],
    },
    {
        'id': 'duo-martial-arts-combat',
        'label': 'Combat d’arts martiaux en duo',
        'src': '/home/dinatih/3D Resources/animations/CMU/60/60_01_stageii.npz',
        'sub_dir': 'combat',
        'filename': 'anim_duo_martial_arts.glb',
        'category': 'combat',
        'tags': ['combat', 'duo', 'martial-arts', 'fight', 'action'],
        'aliases': ['duo-fight', 'combat-duo', 'arts-martiaux-duo'],
    },

    # ✨ Enjoy & Happy Vibes
    {
        'id': 'happy-dance-olivia',
        'label': 'Danse de joie (Happy Dance)',
        'src': '/home/dinatih/3D Resources/animations/DanceDB/DanceDB/20131001_OliviaKyriakides/Olivia_Happy_C3D_poses.npz',
        'sub_dir': 'dances',
        'filename': 'anim_happy_dance.glb',
        'category': 'dances',
        'tags': ['dance', 'happy', 'joy', 'enjoy', 'celebration'],
        'aliases': ['happy-dance', 'danse-joie', 'joie'],
    },
    {
        'id': 'excited-dance-olivia',
        'label': 'Danse excitée & festive',
        'src': '/home/dinatih/3D Resources/animations/DanceDB/DanceDB/20131001_OliviaKyriakides/Olivia_Excited_C3D_poses.npz',
        'sub_dir': 'dances',
        'filename': 'anim_excited_dance.glb',
        'category': 'dances',
        'tags': ['dance', 'excited', 'party', 'enjoy', 'celebration'],
        'aliases': ['excited-dance', 'fete', 'danse-festive'],
    },
    {
        'id': 'relaxed-groove-olivia',
        'label': 'Groove détendu & chill',
        'src': '/home/dinatih/3D Resources/animations/DanceDB/DanceDB/20131001_OliviaKyriakides/Olivia_Relaxed_C3D_poses.npz',
        'sub_dir': 'dances',
        'filename': 'anim_relaxed_groove.glb',
        'category': 'dances',
        'tags': ['dance', 'relaxed', 'chill', 'groove', 'enjoy'],
        'aliases': ['relaxed-groove', 'danse-detendue', 'chill'],
    },
    {
        'id': 'pleased-dance-olivia',
        'label': 'Danse satisfaite & agréable',
        'src': '/home/dinatih/3D Resources/animations/DanceDB/DanceDB/20131001_OliviaKyriakides/Olivia_Pleased_C3D_poses.npz',
        'sub_dir': 'dances',
        'filename': 'anim_pleased_dance.glb',
        'category': 'dances',
        'tags': ['dance', 'pleased', 'satisfaction', 'enjoy'],
        'aliases': ['pleased-dance', 'satisfait'],
    },
]


def rodrigues_to_quat(rotation):
    angle = float(np.linalg.norm(rotation))
    if angle < 1e-8:
        return Quaternion((1, 0, 0, 0))
    axis = rotation / angle
    sine = math.sin(angle / 2)
    return Quaternion((math.cos(angle / 2), *(float(x * sine) for x in axis)))


def convert(npz_path: Path, output_path: Path):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(TEMPLATE))
    armatures = [o for o in bpy.data.objects if o.type == 'ARMATURE']
    if not armatures:
        raise RuntimeError("No armature found in template")
    armature = armatures[0]
    armature.animation_data_clear()
    armature.animation_data_create()
    armature.animation_data.action = bpy.data.actions.new(name='ArmatureAction')
    scene = bpy.context.scene
    scene.render.fps = 30
    for bone in armature.pose.bones:
        bone.rotation_mode = 'QUATERNION'

    with np.load(npz_path) as data:
        poses = data['poses']
        translations = data['trans']
        if 'mocap_frame_rate' in data:
            fps = float(data['mocap_frame_rate'])
        elif 'mocap_framerate' in data:
            fps = float(data['mocap_framerate'])
        elif 'fps' in data:
            fps = float(data['fps'])
        else:
            fps = 120.0

    target_fps = 30.0
    duration_sec = len(poses) / fps
    num_frames = max(1, int(round(duration_sec * target_fps)))

    bases = [armature.data.bones[name].matrix_local.to_3x3() for name in BONE_NAMES]
    hips = armature.pose.bones[BONE_NAMES[0]]

    # Center character at origin facing forward at frame 0
    q0 = ROOT_CANCEL @ rodrigues_to_quat(poses[0, :3])
    initial_yaw = q0.to_euler().y
    YAW_CANCEL = Quaternion((0, 1, 0), -initial_yaw)

    start_trans_x = float(translations[0][0])
    start_trans_z = -float(translations[0][1])

    for frame in range(1, num_frames + 1):
        t_sec = (frame - 1) / target_fps
        source_frame = min(len(poses) - 1, int(round(t_sec * fps)))
        pose = poses[source_frame]
        translation = translations[source_frame]

        for index, name in enumerate(BONE_NAMES):
            rotation = rodrigues_to_quat(pose[index * 3:(index + 1) * 3])
            if index == 0:
                rotation = YAW_CANCEL @ ROOT_CANCEL @ rotation
            basis = bases[index]
            bone = armature.pose.bones[name]
            bone.rotation_quaternion = (basis.inverted() @ rotation.to_matrix() @ basis).to_quaternion()
            bone.keyframe_insert(data_path='rotation_quaternion', frame=frame)

        # Centered world hips
        raw_x = float(translation[0]) - start_trans_x
        raw_y = float(translation[2])
        raw_z = -float(translation[1]) - start_trans_z

        rot_trans = YAW_CANCEL.to_matrix() @ Vector((raw_x, 0, raw_z))
        world_hips = Vector((rot_trans.x, raw_y, rot_trans.z))

        hips.location = world_hips * (100 * MIXAMO_TRANSLATION_SCALE) - hips.bone.head
        hips.keyframe_insert(data_path='location', frame=frame)

    scene.frame_start = 1
    scene.frame_end = num_frames
    output_path.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.export_scene.gltf(filepath=str(output_path), export_format='GLB', export_animations=True)

    data = output_path.read_bytes()
    json_length, = struct.unpack_from('<I', data, 12)
    gltf = json.loads(data[20:20 + json_length])
    inputs = {s['input'] for a in gltf['animations'] for s in a['samplers']}
    duration = round(max(gltf['accessors'][i]['max'][0] for i in inputs), 1)
    return {'frames': num_frames, 'duration': duration, 'size_kb': round(len(data) / 1024)}


def register_in_ts(converted_list):
    content = REGISTRY_PATH.read_text(encoding='utf-8')
    existing_ids = set()
    import re
    for m in re.finditer(r"id:\s*'([^']+)'", content):
        existing_ids.add(m.group(1))

    new_blocks = []
    for item in converted_list:
        if item['id'] in existing_ids:
            print(f"Skipping registration for {item['id']} (already exists in registry)")
            continue

        rel_path = f"animations/npz/{item['sub_dir']}/{item['filename']}"
        aliases_str = ", ".join(f"'{a}'" for a in item['aliases'])
        tags_str = ", ".join(f"'{t}'" for t in item['tags'])
        block = f"""  {{
    id: '{item['id']}',
    path: '{rel_path}',
    category: '{item['category']}',
    label: '{item['label']}',
    aliases: [{aliases_str}],
    tags: [{tags_str}],
    duration: {item['duration']},
  }},"""
        new_blocks.append(block)

    if not new_blocks:
        print("No new definitions to append to animationRegistry.ts")
        return

    # Insert right before the closing `];` of ANIMATION_DEFINITIONS
    last_bracket_pos = content.rfind('];')
    if last_bracket_pos == -1:
        print("Error: Could not find closing '];' in animationRegistry.ts")
        return

    updated_content = (
        content[:last_bracket_pos] +
        "\n  // ── NOUVELLES ANIMATIONS INTÉGRÉES (SPORTS, COUPLE, DANCE & VIBE) ────────────────\n" +
        "\n".join(new_blocks) +
        "\n" +
        content[last_bracket_pos:]
    )
    REGISTRY_PATH.write_text(updated_content, encoding='utf-8')
    print(f"Successfully registered {len(new_blocks)} new animations in {REGISTRY_PATH.name}!")


def main():
    results = []
    print(f"Converting and integrating {len(ANIMATIONS)} animations...")
    for idx, item in enumerate(ANIMATIONS, 1):
        src_path = Path(item['src'])
        if not src_path.exists():
            print(f"[{idx}/{len(ANIMATIONS)}] WARNING: {src_path} does not exist, skipping.")
            continue
        out_dir = ROOT / 'public/animations/npz' / item['sub_dir']
        out_dir.mkdir(parents=True, exist_ok=True)
        dst_path = out_dir / item['filename']

        print(f"[{idx}/{len(ANIMATIONS)}] Converting {item['id']} -> {dst_path.name}...")
        res = convert(src_path, dst_path)
        print(f"   Done: {res['frames']} frames, {res['duration']}s, {res['size_kb']}KB")
        results.append({**item, **res})

    if results:
        register_in_ts(results)

    print("\nBatch integration finished successfully!")


if __name__ == '__main__':
    main()
