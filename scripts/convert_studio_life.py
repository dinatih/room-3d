"""Convert AMASS (KIT, ACCAD, CMU) studio life animations to Mixamo GLB.

Usage:
  blender --background --python scripts/convert_studio_life.py
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
OUTPUT_DIR = ROOT / 'public/animations/npz/_metadata'

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
    # 🍳 1. Cuisine & Boisson
    {
        'id': 'drinking-glass',
        'label': 'Boire un verre',
        'src': '/home/dinatih/3D Resources/animations/KIT/KIT/551/drink01_poses.npz',
        'filename': 'anim_drinking_glass.glb',
        'category': 'interactions',
        'tags': ['drink', 'glass', 'kitchen', 'dining', 'standing', 'interaction'],
        'aliases': ['drink', 'boire-verre', 'boire'],
    },
    {
        'id': 'holding-cup',
        'label': 'Prendre une tasse',
        'src': '/home/dinatih/3D Resources/animations/KIT/KIT/551/cup02_poses.npz',
        'filename': 'anim_holding_cup.glb',
        'category': 'interactions',
        'tags': ['cup', 'coffee', 'kitchen', 'dining', 'standing', 'interaction'],
        'aliases': ['cup', 'prendre-tasse', 'cafe'],
    },
    {
        'id': 'cooking-stir-pan',
        'label': 'Cuisiner à la poêle',
        'src': '/home/dinatih/3D Resources/animations/KIT/KIT/551/mixing_cooking_spoon01_poses.npz',
        'filename': 'anim_cooking_stir_pan.glb',
        'category': 'interactions',
        'tags': ['cook', 'pan', 'kitchen', 'spoon', 'food', 'interaction'],
        'aliases': ['cook-pan', 'cuisiner', 'melanger-poele'],
    },
    {
        'id': 'cutting-knife',
        'label': 'Découper au couteau',
        'src': '/home/dinatih/3D Resources/animations/KIT/KIT/551/cutting_cucumber01_poses.npz',
        'filename': 'anim_cutting_knife.glb',
        'category': 'interactions',
        'tags': ['cut', 'knife', 'kitchen', 'food', 'prep', 'interaction'],
        'aliases': ['cut-knife', 'decouper-couteau', 'decouper'],
    },
    {
        'id': 'pouring-bottle',
        'label': 'Verser une bouteille',
        'src': '/home/dinatih/3D Resources/animations/KIT/KIT/1487/pouring_the_bottle02_poses.npz',
        'filename': 'anim_pouring_bottle.glb',
        'category': 'interactions',
        'tags': ['pour', 'bottle', 'kitchen', 'bar', 'drink', 'interaction'],
        'aliases': ['pour-bottle', 'verser-bouteille'],
    },
    {
        'id': 'stirring-bowl',
        'label': 'Mélanger dans un saladier',
        'src': '/home/dinatih/3D Resources/animations/KIT/KIT/1487/stirring_in_the_bowl03_poses.npz',
        'filename': 'anim_stirring_bowl.glb',
        'category': 'interactions',
        'tags': ['stir', 'bowl', 'kitchen', 'prep', 'food', 'interaction'],
        'aliases': ['stir-bowl', 'melanger-saladier'],
    },
    {
        'id': 'washing-dishes-sink',
        'label': "Faire la vaisselle à l'évier",
        'src': '/home/dinatih/3D Resources/animations/KIT/KIT/551/sponge_big_and_mixing_bowl_big01_poses.npz',
        'filename': 'anim_washing_dishes_sink.glb',
        'category': 'interactions',
        'tags': ['dishes', 'sink', 'sponge', 'kitchen', 'cleaning', 'chore', 'interaction'],
        'aliases': ['wash-dishes', 'faire-vaisselle'],
    },

    # 📚 2. Salon & Détente
    {
        'id': 'take-book-shelf',
        'label': 'Prendre un livre sur étagère',
        'src': '/home/dinatih/3D Resources/animations/KIT/KIT/1229/take_book_from_shelf_right_arm_03_poses.npz',
        'filename': 'anim_take_book_shelf.glb',
        'category': 'interactions',
        'tags': ['book', 'shelf', 'kallax', 'living-room', 'reading', 'interaction'],
        'aliases': ['take-book', 'prendre-livre-etagere', 'livre'],
    },
    {
        'id': 'playing-guitar',
        'label': 'Jouer de la guitare',
        'src': '/home/dinatih/3D Resources/animations/KIT/KIT/572/guitar_left01_poses.npz',
        'filename': 'anim_playing_guitar.glb',
        'category': 'interactions',
        'tags': ['guitar', 'music', 'instrument', 'living-room', 'relax', 'interaction'],
        'aliases': ['guitar', 'guitare', 'jouer-guitare'],
    },
    {
        'id': 'conversation-gestures',
        'label': 'Gestuelle de conversation',
        'src': '/home/dinatih/3D Resources/animations/ACCAD/ACCAD/Female1Gestures_c3d/D3 - Conversation Gestures_poses.npz',
        'filename': 'anim_conversation_gestures.glb',
        'category': 'emotes_gestures',
        'tags': ['talk', 'conversation', 'social', 'gestures', 'standing', 'emotes'],
        'aliases': ['talk-gestures', 'conversation', 'discuter'],
    },

    # 🪞 3. Salle de bain & Soin
    {
        'id': 'dry-head-towel',
        'label': "S'essuyer la tête (serviette)",
        'src': '/home/dinatih/3D Resources/animations/KIT/KIT/674/dry_head01_poses.npz',
        'filename': 'anim_dry_head_towel.glb',
        'category': 'interactions',
        'tags': ['towel', 'head', 'dry', 'bathroom', 'hygiene', 'interaction'],
        'aliases': ['dry-head', 'essuyer-tete', 'serviette'],
    },
    {
        'id': 'groom-hair-mirror',
        'label': 'Se recoiffer devant le miroir',
        'src': '/home/dinatih/3D Resources/animations/KIT/KIT/1229/hand_through_hair_right_arm_01_poses.npz',
        'filename': 'anim_groom_hair_mirror.glb',
        'category': 'interactions',
        'tags': ['hair', 'mirror', 'grooming', 'bathroom', 'hygiene', 'interaction'],
        'aliases': ['hair-mirror', 'se-recoiffer', 'cheveux'],
    },
    {
        'id': 'take-off-tshirt',
        'label': 'Retirer son t-shirt',
        'src': '/home/dinatih/3D Resources/animations/KIT/KIT/1229/take_of_t-shirt_right_arm_02_poses.npz',
        'filename': 'anim_take_off_tshirt.glb',
        'category': 'interactions',
        'tags': ['clothes', 'tshirt', 'dressing', 'bathroom', 'undress', 'interaction'],
        'aliases': ['take-off-shirt', 'retirer-tshirt', 'se-deshabiller'],
    },

    # 🛏️ 4. Lit & Transitions
    {
        'id': 'lie-down-bed',
        'label': "S'allonger (lit / sol)",
        'src': '/home/dinatih/3D Resources/animations/ACCAD/ACCAD/Male1General_c3d/General A8 - Crouch to Lie Down_poses.npz',
        'filename': 'anim_lie_down_bed.glb',
        'category': 'interactions',
        'tags': ['bed', 'lie', 'sleep', 'rest', 'transition', 'interaction'],
        'aliases': ['lie-down', 's-allonger', 'coucher'],
    },
    {
        'id': 'get-up-bed',
        'label': 'Se relever (lit / sol)',
        'src': '/home/dinatih/3D Resources/animations/CMU/140/140_01_stageii.npz',
        'filename': 'anim_get_up_bed.glb',
        'category': 'interactions',
        'tags': ['bed', 'get-up', 'wake', 'rise', 'transition', 'interaction'],
        'aliases': ['get-up', 'se-relever', 'reveil'],
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

    HEEL_VEC = Vector((0.0, 5.5148, -6.7670))
    def get_foot_pts(side):
        pb_f = armature.pose.bones[f'mixamorig:{side}Foot']
        pb_t = armature.pose.bones[f'mixamorig:{side}ToeBase']
        return (armature.matrix_world @ (pb_f.head + pb_f.matrix.to_3x3() @ HEEL_VEC),
                armature.matrix_world @ pb_t.head)

    # Level supporting feet (remove persistent mocap dorsiflexion / heel-only support)
    for side in ('Left', 'Right'):
        pb_f = armature.pose.bones[f'mixamorig:{side}Foot']
        min_z = min(min(h.z, t.z) for f in range(1, num_frames + 1, 2) if scene.frame_set(f) is None for h, t in [get_foot_pts(side)])
        for f in range(1, num_frames + 1):
            scene.frame_set(f)
            h, t = get_foot_pts(side)
            tilt = t.z - h.z
            lift = min(h.z, t.z) - min_z
            weight = max(0.0, min(1.0, 1.0 - (lift - 0.02) / 0.02)) if lift > 0.02 else 1.0
            if tilt > 0.002 and weight > 0:
                orig_q = pb_f.rotation_quaternion.copy()
                low, high = 0.0, 25.0
                for _ in range(15):
                    mid = (low + high) / 2
                    pb_f.rotation_quaternion = orig_q @ Quaternion(Vector((1, 0, 0)), -math.radians(mid))
                    bpy.context.view_layer.update()
                    cur_h, cur_t = get_foot_pts(side)
                    if cur_t.z > cur_h.z: low = mid
                    else: high = mid
                pb_f.rotation_quaternion = orig_q @ Quaternion(Vector((1, 0, 0)), -math.radians(mid * weight))
                pb_f.keyframe_insert(data_path='rotation_quaternion', frame=f)

    # Align lowest foot contact to ground level (Z = 0)
    min_floor_z = min(min(h.z, t.z) for f in range(1, num_frames + 1, 2) if scene.frame_set(f) is None for side in ('Left', 'Right') for h, t in [get_foot_pts(side)])
    ground_offset = min_floor_z * 100
    act = armature.animation_data.action
    fcurves = act.fcurves if hasattr(act, 'fcurves') else [
        fc for layer in act.layers for strip in layer.strips for cb in strip.channelbags for fc in cb.fcurves
    ]
    for fc in fcurves:
        if 'Hips' in fc.data_path and fc.data_path.endswith('.location') and fc.array_index == 1:
            for kp in fc.keyframe_points:
                kp.co[1] -= ground_offset

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


def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    results = []
    print(f"Starting conversion of {len(ANIMATIONS)} studio life animations...")
    for idx, item in enumerate(ANIMATIONS, 1):
        src_path = Path(item['src'])
        dataset = Path(item['src']).parts[Path(item['src']).parts.index('animations') + 1].lower()
        dst_path = ROOT / 'public/animations/npz' / dataset / item['filename']
        dst_path.parent.mkdir(parents=True, exist_ok=True)
        print(f"[{idx}/{len(ANIMATIONS)}] Converting {item['id']} from {src_path.name} -> {dst_path.name}...")
        res = convert(src_path, dst_path)
        print(f"   Done: {res['frames']} frames, {res['duration']}s, {res['size_kb']}KB")
        results.append({**item, **res, 'rel_path': f"animations/npz/{dataset}/{item['filename']}"})

    meta_file = OUTPUT_DIR / 'studio_meta.json'
    meta_file.write_text(json.dumps(results, indent=2, ensure_ascii=False))
    print(f"\nAll done! Metadata written to {meta_file}")


if __name__ == '__main__':
    main()
