"""Regression: Fab finger conversion preserves local joint flexion.

Run: blender -b -t 2 --python scripts/check-fab-finger-motion.py
Uses the original daily_life archive; writes only temporary files.
"""
import importlib.util
import math
import tempfile
import zipfile
from pathlib import Path

import bpy
from mathutils import Matrix, Quaternion

spec = importlib.util.spec_from_file_location('fab', Path(__file__).with_name('import-fab-animations.py'))
fab = importlib.util.module_from_spec(spec)
spec.loader.exec_module(fab)
rig = fab.template()
nodes, parents, worlds, names = rig
fingers = [name for name in names if fab.re.fullmatch(r'(Left|Right)Hand(Thumb|Index|Middle|Ring|Pinky)[123]', name)]
assert len(fingers) == 30


def angle(q):
    q = q.normalized()
    return 2 * math.atan2(math.sqrt(q.x*q.x + q.y*q.y + q.z*q.z), abs(q.w))


with tempfile.TemporaryDirectory(prefix='fab-finger-regression-') as folder:
    with zipfile.ZipFile(fab.SOURCE / 'daily_life.zip') as archive:
        member = next(name for name in archive.namelist() if name.endswith('/eat_with_fork.fbx'))
        path = Path(folder) / 'eat_with_fork.fbx'
        path.write_bytes(archive.read(member))
    for neutral in [False, True]:
        arm = fab.load(path)
        if neutral:
            arm.animation_data_clear()
            arm.animation_data_create()
            action = bpy.data.actions.new('Neutral hand regression')
            action.use_frame_range = True
            action.frame_start, action.frame_end = 1, 2
            arm.animation_data.action = action
            for bone in arm.pose.bones:
                bone.matrix_basis = Matrix.Identity(4)
        start = arm.animation_data.action.frame_range[0]
        mapping = fab.bone_map(arm)
        clip = fab.motion(path, rig, loaded_arm=arm)
        for sample, time in enumerate(clip['times']):
            frame = start + time * clip['fps']
            bpy.context.scene.frame_set(math.floor(frame), subframe=frame % 1)
            evaluated = arm.evaluated_get(bpy.context.evaluated_depsgraph_get())
            for name in fingers:
                bone = arm.data.bones[mapping[name]]
                pose = evaluated.pose.bones[mapping[name]]
                rest_local = bone.parent.matrix_local.inverted() @ bone.matrix_local
                pose_local = pose.parent.matrix.inverted() @ pose.matrix
                expected = angle(rest_local.to_quaternion().inverted() @ pose_local.to_quaternion())
                index = names[name]
                target_rest = worlds[parents[index]].to_quaternion().inverted() @ worlds[index].to_quaternion()
                x, y, z, w = clip['rotations'][index][sample * 4:sample * 4 + 4]
                actual = angle(target_rest.inverted() @ Quaternion((w, x, y, z)))
                # Blender mathutils operates on float32 quaternions.
                assert abs(expected - actual) < 1e-5, (neutral, name, sample, expected, actual)
                if neutral:
                    assert actual < 1e-5, (name, actual)
        print(f'PASS: {len(fingers)} joints, {len(clip["times"])} samples, neutral={neutral}', flush=True)
