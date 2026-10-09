"""Convert AMASS (CMU, KIT, ACCAD) daily / chores animations to Mixamo GLB.

Usage:
  blender --background --python scripts/convert_daily_chores.py
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
OUTPUT_DIR = ROOT / 'public/animations/npz/daily'

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
    # 1. Aspirateur
    {
        'id': 'vacuuming',
        'label': "Passer l'aspirateur",
        'src': '/home/dinatih/3D Resources/animations/CMU/79/79_77_stageii.npz',
        'filename': 'anim_vacuuming.glb',
        'tags': ['vacuum', 'cleaning', 'chore', 'standing', 'interaction'],
        'aliases': ['vacuum', 'passer-aspirateur'],
    },
    {
        'id': 'vacuuming-alt',
        'label': "Passer l'aspirateur (Variante)",
        'src': '/home/dinatih/3D Resources/animations/CMU/80/80_18_stageii.npz',
        'filename': 'anim_vacuuming_alt.glb',
        'tags': ['vacuum', 'cleaning', 'chore', 'standing', 'interaction'],
        'aliases': ['vacuum-alt', 'vacuum-var'],
    },
    # 2. Essuyer la table
    {
        'id': 'wiping-table',
        'label': "Essuyer la table",
        'src': '/home/dinatih/3D Resources/animations/KIT/KIT/1487/wiping_the_table01_poses.npz',
        'filename': 'anim_wiping_table.glb',
        'tags': ['wipe', 'table', 'sponge', 'cleaning', 'chore', 'interaction'],
        'aliases': ['wipe-table', 'essuyer-table'],
    },
    {
        'id': 'wiping-table-small-circles',
        'label': "Essuyer la table (Petits cercles)",
        'src': '/home/dinatih/3D Resources/animations/KIT/KIT/883/wipe_arm_smallcircle02_poses.npz',
        'filename': 'anim_wiping_table_small_circles.glb',
        'tags': ['wipe', 'table', 'circle', 'cleaning', 'chore', 'interaction'],
        'aliases': ['wipe-small-circles', 'wipe-table-var'],
    },
    # 3. Douche & toilette
    {
        'id': 'taking-shower',
        'label': "Prendre sa douche",
        'src': '/home/dinatih/3D Resources/animations/KIT/KIT/674/shower_front01_poses.npz',
        'filename': 'anim_taking_shower.glb',
        'tags': ['shower', 'hygiene', 'wash', 'bathroom', 'interaction'],
        'aliases': ['shower', 'douche'],
    },
    {
        'id': 'washing-body',
        'label': "Se laver",
        'src': '/home/dinatih/3D Resources/animations/KIT/KIT/674/wash_front02_poses.npz',
        'filename': 'anim_washing_body.glb',
        'tags': ['wash', 'hygiene', 'shower', 'bathroom', 'interaction'],
        'aliases': ['wash', 'se-laver'],
    },
    # 4. Boite (ramasser / soulever / poser)
    {
        'id': 'pickup-box-floor-male',
        'label': "Ramasser une boîte au sol (H)",
        'src': '/home/dinatih/3D Resources/animations/ACCAD/ACCAD/Male1General_c3d/General A5 - Pick Up Box_poses.npz',
        'filename': 'anim_pickup_box_floor_male.glb',
        'tags': ['box', 'pickup', 'floor', 'lift', 'male', 'interaction'],
        'aliases': ['pickup-box-m', 'ramasser-boite-sol'],
    },
    {
        'id': 'pickup-box-floor-female',
        'label': "Ramasser une boîte au sol (F)",
        'src': '/home/dinatih/3D Resources/animations/ACCAD/ACCAD/Female1General_c3d/A5 - pick up box_poses.npz',
        'filename': 'anim_pickup_box_floor_female.glb',
        'tags': ['box', 'pickup', 'floor', 'lift', 'female', 'interaction'],
        'aliases': ['pickup-box-f', 'ramasser-boite-sol-femme'],
    },
    {
        'id': 'lift-box-male',
        'label': "Soulever une boîte (H)",
        'src': '/home/dinatih/3D Resources/animations/ACCAD/ACCAD/Male1General_c3d/General A6 - Lift Box_poses.npz',
        'filename': 'anim_lift_box_male.glb',
        'tags': ['box', 'lift', 'carry', 'male', 'interaction'],
        'aliases': ['lift-box-m', 'soulever-boite'],
    },
    {
        'id': 'lift-box-female',
        'label': "Soulever une boîte (F)",
        'src': '/home/dinatih/3D Resources/animations/ACCAD/ACCAD/Female1General_c3d/A6 - lift box_poses.npz',
        'filename': 'anim_lift_box_female.glb',
        'tags': ['box', 'lift', 'carry', 'female', 'interaction'],
        'aliases': ['lift-box-f', 'soulever-boite-femme'],
    },
    {
        'id': 'putdown-box-floor',
        'label': "Reposer la boîte au sol",
        'src': '/home/dinatih/3D Resources/animations/ACCAD/ACCAD/Male1Walking_c3d/Walk B21 - Put Down Box to walk_poses.npz',
        'filename': 'anim_putdown_box_floor.glb',
        'tags': ['box', 'putdown', 'floor', 'walk', 'interaction'],
        'aliases': ['putdown-box', 'reposer-boite'],
    },
    # 5. Autres menages
    {
        'id': 'sweeping-floor',
        'label': "Balayer le sol",
        'src': '/home/dinatih/3D Resources/animations/CMU/13/13_23_stageii.npz',
        'filename': 'anim_sweeping_floor.glb',
        'tags': ['sweep', 'broom', 'cleaning', 'chore', 'interaction'],
        'aliases': ['sweep-floor', 'balayer'],
    },
    {
        'id': 'cleaning-windows',
        'label': "Laver les vitres",
        'src': '/home/dinatih/3D Resources/animations/CMU/13/13_20_stageii.npz',
        'filename': 'anim_cleaning_windows.glb',
        'tags': ['window', 'glass', 'cleaning', 'chore', 'interaction'],
        'aliases': ['clean-windows', 'laver-vitres'],
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
        fps = float(data['mocap_framerate'] if 'mocap_framerate' in data else data['mocap_frame_rate'])

    target_fps = 30.0
    duration_sec = len(poses) / fps
    num_frames = int(round(duration_sec * target_fps))

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


def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    results = []
    print(f"Starting conversion of {len(ANIMATIONS)} animations...")
    for idx, item in enumerate(ANIMATIONS, 1):
        src_path = Path(item['src'])
        dst_path = OUTPUT_DIR / item['filename']
        print(f"[{idx}/{len(ANIMATIONS)}] Converting {item['id']} from {src_path.name} -> {dst_path.name}...")
        res = convert(src_path, dst_path)
        print(f"   Done: {res['frames']} frames, {res['duration']}s, {res['size_kb']}KB")
        results.append({**item, **res, 'rel_path': f"animations/npz/daily/{item['filename']}"})

    meta_file = OUTPUT_DIR / 'daily_meta.json'
    meta_file.write_text(json.dumps(results, indent=2, ensure_ascii=False))
    print(f"\nAll done! Metadata written to {meta_file}")


if __name__ == '__main__':
    main()
