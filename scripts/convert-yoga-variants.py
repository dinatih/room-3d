"""Re-export MOYO yoga using the calibrated conversion used for the corrected A poses.

blender --background --python scripts/convert-yoga-variants.py
blender --background --python scripts/convert-yoga-variants.py -- --output-dir /tmp/yoga-reference anim_yoga_akarna_dhanurasana_a.glb
"""

import argparse
import json
import math
import re
import struct
import sys
from pathlib import Path

import bpy
import numpy as np
from mathutils import Quaternion, Vector

ROOT = Path(__file__).resolve().parents[1]
YOGA_DIR = ROOT / 'public/animations/npz/yoga'
TEMPLATE = ROOT / 'public/animations/mixamo/anim_salsa_dancing.glb'
BONE_NAMES = [
    'mixamorig:Hips', 'mixamorig:LeftUpLeg', 'mixamorig:RightUpLeg', 'mixamorig:Spine',
    'mixamorig:LeftLeg', 'mixamorig:RightLeg', 'mixamorig:Spine1', 'mixamorig:LeftFoot',
    'mixamorig:RightFoot', 'mixamorig:Spine2', 'mixamorig:LeftToeBase', 'mixamorig:RightToeBase',
    'mixamorig:Neck', 'mixamorig:LeftShoulder', 'mixamorig:RightShoulder', 'mixamorig:Head',
    'mixamorig:LeftArm', 'mixamorig:RightArm', 'mixamorig:LeftForeArm', 'mixamorig:RightForeArm',
    'mixamorig:LeftHand', 'mixamorig:RightHand',
]
# Calibration from the original corrected MOYO exports (9ce2b842, 3effee80).
MIXAMO_TRANSLATION_SCALE = 1.17
ROOT_CANCEL = Quaternion((1, 0, 0), -math.pi / 2)


def rodrigues_to_quat(rotation):
    angle = float(np.linalg.norm(rotation))
    if angle < 1e-8:
        return Quaternion((1, 0, 0, 0))
    axis = rotation / angle
    sine = math.sin(angle / 2)
    return Quaternion((math.cos(angle / 2), *(float(x * sine) for x in axis)))


def source_filename(path):
    name = re.sub(r'^\d+_yogi_(?:nexus_)?body_hands_\d+_?', '', path.name)
    name = name.removesuffix('_stageii.npz')
    return 'anim_yoga_' + re.sub(r'[^a-zA-Z0-9]+', '_', name).strip('_').lower() + '.glb'


def collect_tasks(source_dir, filenames):
    sources = {}
    for path in sorted(source_dir.rglob('*_stageii.npz')):
        if '03596' in path.name:
            sources.setdefault(source_filename(path), []).append(path)

    def session_priority(path):
        for priority, date in enumerate(['221004', '220926', '220923']):
            if date in str(path):
                return priority
        raise ValueError(f'Unknown capture session: {path}')

    tasks = []
    for filename in filenames:
        candidates = sources[filename]  # Missing sources must fail before any export.
        tasks.append((filename, min(candidates, key=session_priority)))
    return tasks


def convert(npz_path, output):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(TEMPLATE))
    armature, = [o for o in bpy.data.objects if o.type == 'ARMATURE']
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
        fps = float(data['mocap_frame_rate'])
    if not np.isfinite(poses).all() or not np.isfinite(translations).all():
        raise ValueError(f'Non-finite motion: {npz_path}')
    step = max(1, round(fps / 30))
    if fps / step != 30:
        raise ValueError(f'Capture cannot be sampled at 30 FPS: {fps}')
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
        # Keep the exact coordinate conversion and hips offset of the validated A exports.
        world_hips = Vector((float(translation[0]), float(translation[2]), -float(translation[1])))
        hips.location = world_hips * (100 * MIXAMO_TRANSLATION_SCALE) - hips.bone.head
        hips.keyframe_insert(data_path='location', frame=frame)

    scene.frame_start = 1
    scene.frame_end = len(frames)
    bpy.ops.export_scene.gltf(filepath=str(output), export_format='GLB', export_animations=True)
    data = output.read_bytes()
    json_length, = struct.unpack_from('<I', data, 12)
    gltf = json.loads(data[20:20 + json_length])
    inputs = {s['input'] for a in gltf['animations'] for s in a['samplers']}
    duration = round(max(gltf['accessors'][i]['max'][0] for i in inputs), 1)
    return {'frames': len(frames), 'duration': duration, 'size_kb': round(len(data) / 1024)}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source-dir', type=Path, default=Path('/home/dinatih/3D Resources/animations/MOYO_smplh_gendered'))
    parser.add_argument('--output-dir', type=Path, default=YOGA_DIR)
    parser.add_argument('filenames', nargs='*')
    args = parser.parse_args(sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else [])
    filenames = args.filenames or sorted(p.name for p in YOGA_DIR.glob('*.glb') if re.search(r'_[b-z]\.glb$', p.name))
    tasks = collect_tasks(args.source_dir, filenames)
    args.output_dir.mkdir(parents=True, exist_ok=True)
    metadata_path = YOGA_DIR / 'yoga_meta.json'
    metadata = {item['filename']: item for item in json.loads(metadata_path.read_text())}
    registry_path = ROOT / 'src/features/scene/animations/animationRegistry.ts'
    registry = registry_path.read_text()
    for index, (filename, npz_path) in enumerate(tasks, start=1):
        print(f'[{index}/{len(tasks)}] {filename}: {npz_path}', flush=True)
        output = args.output_dir / filename
        info = convert(npz_path, output)
        if args.output_dir.resolve() == YOGA_DIR.resolve():
            pattern = r"(  \{\n    id: '[^']+',\n    path: 'animations/npz/yoga/" + re.escape(filename) + r"',[\s\S]*?\n  \},)"
            match = re.search(pattern, registry)
            if not match:
                raise ValueError(f'Unregistered animation: {filename}')
            block = re.sub(r'\(\d+f / [\d.]+s, \d+KB\)', f"({info['frames']}f / {info['duration']:.1f}s, {info['size_kb']}KB)", match.group())
            block = re.sub(r'duration: [\d.]+', f"duration: {info['duration']}", block)
            registry = registry[:match.start()] + block + registry[match.end():]
            metadata[filename] = {'npz': str(npz_path), 'out_path': str(output), 'filename': filename, **info}
        print(f'Exported {filename}: {info}', flush=True)
    if args.output_dir.resolve() == YOGA_DIR.resolve():
        registry_path.write_text(registry)
        metadata_path.write_text(json.dumps(list(metadata.values()), indent=2) + '\n')
    print(f'Converted {len(tasks)} animations.', flush=True)


if __name__ == '__main__':
    main()
