"""Build a separate Lara/Mixamo shoulder prototype; source is never overwritten.

ALSOFT_DRIVERS=null blender -b --python-exit-code 1 --python scripts/temp_lara_mixamo.py
Lara bone names, Mixamo-compatible hierarchy and Lara bind axes.
"""
from pathlib import Path
import hashlib
import json
import math
import struct
import sys
import bpy
from mathutils import Vector, Quaternion, Matrix

ROOT = Path(__file__).resolve().parents[1]
FOLDER = ROOT / 'public/characters/lara'
BONES = {'Hips': 'pelvis', 'Spine': 'spine_lower', 'Spine1': 'spine_middle',
         'Spine2': 'spine_upper', 'Neck': 'head_neck_lower', 'Head': 'head_neck_upper'}
for side, role in [('left', 'Left'), ('right', 'Right')]:
    for name, part in [('Shoulder', 'shoulder'), ('Arm', 'shoulder_2'),
                       ('ForeArm', 'elbow'), ('Hand', 'wrist')]:
        BONES[role + name] = f'arm_{side}_{part}'
    for name, part in [('UpLeg', 'thigh'), ('Leg', 'knee'), ('Foot', 'ankle'), ('ToeBase', 'toes')]:
        BONES[role + name] = f'leg_{side}_{part}'
    for digit, finger in enumerate(('Thumb', 'Index', 'Middle', 'Ring', 'Pinky'), start=1):
        for segment, letter in enumerate('abc', start=1):
            BONES[f'{role}Hand{finger}{segment}'] = f'arm_{side}_finger_{digit}{letter}'


def smoothstep(t):
    t = min(1., max(0., t))
    return t * t * (3. - 2. * t)


def evaluated_vertices(obj):
    evaluated = obj.evaluated_get(bpy.context.evaluated_depsgraph_get())
    mesh = evaluated.to_mesh()
    coords = [obj.matrix_world @ v.co for v in mesh.vertices]
    evaluated.to_mesh_clear()
    return coords


def glb_document():
    data = (FOLDER / 'lara_mixamo_prototype.glb').read_bytes()
    length = struct.unpack_from('<I', data, 12)[0]
    return json.loads(data[20:20+length])


def reset(arm):
    for bone in arm.pose.bones:
        bone.matrix_basis.identity()
    bpy.context.view_layer.update()


def rotate_world(arm, name, axis, degrees):
    bone = arm.pose.bones[BONES[name]]
    local_axis = bone.bone.matrix_local.to_quaternion().inverted() @ Vector(axis)
    bone.rotation_mode = 'QUATERNION'
    bone.rotation_quaternion = Quaternion(local_axis, math.radians(degrees))


def main():
    source = FOLDER / 'lara_perfect.blend'
    bpy.ops.wm.open_mainfile(filepath=str(source))
    source_hash = hashlib.sha256(source.read_bytes()).hexdigest()
    arm = bpy.data.objects['Armature']
    meshes = [obj for obj in bpy.data.objects if obj.type == 'MESH']
    reset(arm)
    baseline = {obj.name: evaluated_vertices(obj) for obj in meshes}
    source_meshes = {obj.name: (len(obj.data.vertices), len(obj.data.polygons),
                              [mat.name for mat in obj.data.materials]) for obj in meshes}
    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.mode_set(mode='EDIT')
    bones = arm.data.edit_bones
    hips = bones['pelvis']
    hips.parent = bones['root_ground']
    hips.use_connect = False
    hips.tail = bones['spine_lower'].head
    hips.roll = 0.
    bones['spine_lower'].parent = hips
    bones.remove(bones['root_hips'])
    lower, upper = bones['spine_lower'], bones['spine_upper']
    middle = bones.new('spine_middle')
    middle.head = (lower.head + upper.head) / 2
    middle.tail = upper.head
    middle.roll = lower.roll
    middle.parent = lower
    lower.tail = middle.head
    upper.parent = middle
    shoulders = {}
    for side in ('Left', 'Right'):
        humerus = bones[BONES[side + 'Arm']]
        clavicle = bones.new(BONES[side + 'Shoulder'])
        neck = bones['head_neck_lower'].head
        # Sternoclavicular joint at torso centre, at the arm socket's height.
        clavicle.head = Vector((neck.x, neck.y, humerus.head.z))
        clavicle.tail = humerus.head
        clavicle.parent = upper
        clavicle.roll = humerus.roll
        humerus.parent = clavicle
        humerus.use_connect = False
        shoulders[side] = (clavicle.head.copy(), humerus.head.copy())
    bpy.ops.object.mode_set(mode='OBJECT')
    calibration = json.loads((ROOT / 'docs/lara-shoulder-calibration.json').read_text())
    for name, correction in calibration['corrections'].items():
        assert name in (BONES['LeftShoulder'], BONES['RightShoulder'])
        assert len(correction) == 4 and all(math.isfinite(v) for v in correction)
        assert abs(sum(v*v for v in correction) - 1.) < 1e-5
        arm.data.bones[name]['retargetShoulderCorrection'] = correction
    for obj in meshes:
        old_group = obj.vertex_groups.get('root_hips')
        hips_group = obj.vertex_groups['pelvis']
        for vertex in obj.data.vertices:
            weights = {g.group: g.weight for g in vertex.groups}
            if old_group and old_group.index in weights:
                hips_group.add([vertex.index], weights[old_group.index] + weights.get(hips_group.index, 0.), 'REPLACE')
        if old_group:
            obj.vertex_groups.remove(old_group)
    collection = bpy.data.collections.new('Lara · variantes conservées')
    bpy.context.scene.collection.children.link(collection)
    optional = {'bikini_bottom', 'bikini_top', 'body_bare_feet_clothed', 'body_legs_barefoot',
                'body_nude_feet', 'body_nude_hands', 'body_nude_legs', 'body_nude_panties',
                'body_nude_torso', 'hair_classic', 'hair_fmv', 'handgun_left', 'handgun_right'}
    changed = {}
    max_discarded_weight = 0.
    preserved_arm_vertices = 0
    for obj in meshes:
        for name in ('Spine1', 'LeftShoulder', 'RightShoulder'):
            obj.vertex_groups.new(name=BONES[name])
        names = {g.index: g.name for g in obj.vertex_groups}
        count = 0
        for vertex in obj.data.vertices:
            weights = {names[g.group]: g.weight for g in vertex.groups if g.weight > 0}
            original = dict(weights)
            point = arm.matrix_world.inverted() @ obj.matrix_world @ vertex.co
            lower_weight = weights.get('spine_lower', 0.)
            if lower_weight:
                t = smoothstep((point.z - arm.data.bones['spine_lower'].head_local.z) /
                               (arm.data.bones['spine_upper'].head_local.z - arm.data.bones['spine_lower'].head_local.z))
                weights['spine_lower'] = lower_weight * (1. - t)
                weights['spine_middle'] = lower_weight * t
            # Redistribute existing chest/humerus weights, without automatic rebind.
            side = 'Left' if point.x > arm.data.bones['head_neck_lower'].head_local.x else 'Right'
            inner, socket = shoulders[side]
            clavicle, chest = BONES[side + 'Shoulder'], 'spine_upper'
            lateral = smoothstep((point.x - inner.x) / (socket.x - inner.x))
            vertical = smoothstep((point.z - arm.data.bones[chest].head_local.z) /
                                  (socket.z - arm.data.bones[chest].head_local.z))
            chest_transfer = weights.get(chest, 0.) * lateral * vertical
            # The humerus already inherits the clavicle through its parent.
            # Preserve its authored shoulder-cap weights: moving those weights
            # to the clavicle freezes the cap when the arm lowers and uncovers
            # the axilla. Only redistribute the original chest contribution.
            if chest_transfer:
                weights[chest] = weights.get(chest, 0.) - chest_transfer
                weights[clavicle] = chest_transfer
            # Three.js GLTFLoader uses JOINTS_0/WEIGHTS_0: four influences.
            ordered = sorted(weights.items(), key=lambda item: item[1], reverse=True)
            max_discarded_weight = max(max_discarded_weight, sum(w for _, w in ordered[4:]))
            weights = dict(ordered[:4])
            total = sum(weights.values())
            assert total > 0 and math.isfinite(total), (obj.name, vertex.index, total)
            weights = {name: weight / total for name, weight in weights.items()}
            # Authored rigid upper-arm regions must still rotate with the arm,
            # rather than becoming rigid extensions of the clavicle.
            if len(original) == 1 and next(iter(original)) in (BONES['LeftArm'], BONES['RightArm']):
                assert weights.keys() == original.keys(), (obj.name, vertex.index, weights)
                preserved_arm_vertices += 1
            if weights != original:
                for group in obj.vertex_groups:
                    group.remove([vertex.index])
                for name, weight in weights.items():
                    if weight > 0:
                        obj.vertex_groups[name].add([vertex.index], weight, 'REPLACE')
                count += 1
            total = sum(g.weight for g in vertex.groups)
            assert math.isfinite(total) and abs(total - 1.) < 1e-4, (obj.name, vertex.index, total)
        changed[obj.name] = count
        # Match the linear skinning actually used by the GLB runtime.
        for mod in obj.modifiers:
            if mod.type == 'ARMATURE':
                mod.use_deform_preserve_volume = False
    reset(arm)
    rest_error = max((a - b).length for obj in meshes for a, b in zip(baseline[obj.name], evaluated_vertices(obj)))
    assert rest_error < 1e-5, f'Bind geometry changed by {rest_error} m'
    for obj in meshes:
        assert source_meshes[obj.name] == (len(obj.data.vertices), len(obj.data.polygons),
                                          [mat.name for mat in obj.data.materials])
        if obj.name in optional:
            for existing in list(obj.users_collection):
                existing.objects.unlink(obj)
            collection.objects.link(obj)
            obj.hide_set(True)
            obj.hide_render = True
    arm.show_in_front = True
    arm.hide_set(False)
    arm.hide_viewport = False
    arm.hide_render = False
    arm.hide_select = False
    arm.data.display_type = 'OCTAHEDRAL'
    tests = {
        'Test · bras levés': [('LeftShoulder', (0, 1, 0), -25), ('RightShoulder', (0, 1, 0), 25),
                             ('LeftArm', (0, 1, 0), -55), ('RightArm', (0, 1, 0), 55)],
        'Test · bras devant': [('LeftShoulder', (0, 0, 1), -15), ('RightShoulder', (0, 0, 1), 15),
                              ('LeftArm', (0, 0, 1), -70), ('RightArm', (0, 0, 1), 70)],
        'Test · torsion avant-bras': [('LeftForeArm', (1, 0, 0), 90), ('RightForeArm', (1, 0, 0), -90)],
        'Test · flexion dos': [('Spine', (1, 0, 0), 15), ('Spine1', (1, 0, 0), 15), ('Spine2', (1, 0, 0), 15)],
    }
    for name, rotations in tests.items():
        reset(arm)
        arm.animation_data_clear()
        action = bpy.data.actions.new(name)
        action.use_fake_user = True
        for frame, active in ((1, False), (31, True), (61, False)):
            reset(arm)
            if active:
                for bone_name, axis, angle in rotations:
                    rotate_world(arm, bone_name, axis, angle)
            for bone_name, _, _ in rotations:
                bone = arm.pose.bones[BONES[bone_name]]
                bone.rotation_mode = 'QUATERNION'
                arm.animation_data_create().action = action
                bone.keyframe_insert('rotation_quaternion', frame=frame, group=BONES[bone_name])
    arm.animation_data_clear()
    reset(arm)
    scene = bpy.context.scene
    scene.frame_start, scene.frame_end = 1, 61
    scene.render.fps = 30
    scene.render.fps_base = 1.
    scene['lara_mixamo_prototype'] = 'v1 — proportions Lara, retargeting requis'
    bpy.ops.file.pack_all()
    bpy.context.preferences.filepaths.save_version = 0
    bpy.ops.object.select_all(action='DESELECT')
    arm.select_set(True)
    bpy.context.view_layer.objects.active = arm
    for screen in bpy.data.screens:
        for area in screen.areas:
            if area.type == 'VIEW_3D':
                space = area.spaces.active
                space.region_3d.view_location = Vector((0, 0, .95))
                space.region_3d.view_distance = 2.8
                space.region_3d.view_rotation = Quaternion((1, 0, 0), math.pi / 2)
                space.clip_end = 100
                space.shading.type = 'MATERIAL'
    bpy.ops.wm.save_as_mainfile(filepath=str(FOLDER / 'lara_mixamo_prototype.blend'))
    # Include every variant; selection isolates later preview objects.
    for obj in meshes:
        obj.hide_set(False)
        obj.select_set(True)
    assert arm in bpy.context.selected_objects, 'Armature must be selected for skinned GLB export'
    bpy.ops.export_scene.gltf(filepath=str(FOLDER / 'lara_mixamo_prototype.glb'),
        export_format='GLB', use_selection=True, export_apply=False, export_skins=True,
        export_morph=True, export_animations=False, export_yup=True, export_extras=True,
        export_all_influences=False)
    document = glb_document()
    for name, correction in calibration['corrections'].items():
        node = next(node for node in document['nodes'] if node.get('name') == name)
        assert node['extras']['retargetShoulderCorrection'] == correction, node
    assert len(document['skins']) == 1, 'Prototype export lost its armature'
    assert len(document['skins'][0]['joints']) == len(arm.data.bones)
    report = {'source_sha256': source_hash, 'bone_count': len(arm.data.bones),
              'bone_naming': 'lara',
              'mesh_count': len(meshes), 'max_bind_position_error_m': rest_error,
              'max_discarded_weight_for_four_influences': max_discarded_weight,
              'preserved_rigid_upper_arm_vertices': preserved_arm_vertices,
              'shoulder_calibration': calibration,
              'reweighted_vertices': changed, 'diagnostic_actions': list(tests),
              'note': 'Prototype: deformation review required; not the active application asset.'}
    (ROOT / 'docs/lara-mixamo-prototype-report.json').write_text(json.dumps(report, indent=2, ensure_ascii=False) + '\n')
    print(json.dumps(report, indent=2, ensure_ascii=False), flush=True)


def bake_runtime():
    """Bring the real application's retargeted mocap into Blender, in metres."""
    output = FOLDER / 'lara_mixamo_prototype.blend'
    bpy.ops.wm.open_mainfile(filepath=str(output))
    arm = bpy.data.objects['Armature']
    data = json.loads(Path('/tmp/lara-mixamo-poses.json').read_text())
    for action in list(bpy.data.actions):
        if action.name.startswith('Mixamo · '):
            bpy.data.actions.remove(action, do_unlink=True)
    conversion = Matrix.Rotation(math.pi / 2, 4, 'X')
    def matrix(elements):
        return conversion @ Matrix([elements[i:i+4] for i in range(0,16,4)]).transposed()
    rest_error = max(abs(matrix(elements)[i][j] - arm.data.bones[name].matrix_local[i][j])
                     for name,elements in data['rest'].items() for i in range(4) for j in range(4))
    assert rest_error < 1e-5, f'Runtime/Blender bind matrix mismatch: {rest_error}'
    actions = []
    max_pose_error = 0.
    for clip_name, clip in data['clips'].items():
        arm.animation_data_clear()
        reset(arm)
        action = bpy.data.actions.new('Mixamo · ' + clip_name.removeprefix('anim_'))
        action.use_fake_user = True
        arm.animation_data_create().action = action
        for sample in clip['frames']:
            desired = {name:matrix(elements) for name,elements in sample['bones'].items()}
            frame = 1 + sample['time'] * clip['fps']
            for name, target_matrix in desired.items():
                bone = arm.pose.bones[name]
                bone.rotation_mode = 'QUATERNION'
                parent = bone.parent
                parent_pose = desired[parent.name] if parent and parent.name in desired else parent.bone.matrix_local if parent else Matrix.Identity(4)
                bone.matrix_basis = bone.bone.convert_local_to_pose(target_matrix, bone.bone.matrix_local,
                    parent_matrix=parent_pose, parent_matrix_local=parent.bone.matrix_local if parent else Matrix.Identity(4), invert=True)
                for prop in ('location','rotation_quaternion','scale'):
                    bone.keyframe_insert(prop, frame=frame, group=name)
        for layer in action.layers:
            for strip in layer.strips:
                for slot in action.slots:
                    for curve in strip.channelbag(slot).fcurves:
                        for key in curve.keyframe_points:
                            key.interpolation = 'LINEAR'
        for index in (len(clip['frames'])//4, len(clip['frames'])//2, len(clip['frames'])*3//4):
            sample = clip['frames'][index]
            bpy.context.scene.frame_set(index+1)
            bpy.context.view_layer.update()
            max_pose_error = max(max_pose_error,
                max(abs(arm.pose.bones[name].matrix[i][j] - matrix(elements)[i][j])
                    for name,elements in sample['bones'].items() for i in range(4) for j in range(4)))
        actions.append(action.name)
    assert max_pose_error < 1e-4, f'Baked animation differs from runtime: {max_pose_error}'
    arm.animation_data_clear()
    reset(arm)
    # Open in rest pose. The Action Editor exposes both mocap and stress poses.
    scene = bpy.context.scene
    scene.frame_set(1)
    scene.render.fps = 30
    scene.render.fps_base = 1.
    scene.frame_end = max(len(clip['frames']) for clip in data['clips'].values())
    bpy.context.preferences.filepaths.save_version = 0
    bpy.ops.wm.save_as_mainfile(filepath=str(output))
    report_path = ROOT / 'docs/lara-mixamo-prototype-report.json'
    report = json.loads(report_path.read_text())
    report['runtime_bind_matrix_max_error'] = rest_error
    report['baked_pose_matrix_max_error'] = max_pose_error
    report['baked_mixamo_actions'] = actions
    report['runtime_samples_checked'] = len(json.loads(Path('/tmp/lara-mixamo-runtime.json').read_text())['reports'])
    report_path.write_text(json.dumps(report, indent=2, ensure_ascii=False) + '\n')
    print('Baked runtime actions:', actions, 'bind matrix error:', rest_error, flush=True)


def verify_saved():
    bpy.ops.wm.open_mainfile(filepath=str(FOLDER / 'lara_mixamo_prototype.blend'))
    arm = bpy.data.objects['Armature']
    report = json.loads((ROOT / 'docs/lara-mixamo-prototype-report.json').read_text())
    assert len(arm.data.bones) == report['bone_count']
    assert all(name in arm.data.bones for name in BONES.values())
    assert all('mixamo' not in bone.name.lower() for bone in arm.data.bones)
    assert all('mixamo' not in group.name.lower() for obj in bpy.data.objects if obj.type == 'MESH' for group in obj.vertex_groups)
    assert all('mixamo' not in node.get('name', '').lower() for node in glb_document()['nodes'])
    assert len([obj for obj in bpy.data.objects if obj.type == 'MESH']) == report['mesh_count']
    assert all(name in bpy.data.actions for name in report['diagnostic_actions'] + report['baked_mixamo_actions'])
    assert all(image.packed_file for image in bpy.data.images if image.type == 'IMAGE' and image.source == 'FILE'), 'Unpacked texture'
    assert hashlib.sha256((FOLDER / 'lara_perfect.blend').read_bytes()).hexdigest() == report['source_sha256'], 'Source changed'
    assert len(glb_document()['skins'][0]['joints']) == len(arm.data.bones)
    for name, correction in report['shoulder_calibration']['corrections'].items():
        assert list(arm.data.bones[name]['retargetShoulderCorrection']) == correction
    print(f'Verified saved prototype: 34 meshes, 92 bones, {len(bpy.data.actions)} actions, packed textures, source unchanged.', flush=True)


def inspect_shoulders():
    import bmesh
    from collections import Counter
    from mathutils.kdtree import KDTree
    for filename in ('lara_perfect.blend', 'lara_mixamo_prototype.blend'):
        bpy.ops.wm.open_mainfile(filepath=str(FOLDER / filename))
        arm = bpy.data.objects['Armature']
        chest_z = arm.data.bones['spine_upper'].head_local.z
        print('FILE', filename, flush=True)
        selected = {}
        for name in ('arms', 'body_torso', 'body_nude_torso', 'shirt'):
            obj = bpy.data.objects[name]
            edges = Counter(tuple(sorted(edge)) for face in obj.data.polygons for edge in face.edge_keys)
            boundary = {index for edge, count in edges.items() if count == 1 for index in edge}
            vertices = [v for v in obj.data.vertices if v.co.z > chest_z and
                        abs(v.co.x) < abs(arm.data.bones['arm_left_elbow'].head_local.x)]
            selected[name] = vertices
            print('MESH', name, 'boundary', len(boundary), 'shoulder vertices', len(vertices),
                  'materials', [mat.name for mat in obj.data.materials], flush=True)
            bm = bmesh.new()
            bm.from_mesh(obj.data)
            bmesh.ops.remove_doubles(bm, verts=list(bm.verts), dist=1e-6)
            remaining = {v for edge in bm.edges if edge.is_boundary for v in edge.verts}
            while remaining:
                component, queue = set(), [remaining.pop()]
                while queue:
                    vertex = queue.pop()
                    component.add(vertex)
                    for edge in vertex.link_edges:
                        other = edge.other_vert(vertex)
                        if edge.is_boundary and other in remaining:
                            remaining.remove(other)
                            queue.append(other)
                coords = [v.co.copy() for v in component]
                if max(p.z for p in coords) > chest_z:
                    print('LOOP', name, len(coords), 'bounds',
                          [(min(p[i] for p in coords), max(p[i] for p in coords)) for i in range(3)],
                          'coords', [tuple(p) for p in sorted(coords, key=lambda p:(p.x,p.z,p.y))], flush=True)
            bm.free()
        for target_name in ('body_torso', 'body_nude_torso', 'shirt'):
            target = bpy.data.objects[target_name]
            arms = bpy.data.objects['arms']
            tree = KDTree(len(selected[target_name]))
            for vertex in selected[target_name]:
                tree.insert(target.matrix_world @ vertex.co, vertex.index)
            tree.balance()
            pairs = []
            for vertex in selected['arms']:
                point, index, distance = tree.find(arms.matrix_world @ vertex.co)
                if distance < 1e-5:
                    def weights(obj, vertex):
                        return {obj.vertex_groups[g.group].name:round(g.weight,6) for g in vertex.groups if g.weight > 0}
                    pairs.append({'arms_index':vertex.index, 'target_index':index, 'distance':distance,
                                  'point':list(point), 'arms':weights(arms, vertex),
                                  'target':weights(target, target.data.vertices[index])})
            print('COINCIDENT', target_name, len(pairs), json.dumps(pairs), flush=True)


if __name__ == '__main__':
    if '--inspect-shoulders' in sys.argv:
        inspect_shoulders()
    elif '--inspect-glb' in sys.argv:
        doc = glb_document()
        print('SKINS', len(doc.get('skins', [])), 'NODES', [node.get('name') for node in doc['nodes']], flush=True)
    elif '--verify' in sys.argv:
        verify_saved()
    elif '--bake-runtime' in sys.argv:
        bake_runtime()
    else:
        main()
