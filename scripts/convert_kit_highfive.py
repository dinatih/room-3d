"""Convert KIT HighFive01 motions to Mixamo GLB for duo animation.

Usage:
  blender --background --python scripts/convert_kit_highfive.py
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

    # Compute initial heading and translation to center character at origin facing forward
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


if __name__ == '__main__':
    src_a = Path('/home/dinatih/3D Resources/animations/KIT/KIT/441/HighFive01_poses.npz')
    dst_a = ROOT / 'public/animations/others/anim_high_five_a.glb'
    info_a = convert(src_a, dst_a)
    print(f"Exported {dst_a.name}: {info_a}")

    src_b = Path('/home/dinatih/3D Resources/animations/KIT/KIT/442/HighFive01_poses.npz')
    dst_b = ROOT / 'public/animations/others/anim_high_five_b.glb'
    info_b = convert(src_b, dst_b)
    print(f"Exported {dst_b.name}: {info_b}")
