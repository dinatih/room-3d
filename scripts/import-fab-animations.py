"""Import the requested Fab motion packs. Run with Blender in background mode.

blender --background --python scripts/import-fab-animations.py -- --inspect
"""
import argparse
import hashlib
import io
import json
import re
import sys
import zipfile
import math
import struct
from array import array
import copy
import pickle
import inspect as inspect_module
from pathlib import Path

import bpy
from mathutils import Matrix, Quaternion, Vector

ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path('/home/dinatih/3D Resources/fab.com')
WORK = Path('/tmp/room-fab-animations')
SOURCES = [
    'Actorcore-Blender-1014-533367.zip',
    'Actorcore-Blender-1014-530746.zip',
    'Actorcore-Blender-1014-522994.zip',
    'bboombboom_momoland_quinn_edit.fbx',
    'trendy-dances-2025-source.zip', 'sample_dances_fbx.zip',
    'lookwindow01_fbx.zip',
    'shy_dancing_1_mocapdancer_animation_132bpm_ue_files.zip',
    'free_motionset_1_60fps.zip', 'litmovesemotesmocap_fbx_motions.zip',
    'doing_something_strange_v1.fbx', 'shaking_hip_v1.fbx',
    'joyfull_jump_v1.fbx', 'crockscrew.fbx', 'dougiedance_quinn_edit.fbx',
    'multiple_backflip_v2.fbx', 'dancing_8_v1.fbx',
    'combat.zip', 'injured.zip', 'martial_arts.zip', 'locomotion.zip',
    'emotes.zip', 'daily_life.zip', 'anim-ue4--gettingup-up.zip',
    'going_somewhere_in_vehicle_v1.fbx',
]


def unpack(data, folder):
    paths = []
    with zipfile.ZipFile(io.BytesIO(data)) as archive:
        for info in archive.infolist():
            relative = Path(info.filename)
            if relative.is_absolute() or '..' in relative.parts:
                raise ValueError(f'Unsafe archive entry: {relative}')
            if relative.suffix.lower() == '.zip':
                paths.extend(unpack(archive.read(info), folder / relative.stem))
            elif relative.suffix.lower() == '.fbx':
                target = folder / relative
                target.parent.mkdir(parents=True, exist_ok=True)
                target.write_bytes(archive.read(info))
                paths.append(target)
    return sorted(paths)


def inventory():
    result = []
    for name in SOURCES:
        source = SOURCE / name
        data = source.read_bytes()
        files = unpack(data, WORK / source.stem) if source.suffix == '.zip' else [source]
        result.append({'source': name, 'sha256': hashlib.sha256(data).hexdigest(),
                       'files': [str(p) for p in files]})
    WORK.mkdir(parents=True, exist_ok=True)
    (WORK / 'inventory.json').write_text(json.dumps(result, indent=2))
    return result


def load(path, armature_name=None, all_armatures=False):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.fbx(filepath=str(path))
    arms = [obj for obj in bpy.context.scene.objects if obj.type == 'ARMATURE']
    if all_armatures:
        return sorted(arms, key=lambda arm: arm.name)
    if armature_name:
        return next(arm for arm in arms if arm.name == armature_name)
    if len(arms) != 1:
        raise ValueError(f'Expected one armature in {path}, got {[(a.name, len(a.data.bones)) for a in arms]}')
    return arms[0]


def inspect(entries):
    results = []
    for entry in entries:
        candidates = [Path(p) for p in entry['files'] if not re.search(
            r't.?pose|a.?pose|/rigs/|/uemannypose/', p, re.I)]
        if not candidates:
            raise ValueError(f'No motion FBX in {entry["source"]}')
        arm = load(candidates[0])
        arm.animation_data_clear()
        arm.matrix_world = arm.matrix_world.copy()
        bpy.context.view_layer.update()
        result = {'source': entry['source'], 'representative': str(candidates[0]),
                  'files': len(entry['files']), 'fps': bpy.context.scene.render.fps,
                  'actions': [{'name': a.name, 'range': list(a.frame_range)} for a in bpy.data.actions],
                  'matrix': [list(row) for row in arm.matrix_world],
                  'bones': {b.name: {'head': list(arm.matrix_world @ b.head_local),
                                     'tail': list(arm.matrix_world @ b.tail_local),
                                     'parent': b.parent.name if b.parent else None}
                            for b in arm.data.bones}}
        results.append(result)
        print('FAB_INSPECT', entry['source'], len(entry['files']), len(arm.data.bones), flush=True)
    (WORK / 'inspection.json').write_text(json.dumps(results, indent=2))


def diagnose(entries):
    for entry in entries:
        path = next(Path(p) for p in entry['files'] if not re.search(r't.?pose|a.?pose|/rigs/|/uemannypose/', p, re.I))
        arm = load(path)
        if entry['source'] not in ['sample_dances_fbx.zip', 'anim-ue4--gettingup-up.zip', 'going_somewhere_in_vehicle_v1.fbx', 'combat.zip']:
            continue
        mapping = bone_map(arm)
        sample_frames = []
        action = arm.animation_data.action
        for frame in [action.frame_range[0], sum(action.frame_range) / 2, action.frame_range[1]]:
            bpy.context.scene.frame_set(int(frame))
            arm_eval = arm.evaluated_get(bpy.context.evaluated_depsgraph_get())
            points = {}
            for name in ['Hips', 'Head', 'LeftUpLeg', 'LeftFoot', 'RightFoot']:
                bone = mapping[name]
                matrix = arm_eval.matrix_world @ arm_eval.pose.bones[bone].matrix if bone else arm_eval.matrix_world
                points[name] = {'position': list(matrix.translation), 'quaternion': list(matrix.to_quaternion())}
            sample_frames.append({'frame': frame, 'points': points, 'arm': [list(row) for row in arm_eval.matrix_world]})
        print('FAB_SAMPLE', json.dumps({'source': entry['source'], 'samples': sample_frames}), flush=True)
        print('FAB_RIG', json.dumps({'source': entry['source'],
            'objects': [(o.name, o.type) for o in bpy.context.scene.objects if o.type != 'MESH'],
            'armAction': arm.animation_data.action.name if arm.animation_data and arm.animation_data.action else None,
            'armRest': [list(row) for row in arm.matrix_world],
            'localHeads': {b.name: list(b.head_local) for b in arm.data.bones if b.name in ['Hips', 'pelvis', 'AD:Hips', 'AD:Head', 'Head', 'head', 'LeftLeg', 'LeftUpLeg', 'LeftArm', 'AD:LeftUpLeg', 'AD:LeftArm', 'CC_Base_Hip']},
            'poseNonzero': sum(b.matrix_basis != Matrix.Identity(4) for b in arm.pose.bones)}), flush=True)


def slug(value):
    value = re.sub(r'([a-z])([A-Z])', r'\1-\2', value)
    return re.sub(r'[^a-z0-9]+', '-', value.lower()).strip('-')


def template():
    data = (ROOT / 'public/characters/xbot/Xbot_official.glb').read_bytes()
    gltf = json.loads(data[20:20 + struct.unpack_from('<I', data, 12)[0]])
    originals = gltf['nodes']
    indices = [i for i, n in enumerate(originals) if n.get('name', '').startswith('mixamorig:')]
    remap = {old: new for new, old in enumerate(indices)}
    nodes = []
    for i in indices:
        node = {k: copy.deepcopy(v) for k, v in originals[i].items() if k in ['name', 'translation', 'rotation', 'scale']}
        node['translation'] = [v * 0.01 for v in node.get('translation', [0, 0, 0])]
        children = [remap[c] for c in originals[i].get('children', []) if c in remap]
        if children:
            node['children'] = children
        nodes.append(node)
    parents = {c: i for i, n in enumerate(nodes) for c in n.get('children', [])}
    worlds = {}

    def world(i):
        if i not in worlds:
            n = nodes[i]
            xyzw = n.get('rotation', [0, 0, 0, 1])
            local = Matrix.LocRotScale(Vector(n['translation']), Quaternion((xyzw[3], *xyzw[:3])), Vector(n.get('scale', [1, 1, 1])))
            worlds[i] = world(parents[i]) @ local if i in parents else local
        return worlds[i]

    for i in range(len(nodes)):
        world(i)
    names = {n['name'].split(':')[1]: i for i, n in enumerate(nodes)}
    return nodes, parents, worlds, names


def bone_map(arm):
    original_names = set(arm.data.bones.keys())
    names = {name.split(':')[-1] for name in original_names}
    mapping = {}
    if 'CC_Base_Hip' in names:
        mapping = dict(Hips='CC_Base_Hip', Spine='CC_Base_Waist', Spine1='CC_Base_Spine01',
                       Spine2='CC_Base_Spine02', Neck='CC_Base_NeckTwist02', Head='CC_Base_Head')
        for side, short in [('Left', 'L'), ('Right', 'R')]:
            for target, source in [('Shoulder', 'Clavicle'), ('Arm', 'Upperarm'), ('ForeArm', 'Forearm'),
                                   ('Hand', 'Hand'), ('UpLeg', 'Thigh'), ('Leg', 'Calf'), ('Foot', 'Foot'), ('ToeBase', 'ToeBase')]:
                mapping[side + target] = f'CC_Base_{short}_{source}'
            for finger in ['Thumb', 'Index', 'Middle', 'Ring', 'Pinky']:
                for segment in range(1, 4):
                    source = 'Mid' if finger == 'Middle' else finger
                    mapping[f'{side}Hand{finger}{segment}'] = f'CC_Base_{short}_{source}{segment}'
    elif 'pelvis' in names:
        spine_count = max(int(n.split('_')[1]) for n in names if re.fullmatch(r'spine_\d+', n))
        mapping = dict(Hips='pelvis', Spine='spine_01', Spine1='spine_02',
                       Spine2=f'spine_{spine_count:02}', Neck='neck_02' if 'neck_02' in names else 'neck_01', Head='head')
        for side, short in [('Left', 'l'), ('Right', 'r')]:
            for target, source in [('Shoulder', 'clavicle'), ('Arm', 'upperarm'), ('ForeArm', 'lowerarm'),
                                   ('Hand', 'hand'), ('UpLeg', 'thigh'), ('Leg', 'calf'), ('Foot', 'foot'), ('ToeBase', 'ball')]:
                mapping[side + target] = f'{source}_{short}'
            for finger in ['Thumb', 'Index', 'Middle', 'Ring', 'Pinky']:
                for segment in range(1, 4):
                    mapping[f'{side}Hand{finger}{segment}'] = f'{finger.lower()}_{segment:02}_{short}'
    else:
        prefix = ''
        two_spines = 'Chest' in names and 'Spine' in names and 'Spine1' not in names
        motifect = 'LeftShin' in names
        mapping = dict(Hips=None if motifect else prefix + 'Hips',
                       Spine=prefix + ('Spine1' if motifect else 'Spine'),
                       Spine1=prefix + ('Spine2' if motifect else 'Spine1'),
                       Spine2=prefix + ('Chest' if motifect or two_spines else 'Spine3' if 'Spine3' in names else 'Spine2'),
                       Neck=prefix + ('Neck2' if motifect else 'Neck1' if 'Neck1' in names else 'Neck'), Head=prefix + 'Head')
        for side in ['Left', 'Right']:
            for target in ['Shoulder', 'Arm', 'ForeArm', 'Hand', 'UpLeg', 'Leg', 'Foot', 'ToeBase']:
                source = 'Leg' if motifect and target == 'UpLeg' else 'Shin' if motifect and target == 'Leg' else 'Toes' if 'LeftToes' in names and target == 'ToeBase' else target
                mapping[side + target] = prefix + side + source
            for finger in ['Thumb', 'Index', 'Middle', 'Ring', 'Pinky']:
                for segment in range(1, 4):
                    mapping[f'{side}Hand{finger}{segment}'] = f'{prefix}{side}Hand{finger}{segment}'
    if 'Chest' in names and 'Spine' in names and 'Spine1' not in names:
        del mapping['Spine1']
    spelling = {name.split(':')[-1].lower(): name for name in original_names}
    mapping = {target: spelling.get(source.lower(), source) if source else source for target, source in mapping.items()}
    missing = [n for n in mapping.values() if n is not None and n not in original_names]
    if missing:
        raise ValueError(f'Incomplete source skeleton {arm.name}: {missing}')
    return mapping


PACKS = {
    'trendy-dances-2025-source.zip': ('trendy', 'dances'),
    'sample_dances_fbx.zip': ('sample-dances', 'dances'),
    'lookwindow01_fbx.zip': ('look-window', 'interactions'),
    'shy_dancing_1_mocapdancer_animation_132bpm_ue_files.zip': ('mocap-dancer', 'dances'),
    'free_motionset_1_60fps.zip': ('free-motions', 'emotes_gestures'),
    'litmovesemotesmocap_fbx_motions.zip': ('lit-moves', 'dances'),
    'combat.zip': ('combat', 'combat'), 'injured.zip': ('injured', 'poses_idles'),
    'martial_arts.zip': ('martial-arts', 'combat'), 'locomotion.zip': ('locomotion', 'locomotion'),
    'emotes.zip': ('emotes', 'emotes_gestures'), 'daily_life.zip': ('daily-life', 'interactions'),
    'anim-ue4--gettingup-up.zip': ('ue4', 'locomotion'),
}
NPC_WALKS = {'walk_forward', 'walk_confident', 'walk_cautious', 'walk_tired', 'tiptoe_walk'}


def selected_files(entries):
    selected, excluded = [], []
    for entry in entries:
        for file in entry['files']:
            path = Path(file)
            reason = None
            if re.search(r't.?pose|a.?pose|/rigs/|/uemannypose/', file, re.I):
                reason = 'Calibration rig, not a motion'
            elif entry['source'] == 'sample_dances_fbx.zip' and 'UE FBX 30fps' in file:
                reason = 'Equivalent rig/cadence export; retained original 60fps motion'
            elif entry['source'].startswith('shy_dancing') and path.parent != WORK / Path(entry['source']).stem:
                reason = 'Equivalent Unreal rig export; retained original 60fps motion'
            if reason:
                excluded.append({'source': entry['source'], 'file': str(path.relative_to(WORK)), 'reason': reason})
            else:
                selected.append((entry['source'], path))
    return selected, excluded


def motion(path, rig, armature_name=None, loaded_arm=None):
    """Bake source world transforms onto the reference skeleton, including root motion."""
    nodes, parents, target_worlds, target_names = rig
    arm = loaded_arm if loaded_arm is not None else load(path, armature_name)
    if not arm.animation_data or not arm.animation_data.action:
        raise ValueError(f'No armature animation: {path}')
    action = arm.animation_data.action
    start, end = action.frame_range
    fps = bpy.context.scene.render.fps / bpy.context.scene.render.fps_base
    duration = (end - start) / fps
    if duration <= 0:
        raise ValueError(f'Empty animation: {path}')
    mapping = bone_map(arm)
    # The FBX motion is baked onto the skeleton; geometry and external control
    # objects need not be evaluated at every animation sample.
    retained = {arm}
    parent = arm.parent
    while parent:
        retained.add(parent)
        parent = parent.parent
    for obj in list(bpy.context.scene.objects):
        if obj not in retained:
            bpy.data.objects.remove(obj, do_unlink=True)
    arm_rest = arm.matrix_world.copy()
    # Motifect's animated Hips is imported as the armature OBJECT. Its authored
    # bind frame is FBX Y-up, converted by Blender to Z-up, not its first pose.
    if mapping['Hips'] is None:
        arm_rest = Matrix.Rotation(math.pi / 2, 4, 'X') @ Matrix.Diagonal((0.01, 0.01, 0.01, 1))
    scales = arm_rest.to_scale()
    if max(scales) - min(scales) > 1e-6:
        raise ValueError(f'Nonuniform source scale: {path}')

    def rest_point(name):
        return arm_rest @ arm.data.bones[mapping[name]].head_local if mapping[name] else arm_rest.translation.copy()

    hip = rest_point('Hips')
    local_up = arm.data.bones[mapping['Head']].head_local - (arm.data.bones[mapping['Hips']].head_local if mapping['Hips'] else Vector())
    # Determine the authored UP axis from the bind skeleton, independent of a
    # first frame which can be crawling, sitting, lying down or upside down.
    up_axis = max(range(3), key=lambda i: abs(local_up[i]))
    up = Vector()
    up[up_axis] = 1 if local_up[up_axis] > 0 else -1
    up = arm_rest.to_quaternion() @ up
    # Blender evaluates every imported animation in Z-up world space. Some
    # FBXs have a sideways bind skeleton but a correctly oriented animated
    # skeleton: deriving the animated UP axis from that bind would lay down
    # dances and invert get-ups. Convert Blender WORLD axes directly instead.
    alignment = Quaternion((1, 0, 0), -math.pi / 2)
    source_rest = {name: alignment @ (arm_rest @ arm.data.bones[bone].matrix_local).to_quaternion()
                   if bone else alignment @ arm_rest.to_quaternion() for name, bone in mapping.items()}
    source_points = {name: alignment @ rest_point(name) for name in mapping}
    hip_height = min((hip - rest_point(side + 'ToeBase')).dot(up) for side in ['Left', 'Right'])
    if mapping['Hips'] is None:
        # Restore the missing root joint's bind height from its feet.
        arm_rest.translation = Vector((0, 0, hip_height))
        source_points = {name: alignment @ rest_point(name) for name in mapping}
    source_hip = source_points['Hips'].copy()
    # FBX V1 clips store absolute pelvis height even though their bind pelvis
    # is at zero; bind leg geometry supplies the standing reference height.
    source_hip.y = hip_height
    target_hip = target_worlds[target_names['Hips']].translation
    leg_length = lambda points: sum((points[a] - points[b]).length for a, b in [('LeftUpLeg', 'LeftLeg'), ('LeftLeg', 'LeftFoot')])
    target_points = {name: target_worlds[i].translation for name, i in target_names.items()}
    proportion = leg_length(target_points) / leg_length(source_points)

    # Calibrate anatomical directions using CHILD HEADS, never FBX bone tails:
    # those tails often point along an arbitrary roll axis. This also accounts
    # for A-pose upper arms/forearms without changing any sampled source pose.
    children = {'Hips': 'Spine', 'Spine': 'Spine1' if 'Spine1' in mapping else 'Spine2', 'Spine1': 'Spine2', 'Spine2': 'Neck', 'Neck': 'Head'}
    for side in ['Left', 'Right']:
        children.update({side + a: side + b for a, b in [('Shoulder', 'Arm'), ('Arm', 'ForeArm'), ('ForeArm', 'Hand'), ('Hand', 'HandMiddle1'), ('UpLeg', 'Leg'), ('Leg', 'Foot'), ('Foot', 'ToeBase')]})
        for finger in ['Thumb', 'Index', 'Middle', 'Ring', 'Pinky']:
            for segment in [1, 2]:
                children[f'{side}Hand{finger}{segment}'] = f'{side}Hand{finger}{segment + 1}'
    for name, child in children.items():
        if name not in mapping or child not in mapping:
            continue
        source_direction = (source_points[child] - source_points[name]).normalized()
        target_direction = (target_points[child] - target_points[name]).normalized()
        source_rest[name] = source_direction.rotation_difference(target_direction) @ source_rest[name]
    # Leaf joints have no reliable FBX tail. Use their incoming anatomical
    # segment to align heads, toes and terminal finger phalanges as well.
    incoming = {'Head': 'Neck', 'LeftToeBase': 'LeftFoot', 'RightToeBase': 'RightFoot'}
    for side in ['Left', 'Right']:
        for finger in ['Thumb', 'Index', 'Middle', 'Ring', 'Pinky']:
            incoming[f'{side}Hand{finger}3'] = f'{side}Hand{finger}2'
    for name, previous in incoming.items():
        source_direction = (source_points[name] - source_points[previous]).normalized()
        target_direction = (target_points[name] - target_points[previous]).normalized()
        source_rest[name] = source_direction.rotation_difference(target_direction) @ source_rest[name]

    def depth(i):
        return 1 + depth(parents[i]) if i in parents else 0

    order = sorted(range(len(nodes)), key=depth)
    by_index = {target_names[name]: name for name in mapping}
    rotations = {i: [] for i in by_index}
    positions, times = [], []
    # Keep the exact native sampling cadence and both endpoints.
    frames = [start + i for i in range(math.ceil(end - start))] + [end]
    initial = None
    for frame in frames:
        bpy.context.scene.frame_set(math.floor(frame), subframe=frame % 1)
        evaluated = arm.evaluated_get(bpy.context.evaluated_depsgraph_get())
        sampled = {}
        for name, bone in mapping.items():
            world = evaluated.matrix_world @ evaluated.pose.bones[bone].matrix if bone else evaluated.matrix_world
            sampled[name] = world
        desired = {}
        for i in order:
            parent_quat = desired[parents[i]] if i in parents else Quaternion()
            if i in by_index:
                name = by_index[i]
                world_quat = alignment @ sampled[name].to_quaternion()
                desired[i] = world_quat @ source_rest[name].inverted() @ target_worlds[i].to_quaternion()
                local = (parent_quat.inverted() @ desired[i]).normalized()
                values = rotations[i]
                if values and local.dot(Quaternion((values[-1], *values[-4:-1]))) < 0:
                    local.negate()
                values.extend((local.x, local.y, local.z, local.w))
            else:
                r = nodes[i].get('rotation', [0, 0, 0, 1])
                desired[i] = parent_quat @ Quaternion((r[3], *r[:3]))
        point = alignment @ sampled['Hips'].translation
        delta = (point - source_hip) * proportion
        if initial is None:
            initial = Vector((delta.x, 0, delta.z))
        positions.extend(target_hip + delta - initial)
        times.append((frame - start) / fps)
    return {'times': times, 'rotations': rotations, 'positions': positions, 'fps': fps,
            'duration': duration, 'source_action': action.name, 'source_bones': len(arm.data.bones),
            'mapped_bones': len(mapping)}


def write_glb(path, rig, clip, name):
    nodes, parents, _, names = rig
    gltf = {'asset': {'version': '2.0', 'generator': 'room-3d Fab importer'},
            'scene': 0, 'scenes': [{'nodes': [i for i in range(len(nodes)) if i not in parents]}],
            'nodes': nodes, 'skins': [{'joints': list(range(len(nodes))), 'skeleton': names['Hips']}],
            'buffers': [], 'bufferViews': [], 'accessors': [],
            'animations': [{'name': name, 'samplers': [], 'channels': []}]}
    binary = bytearray()

    def accessor(values, size, kind, bounds=False):
        data = array('f', values).tobytes()
        view = len(gltf['bufferViews'])
        gltf['bufferViews'].append({'buffer': 0, 'byteOffset': len(binary), 'byteLength': len(data)})
        binary.extend(data)
        definition = {'bufferView': view, 'componentType': 5126, 'count': len(values) // size, 'type': kind}
        if bounds:
            definition.update(min=[min(values)], max=[max(values)])
        gltf['accessors'].append(definition)
        return len(gltf['accessors']) - 1

    time_accessor = accessor(clip['times'], 1, 'SCALAR', True)
    animation = gltf['animations'][0]
    for node, values, property_name, size, kind in [(names['Hips'], clip['positions'], 'translation', 3, 'VEC3')] + [(i, values, 'rotation', 4, 'VEC4') for i, values in clip['rotations'].items()]:
        output = accessor(values, size, kind)
        sampler = len(animation['samplers'])
        animation['samplers'].append({'input': time_accessor, 'output': output, 'interpolation': 'LINEAR'})
        animation['channels'].append({'sampler': sampler, 'target': {'node': node, 'path': property_name}})
    if not all(math.isfinite(v) for v in clip['positions'] + [v for values in clip['rotations'].values() for v in values]):
        raise ValueError(f'Nonfinite animation data: {name}')
    gltf['buffers'] = [{'byteLength': len(binary)}]
    json_data = json.dumps(gltf, separators=(',', ':')).encode()
    json_data += b' ' * (-len(json_data) % 4)
    binary += b'\0' * (-len(binary) % 4)
    data = struct.pack('<III', 0x46546C67, 2, 28 + len(json_data) + len(binary))
    data += struct.pack('<II', len(json_data), 0x4E4F534A) + json_data
    data += struct.pack('<II', len(binary), 0x004E4942) + binary
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(data)
    return hashlib.sha256(binary).hexdigest(), len(data)


def metadata(source, path, clip):
    prefix, category = PACKS.get(source, ('actorcore', 'combat') if source.startswith('Actorcore') else ('solo', 'emotes_gestures'))
    stem = path.stem
    if source == 'going_somewhere_in_vehicle_v1.fbx':
        category = 'interactions'
    if source in ['bboombboom_momoland_quinn_edit.fbx', 'shaking_hip_v1.fbx', 'dougiedance_quinn_edit.fbx', 'dancing_8_v1.fbx']:
        category = 'dances'
    if source in ['joyfull_jump_v1.fbx', 'crockscrew.fbx', 'multiple_backflip_v2.fbx']:
        category = 'sports_fitness'
    key = slug(stem)
    tags = ['fab', f'fab-{prefix}'] + key.split('-')
    # Semantic activity tags are explicit opt-ins, not aliases for categories.
    # Injury, recovery, weapons requiring absent props, and furniture motions
    # remain manually selectable rather than entering autonomous generic pools.
    if category == 'dances':
        tags += ['dance']
    if source == 'emotes.zip' and stem in ['dance_arm_wave', 'dance_simple_groove']:
        category = 'dances'
        tags += ['dance']
    if source == 'emotes.zip' and stem in ['bow_deep_respect', 'clap_enthusiastic', 'explain_wide_gesture', 'facepalm', 'fist_pump_victory', 'hold_up_wait', 'laugh_body', 'no_way_hands_out', 'salute_military', 'shrug_i_dont_know', 'talk_animate_hands', 'think_chin_stroke', 'thumbs_down', 'thumbs_up']:
        tags += ['interactions']
    if source == 'free_motionset_1_60fps.zip' and 'HipRockExercise' in stem:
        category = 'sports_fitness'
        tags += ['interactions']
    if source in ['combat.zip', 'martial_arts.zip'] and not re.search(r'get_up|knock|hit_react|stagger|sword|staff|spear|wrestling|judo|grab|choke', stem):
        tags += ['combat']
    if source == 'daily_life.zip' and stem in ['bow_greeting', 'nod_yes', 'shake_head_no', 'wave_hello', 'yawn_and_stretch', 'stretch_morning']:
        tags += ['interactions']
    if source == 'locomotion.zip' and stem in ['idle_alert', 'idle_looking_around', 'idle_neutral', 'idle_relaxed_weight_shift']:
        category = 'poses_idles'
        tags += ['poses-idles']
    definition = {'id': f'fab-{prefix}-{key}', 'path': f'animations/fab/{prefix}/{key}.glb',
                  'label': f'{stem.replace("_", " ")} · {prefix} ({clip["duration"]:.1f}s)',
                  'category': category, 'tags': list(dict.fromkeys(tags)),
                  'duration': round(clip['duration'], 6), 'rootMotionSpace': 'rest-meters'}
    if source.startswith('Actorcore'):
        definition['equipment'] = 'dual-pistols'
        definition['tags'].append('combat')
    if source == 'anim-ue4--gettingup-up.zip' or re.search(r'(^get_up|^stand_up|^crouch_rise|^revive|^land_)', stem):
        definition['loop'] = 'once'
    return definition


def convert(entries, only=None):
    rig = template()
    selected, excluded = selected_files(entries)
    results, definitions, seen = [], [], {}
    cache_version = hashlib.sha256((inspect_module.getsource(motion) + inspect_module.getsource(bone_map) + inspect_module.getsource(template)).encode()).hexdigest()[:12]

    def inputs():
        for index, (source, path) in enumerate(selected, 1):
            if only and not re.search(only, source + '/' + path.name):
                continue
            print(f'FAB_IMPORT {index}/{len(selected)} {source}: {path.name}', flush=True)
            arms = load(path, all_armatures=True)
            humans = []
            for arm in arms:
                names = {name.split(':')[-1].lower() for name in arm.data.bones.keys()}
                if names.intersection({'head', 'cc_base_head'}) and names.intersection({'leftupleg', 'leftleg', 'thigh_l', 'cc_base_l_thigh'}):
                    humans.append(arm)
                else:
                    excluded.append({'source': source, 'file': path.name, 'armature': arm.name, 'reason': 'Nonhuman prop rig'})
            if not humans:
                raise ValueError(f'No human motion armature: {path}')
            role_names = [arm.name for arm in humans]
            for index, name in enumerate(role_names):
                yield source, path, name if len(role_names) > 1 else None, humans[0] if index == 0 else None

    for source, path, role, loaded_arm in inputs():
        source_hash = hashlib.sha256(path.read_bytes()).hexdigest()
        role_hash = hashlib.sha256((source_hash + (role or '')).encode()).hexdigest()
        cache_file = WORK / f'{cache_version}-{role_hash}.pickle'
        if cache_file.exists():
            clip = pickle.loads(cache_file.read_bytes())
        else:
            clip = motion(path, rig, role, loaded_arm)
            cache_file.write_bytes(pickle.dumps(clip))
        definition = metadata(source, path, clip)
        if role:
            definition['id'] += '-' + slug(role)
            definition['path'] = definition['path'].replace('.glb', '-' + slug(role) + '.glb')
            definition['label'] += ' · ' + role
            definition['tags'].append('multi-actor')
        output = ROOT / 'public' / definition['path']
        fingerprint, size = write_glb(WORK / 'candidate.glb', rig, clip, definition['id'])
        record = {'source': source, 'file': str(path.relative_to(WORK)) if path.is_relative_to(WORK) else path.name,
                  'frames': len(clip['times']), 'fps': clip['fps'], 'sourceAction': clip['source_action'],
                  'sourceBones': clip['source_bones'], 'mappedBones': clip['mapped_bones'],
                  'motionHash': fingerprint, 'fbxHash': source_hash}
        if role:
            record['role'] = role
        if fingerprint in seen:
            excluded.append({**record, 'reason': 'Identical baked motion', 'retainedId': seen[fingerprint]})
            continue
        seen[fingerprint] = definition['id']
        if any(d['id'] == definition['id'] for d in definitions):
            raise ValueError(f'Duplicate ID with different motion: {definition["id"]}')
        output.parent.mkdir(parents=True, exist_ok=True)
        output.write_bytes((WORK / 'candidate.glb').read_bytes())
        results.append({**record, 'id': definition['id'], 'path': definition['path'], 'bytes': size})
        definitions.append(definition)
        if source == 'locomotion.zip' and path.stem in NPC_WALKS:
            dx = clip['positions'][-3] - clip['positions'][0]
            dz = clip['positions'][-1] - clip['positions'][2]
            distance = math.hypot(dx, dz)
            if distance == 0:
                raise ValueError(f'Cannot measure natural gait speed: {path}')
            in_place = copy.deepcopy(clip)
            for frame, time in enumerate(clip['times']):
                progress = time / clip['duration']
                in_place['positions'][frame * 3] -= dx * progress
                in_place['positions'][frame * 3 + 2] -= dz * progress
            variant = {**definition, 'id': definition['id'] + '-in-place',
                       'path': definition['path'].replace('.glb', '-in-place.glb'),
                       'label': definition['label'] + ' · sur place',
                       'tags': definition['tags'] + ['in-place', 'npc-walk', 'locomotion'],
                       'walkSpeed': round(distance * 100 / clip['duration'], 6),
                       'defaultRotYOffset': -math.atan2(dx, dz)}
            variant_hash, variant_size = write_glb(ROOT / 'public' / variant['path'], rig, in_place, variant['id'])
            definitions.append(variant)
            results.append({**record, 'id': variant['id'], 'path': variant['path'], 'bytes': variant_size,
                            'motionHash': variant_hash, 'derivedFrom': definition['id'], 'walkSpeed': variant['walkSpeed']})
    report = {'sources': [{k: v for k, v in e.items() if k != 'files'} for e in entries],
              'imported': results, 'excluded': excluded}
    suffix = '-sample' if only else ''
    (ROOT / f'scripts/fab-import-report{suffix}.json').write_text(json.dumps(report, indent=2, ensure_ascii=False) + '\n')
    if not only:
        manifest = "import type { AnimationDefinition } from './animationRegistry';\n\n/** Generated by scripts/import-fab-animations.py. */\nexport const FAB_ANIMATION_DEFINITIONS: AnimationDefinition[] = "
        (ROOT / 'src/features/scene/animations/fabManifest.ts').write_text(manifest + json.dumps(definitions, indent=2, ensure_ascii=False) + ';\n')
    print(f'FAB_DONE {len(results)} motions, {len(excluded)} exclusions', flush=True)


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--inspect', action='store_true')
    parser.add_argument('--diagnose', action='store_true')
    parser.add_argument('--only', help='Regex selecting sources for a conversion smoke test')
    parser.add_argument('--probe', help='Print all armatures and actions in one FBX')
    args = parser.parse_args(sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else [])
    entries = inventory()
    if args.probe:
        bpy.ops.wm.read_factory_settings(use_empty=True)
        bpy.ops.import_scene.fbx(filepath=args.probe)
        for arm in bpy.context.scene.objects:
            if arm.type == 'ARMATURE':
                print('FAB_PROBE', arm.name, list(arm.data.bones.keys()),
                      arm.animation_data.action.name if arm.animation_data and arm.animation_data.action else None, flush=True)
    elif args.inspect:
        inspect(entries)
    elif args.diagnose:
        diagnose(entries)
    else:
        convert(entries, args.only)
