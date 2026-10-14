"""Convert the first ten Inter-X paired recordings to Mixamo GLB clips.

Run with:
  blender --background --python scripts/convert_interx_duos.py
"""

import json
import math
import struct
from pathlib import Path

import bpy
import numpy as np
from mathutils import Quaternion, Vector

ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path('/home/dinatih/3D Resources/animations/Inter-X_Dataset-motions/motions')
TEMPLATE = ROOT / 'public/animations/mixamo/anim_salsa_dancing.glb'
OUTPUT = ROOT / 'public/animations/npz/interx'
SOURCE_FPS = 120
TARGET_FPS = 30
TRANSLATION_SCALE = 1.17
BONE_NAMES = [
    'mixamorig:Hips', 'mixamorig:LeftUpLeg', 'mixamorig:RightUpLeg', 'mixamorig:Spine',
    'mixamorig:LeftLeg', 'mixamorig:RightLeg', 'mixamorig:Spine1', 'mixamorig:LeftFoot',
    'mixamorig:RightFoot', 'mixamorig:Spine2', 'mixamorig:LeftToeBase', 'mixamorig:RightToeBase',
    'mixamorig:Neck', 'mixamorig:LeftShoulder', 'mixamorig:RightShoulder', 'mixamorig:Head',
    'mixamorig:LeftArm', 'mixamorig:RightArm', 'mixamorig:LeftForeArm', 'mixamorig:RightForeArm',
    'mixamorig:LeftHand', 'mixamorig:RightHand',
]
# The 21 SMPL-X body joints correspond to the mapped bones after Hips.
BODY_TO_MIXAMO = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21]


def rodrigues_to_quat(rotation):
    angle = float(np.linalg.norm(rotation))
    if angle < 1e-8:
        return Quaternion((1, 0, 0, 0))
    axis = rotation / angle
    sine = math.sin(angle / 2)
    return Quaternion((math.cos(angle / 2), *(float(value * sine) for value in axis)))


def convert(source_path, output_path):
    with np.load(source_path) as data:
        body = data['pose_body']
        root = data['root_orient']
        translations = data['trans']

    body = body.reshape(len(body), 21, 3)
    root = root.reshape(len(root), 3)
    if not np.isfinite(body).all() or not np.isfinite(root).all() or not np.isfinite(translations).all():
        raise ValueError(f'Non-finite motion: {source_path}')

    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(TEMPLATE))
    armature, = [obj for obj in bpy.data.objects if obj.type == 'ARMATURE']
    armature.animation_data_clear()
    armature.animation_data_create()
    armature.animation_data.action = bpy.data.actions.new(name='ArmatureAction')
    scene = bpy.context.scene
    scene.render.fps = TARGET_FPS
    for bone in armature.pose.bones:
        bone.rotation_mode = 'QUATERNION'
    bases = [armature.data.bones[name].matrix_local.to_3x3() for name in BONE_NAMES]
    hips = armature.pose.bones[BONE_NAMES[0]]
    # Inter-X is Y-up already. Normalize only heading, preserving its upright axis.
    first_root = rodrigues_to_quat(root[0])
    forward = first_root @ Vector((0, 0, 1))
    yaw_cancel = Quaternion((0, 1, 0), -math.atan2(forward.x, forward.z))
    initial_translation = translations[0]

    sample_step = SOURCE_FPS // TARGET_FPS
    source_frames = range(0, len(body), sample_step)
    if SOURCE_FPS % TARGET_FPS:
        raise ValueError(f'Cannot sample {SOURCE_FPS} FPS at {TARGET_FPS} FPS')
    for frame, source_frame in enumerate(source_frames, start=1):
        root_rotation = root[source_frame]
        body_pose = body[source_frame]
        translation = translations[source_frame]
        rotations = [rodrigues_to_quat(root_rotation)] + [rodrigues_to_quat(value) for value in body_pose]
        for index, (bone_index, rotation) in enumerate(zip(BODY_TO_MIXAMO, rotations[1:]), start=1):
            target = BONE_NAMES[bone_index]
            basis = armature.data.bones[target].matrix_local.to_3x3()
            bone = armature.pose.bones[target]
            bone.rotation_quaternion = (basis.inverted() @ rotation.to_matrix() @ basis).to_quaternion()
            bone.keyframe_insert(data_path='rotation_quaternion', frame=frame)

        root_rotation = yaw_cancel @ rotations[0]
        hips.rotation_quaternion = (bases[0].inverted() @ root_rotation.to_matrix() @ bases[0]).to_quaternion()
        hips.keyframe_insert(data_path='rotation_quaternion', frame=frame)
        offset = translation - initial_translation
        world_translation = Vector(tuple(float(value) for value in offset))
        world_translation = yaw_cancel.to_matrix() @ world_translation
        # Keep the template's standing pelvis height; only animate source displacement.
        hips.location = world_translation * (100 * TRANSLATION_SCALE)
        hips.keyframe_insert(data_path='location', frame=frame)

    scene.frame_start = 1
    scene.frame_end = frame
    output_path.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.export_scene.gltf(filepath=str(output_path), export_format='GLB', export_animations=True)
    binary = output_path.read_bytes()
    json_length, = struct.unpack_from('<I', binary, 12)
    gltf = json.loads(binary[20:20 + json_length])
    inputs = {sampler['input'] for animation in gltf['animations'] for sampler in animation['samplers']}
    duration = round(max(gltf['accessors'][index]['max'][0] for index in inputs), 2)
    return duration


def main():
    # The first ten recordings are the initial import batch; later recordings are intentionally deferred.
    recordings = sorted(path for path in SOURCE.iterdir() if path.is_dir())[:10]
    if len(recordings) != 10:
        raise RuntimeError(f'Expected at least ten paired recordings, found {len(recordings)}')
    for recording in recordings:
        for participant in ('P1', 'P2'):
            source_path = recording / f'{participant}.npz'
            output_path = OUTPUT / f'{recording.name.lower()}-{participant.lower()}.glb'
            duration = convert(source_path, output_path)
            print(f'{recording.name} {participant}: {output_path.name} ({duration}s)', flush=True)


if __name__ == '__main__':
    main()
