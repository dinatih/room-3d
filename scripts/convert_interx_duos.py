"""Export only the pairs in an Inter-X selection; dry-run needs no Blender.

python3 scripts/convert_interx_duos.py --selection scripts/interx_selection.json --dry-run
blender --background --python scripts/convert_interx_duos.py -- --selection scripts/interx_selection.json --recordings G001T000A000R000
"""
import argparse
from collections import Counter
import json
import math
import subprocess
import sys
import tempfile
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
from interx_catalog import (
    ROOT, DEFAULT_SOURCE, MANIFEST, CONVERSION, TARGET_FPS, SOURCE_FPS,
    RECORDING, publish_manifest, entry_for, glb_info, read_pair, report,
)

TEMPLATE = ROOT / 'public/animations/mixamo/anim_salsa_dancing.glb'
BONE_NAMES = [
    'mixamorig:Hips', 'mixamorig:LeftUpLeg', 'mixamorig:RightUpLeg', 'mixamorig:Spine',
    'mixamorig:LeftLeg', 'mixamorig:RightLeg', 'mixamorig:Spine1', 'mixamorig:LeftFoot',
    'mixamorig:RightFoot', 'mixamorig:Spine2', 'mixamorig:LeftToeBase', 'mixamorig:RightToeBase',
    'mixamorig:Neck', 'mixamorig:LeftShoulder', 'mixamorig:RightShoulder', 'mixamorig:Head',
    'mixamorig:LeftArm', 'mixamorig:RightArm', 'mixamorig:LeftForeArm', 'mixamorig:RightForeArm',
    'mixamorig:LeftHand', 'mixamorig:RightHand',
]


def convert(motion, output_path):
    import bpy
    from mathutils import Quaternion, Vector

    def rotation(vector):
        angle = float(np.linalg.norm(vector))
        if angle == 0:
            return Quaternion((1, 0, 0, 0))
        return Quaternion(Vector(tuple(float(value) for value in vector / angle)), angle)

    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(TEMPLATE))
    armature, = [obj for obj in bpy.data.objects if obj.type == 'ARMATURE']
    armature.animation_data_clear()
    for action in list(bpy.data.actions):
        bpy.data.actions.remove(action)
    armature.animation_data_create()
    armature.animation_data.action = bpy.data.actions.new(name=output_path.stem)
    scene = bpy.context.scene
    scene.render.fps = TARGET_FPS
    scene.render.fps_base = 1
    for bone in armature.pose.bones:
        bone.rotation_mode = 'QUATERNION'
        bone.rotation_quaternion = Quaternion((1, 0, 0, 0))
        bone.location.zero()
        bone.scale = (1, 1, 1)
    bases = [armature.data.bones[name].matrix_local.to_3x3() for name in BONE_NAMES]
    hips = armature.pose.bones[BONE_NAMES[0]]
    # GLTF Y-up metres -> Blender Z-up world -> the actual pelvis rest space.
    # This uses the rig transforms rather than assuming a centimetre bone scale.
    gltf_to_blender = Quaternion((1, 0, 0), math.pi / 2)
    world_to_hips = (armature.matrix_world.to_3x3() @ bases[0]).inverted()
    # The runtime neutralizes the source hips rest quaternion. Export an exact
    # world root rotation rather than adding the template pelvis's rest tilt.
    hips_rest_world = gltf_to_blender.inverted() @ armature.matrix_world.to_quaternion() @ bases[0].to_quaternion()
    initial_translation = motion['trans'][0].astype(np.float64)
    frames = range(0, len(motion['trans']), SOURCE_FPS // TARGET_FPS)
    body = motion['pose_body'].reshape(-1, 21, 3)
    for frame, source_frame in enumerate(frames):
        rotations = [rotation(motion['root_orient'][source_frame])] + [rotation(value) for value in body[source_frame]]
        rotations[0] = rotations[0] @ hips_rest_world.inverted()
        for name, basis, quaternion in zip(BONE_NAMES, bases, rotations):
            bone = armature.pose.bones[name]
            bone.rotation_quaternion = (basis.inverted() @ quaternion.to_matrix() @ basis).to_quaternion()
            bone.keyframe_insert(data_path='rotation_quaternion', frame=frame)
        # Both clips retain the original shared axes and orientations, with only
        # their own frame-zero translation removed. start_offset restores P2.
        displacement = motion['trans'][source_frame].astype(np.float64) - initial_translation
        world_displacement = gltf_to_blender @ Vector(tuple(displacement))
        hips.location = world_to_hips @ world_displacement
        hips.keyframe_insert(data_path='location', frame=frame)
    scene.frame_start = 0
    scene.frame_end = len(frames) - 1
    scene.frame_set(0)
    bpy.ops.export_scene.gltf(
        filepath=str(output_path), export_format='GLB', export_animations=True,
        export_frame_range=True, export_force_sampling=True, export_animation_mode='ACTIVE_ACTIONS',
    )
    return glb_info(output_path)


def load_selection(path, source):
    selection = json.loads(path.read_text())
    if selection['schemaVersion'] != 1 or selection['dataset'] != 'inter-x' or selection['conversion'] != CONVERSION:
        raise ValueError('Selection schema or conversion settings do not match this converter')
    policy = selection['policy']
    if policy['take'] != 'first-available' or policy['representative'] != 'lowest-group-per-action-session' or not 1 <= policy['maxPerAction'] <= 8:
        raise ValueError('Invalid selection policy')
    counts = Counter(entry['actionCode'] for entry in selection['duos'])
    variations = {(entry['actionCode'], entry['variation']) for entry in selection['duos']}
    if len(variations) != len(selection['duos']) or any(count > policy['maxPerAction'] for count in counts.values()):
        raise ValueError('Selection duplicates an action/session or exceeds the per-action quota')
    seen = set()
    for entry in selection['duos']:
        recording = entry['source']['recording']
        if not RECORDING.fullmatch(recording) or recording in seen:
            raise ValueError(f'Invalid or duplicate recording: {recording}')
        seen.add(recording)
        current = entry_for(source, recording, selection['sizeEstimate'])
        if current != entry:
            raise ValueError(f'Stale or modified selection for {recording}; regenerate the selection')
    return selection


def verified(entry):
    for person in ('p1', 'p2'):
        clip = entry['clips'][person]
        path = ROOT / 'public' / clip['path']
        if not path.exists() or glb_info(path) != {key: clip[key] for key in ('frameCount', 'durationSeconds', 'sizeBytes', 'sha256')}:
            return False
    return True


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--selection', type=Path, required=True)
    parser.add_argument('--source', type=Path, default=DEFAULT_SOURCE)
    parser.add_argument('--recordings', nargs='+', help='An explicit subset of the selection (e.g. the pilot pair)')
    parser.add_argument('--dry-run', action='store_true')
    parser.add_argument('--rebuild', action='store_true', help='Re-export explicitly requested pairs instead of resuming verified outputs')
    parser.add_argument('--prune', action='store_true', help='Delete tracked Inter-X GLBs excluded by the selection after verifying the published manifest')
    arguments = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:]
    args = parser.parse_args(arguments)
    selection = load_selection(args.selection, args.source)
    entries = selection['duos']
    if args.recordings:
        unknown = set(args.recordings) - {entry['source']['recording'] for entry in entries}
        if unknown:
            raise ValueError(f'Recordings outside selection: {sorted(unknown)}')
        entries = [entry for entry in entries if entry['source']['recording'] in args.recordings]
    if args.dry_run:
        report(selection, entries)
        return
    if 'bpy' not in sys.modules:
        raise RuntimeError('Exports require Blender; use blender --background --python scripts/convert_interx_duos.py -- --selection ...')
    MANIFEST.parent.mkdir(parents=True, exist_ok=True)
    manifest = json.loads(MANIFEST.read_text()) if MANIFEST.exists() else {
        'schemaVersion': 1, 'dataset': 'inter-x', 'conversion': CONVERSION,
        'actions': selection['actions'], 'duos': [],
    }
    if manifest['conversion'] != CONVERSION:
        raise ValueError('Published conversion settings have changed; remove obsolete entries explicitly before re-export')
    ready = {entry['id']: entry for entry in manifest['duos']}
    for entry in entries:
        old = ready.get(entry['id'])
        if not args.rebuild and old and all(old[key] == entry[key] for key in ('id', 'actionCode', 'variation', 'source', 'rootMotion', 'start_offset', 'tags')) and verified(old):
            print(f"Already verified: {entry['source']['recording']}", flush=True)
            continue
        pair = read_pair(args.source, entry['source']['recording'])
        exported = {key: value for key, value in entry.items() if key not in ('expectedFrameCount', 'expectedDurationSeconds', 'estimatedBytes')}
        if old and 'placement' in old:
            exported['placement'] = old['placement']
        exported['clips'] = {}
        with tempfile.TemporaryDirectory(prefix='interx-export-', dir=MANIFEST.parent) as temporary:
            paths = []
            for person, motion in zip(('p1', 'p2'), pair):
                path = Path(temporary) / Path(entry['clips'][person]['path']).name
                info = convert(motion, path)
                if info['frameCount'] != entry['expectedFrameCount'] or not math.isclose(info['durationSeconds'], entry['expectedDurationSeconds'], abs_tol=1e-5):
                    raise ValueError(f'Unexpected exported timing: {path}: {info}')
                exported['clips'][person] = {**entry['clips'][person], **info}
                paths.append((path, ROOT / 'public' / entry['clips'][person]['path']))
            for path, destination in paths:
                path.replace(destination)
        ready[entry['id']] = exported
        manifest['duos'] = sorted(ready.values(), key=lambda item: (item['actionCode'], item['variation'], item['id']))
        publish_manifest(manifest)
        print(f"Published: {entry['source']['recording']} start_offset={entry['start_offset']}", flush=True)
    publish_manifest(manifest)
    if args.prune:
        selected_ids = {entry['id'] for entry in selection['duos']}
        if any(entry['id'] not in selected_ids or not verified(entry) for entry in manifest['duos']):
            raise ValueError('Cannot prune: published manifest contains unselected or unverified entries')
        selected_paths = {f"public/{clip['path']}" for entry in selection['duos'] for clip in entry['clips'].values()}
        tracked = subprocess.check_output(['git', 'ls-files', '--', 'public/animations/npz/interx/*.glb'], cwd=ROOT, text=True).splitlines()
        for relative in tracked:
            if relative not in selected_paths:
                (ROOT / relative).unlink()
                print(f'Removed unselected GLB: {relative}')


if __name__ == '__main__':
    try:
        main()
    except Exception:
        # Blender otherwise reports Python failures while exiting successfully.
        if 'bpy' in sys.modules:
            import traceback
            traceback.print_exc()
            sys.exit(1)
        raise
