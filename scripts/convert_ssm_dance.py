"""Convert SSM dance_sync_stageii.npz to Mixamo-compatible GLB.

Usage:
  blender --background --python scripts/convert_ssm_dance.py
"""

import math
import struct
import json
from pathlib import Path
import bpy
import numpy as np
from mathutils import Quaternion, Vector

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_SOURCE = Path('/home/dinatih/3D Resources/animations/SSM/20161014_50033/dance_sync_stageii.npz')
DEFAULT_OUTPUT = ROOT / 'public/animations/npz/dances/anim_dance_sync.glb'
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
    # In SSM metadata, mocap_frame_rate is marked as 120 Hz, but natural motion
    # plays at 60 Hz (120 Hz was 2x too fast in app).
    # Resampling at 30 FPS gives 151 frames (5.0s) instead of 76 frames (2.5s).
    step = 2
    frames = range(0, len(poses), step)
    bases = [armature.data.bones[name].matrix_local.to_3x3() for name in BONE_NAMES]
    hips = armature.pose.bones[BONE_NAMES[0]]

    for frame, source_frame in enumerate(frames, start=1):
        pose = poses[source_frame]
        translation = translations[source_frame]
        for index, name in enumerate(BONE_NAMES):
            rotation = rodrigues_to_quat(pose[index * 3:(index + 1) * 3])
            if index == 0:
                rotation = ROOT_CANCEL @ rotation
            basis = bases[index]
            bone = armature.pose.bones[name]
            bone.rotation_quaternion = (basis.inverted() @ rotation.to_matrix() @ basis).to_quaternion()
            bone.keyframe_insert(data_path='rotation_quaternion', frame=frame)

        world_hips = Vector((float(translation[0]), float(translation[2]), -float(translation[1])))
        hips.location = world_hips * (100 * MIXAMO_TRANSLATION_SCALE) - hips.bone.head
        hips.keyframe_insert(data_path='location', frame=frame)

    scene.frame_start = 1
    scene.frame_end = len(frames)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.export_scene.gltf(filepath=str(output_path), export_format='GLB', export_animations=True)

    data = output_path.read_bytes()
    json_length, = struct.unpack_from('<I', data, 12)
    gltf = json.loads(data[20:20 + json_length])
    inputs = {s['input'] for a in gltf['animations'] for s in a['samplers']}
    duration = round(max(gltf['accessors'][i]['max'][0] for i in inputs), 1)
    return {'frames': len(frames), 'duration': duration, 'size_kb': round(len(data) / 1024)}


if __name__ == '__main__':
    result = convert(DEFAULT_SOURCE, DEFAULT_OUTPUT)
    print(f"Exported {DEFAULT_OUTPUT.name}: {result}")
