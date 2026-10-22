"""Keep the official H2 motor chain; store a humanoid reference for motion conversion."""
import bpy
from math import pi
from mathutils import Matrix, Vector


def character_rig(rig, joints):
    bpy.context.view_layer.update()
    original = {node: node.matrix_world.copy() for node in rig.values()}
    meshes = {o: (o.parent, o.matrix_world.copy()) for o in bpy.context.scene.objects if o.type == 'MESH'}
    points = [world @ Vector(v) for mesh, (_, world) in meshes.items() for v in mesh.bound_box]
    lo = Vector(tuple(min(p[i] for p in points) for i in range(3)))
    hi = Vector(tuple(max(p[i] for p in points) for i in range(3)))
    ground = Matrix.Translation((-(lo.x + hi.x) / 2, -(lo.y + hi.y) / 2, -lo.z))
    canonical = Matrix.Rotation(-pi / 2, 4, 'Z') @ ground
    north = Matrix.Rotation(pi / 2, 4, 'Z') @ ground
    yup = Matrix.Rotation(-pi / 2, 4, 'X')

    def align(node, direction, target):
        point = node.matrix_world.translation.copy()
        rotation = direction.normalized().rotation_difference(target.normalized()).to_matrix().to_4x4()
        node.matrix_world = Matrix.Translation(point) @ rotation @ Matrix.Translation(-point) @ node.matrix_world
        bpy.context.view_layer.update()

    # A reference T-pose is used only while converting human animations, never as the robot rig.
    for side, sign in [('left', 1), ('right', -1)]:
        shoulder, elbow, wrist = [rig[f'{side}_{part}_link'] for part in ['shoulder_pitch', 'elbow', 'wrist_yaw']]
        align(elbow, wrist.matrix_world.translation - elbow.matrix_world.translation,
              elbow.matrix_world.translation - shoulder.matrix_world.translation)
        align(shoulder, elbow.matrix_world.translation - shoulder.matrix_world.translation, Vector((0, sign, 0)))
    mapping = {'pelvis': 'Hips', 'waist_yaw_link': 'Spine', 'waist_roll_link': 'Spine1',
               'torso_link': 'Spine2', 'head_pitch_link': 'Neck', 'head_yaw_link': 'Head'}
    for side in ['left', 'right']:
        for link, bone in [('hip_yaw', 'UpLeg'), ('knee', 'Leg'), ('ankle_pitch', 'Foot'),
                           ('shoulder_yaw', 'Arm'), ('elbow', 'ForeArm'), ('wrist_yaw', 'Hand')]:
            mapping[f'{side}_{link}_link'] = side.title() + bone
    posed = {name: canonical @ rig[link].matrix_world for link, name in mapping.items()}
    parents = {'Spine': 'Hips', 'Spine1': 'Spine', 'Spine2': 'Spine1', 'Neck': 'Spine2', 'Head': 'Neck'}
    for side in ['Left', 'Right']:
        parents.update({side + 'UpLeg': 'Hips', side + 'Leg': side + 'UpLeg', side + 'Foot': side + 'Leg',
                        side + 'Arm': 'Spine2', side + 'ForeArm': side + 'Arm', side + 'Hand': side + 'ForeArm'})

    def new_armature():
        armature = bpy.data.armatures.new('H2')
        skeleton = bpy.data.objects.new('H2', armature)
        bpy.context.collection.objects.link(skeleton)
        bpy.context.view_layer.objects.active = skeleton
        skeleton.select_set(True)
        bpy.ops.object.mode_set(mode='EDIT')
        return skeleton, armature

    reference, data = new_armature()
    bones = {}
    for name, matrix in posed.items():
        bone = data.edit_bones.new('mixamorig' + name)
        bone.head = matrix.translation
        children = [child for child, parent in parents.items() if parent == name]
        end = 'Spine' if name == 'Hips' else 'Neck' if name == 'Spine2' else children[0] if children else None
        bone.tail = posed[end].translation if end else bone.head + (bone.head - posed[parents[name]].translation).normalized()
        bones[name] = bone
    for name, parent in parents.items():
        bones[name].parent = bones[parent]
    bpy.ops.object.mode_set(mode='OBJECT')

    def serialize(bone):
        local = bone.parent.matrix_local.inverted() @ bone.matrix_local if bone.parent else bone.matrix_local
        # glTF keeps Blender bone-local coordinates; only the armature root changes basis.
        position, quaternion, scale = (local if bone.parent else yup @ local).decompose()
        return {'name': bone.name, 'bone': True, 'position': list(position),
                'quaternion': [quaternion.x, quaternion.y, quaternion.z, quaternion.w], 'scale': list(scale),
                'children': [serialize(child) for child in bone.children]}
    driver = {'name': '', 'bone': False, 'position': [0, 0, 0], 'quaternion': [0, 0, 0, 1],
              'scale': [1, 1, 1], 'children': [serialize(data.bones['mixamorigHips'])]}
    bpy.data.objects.remove(reference, do_unlink=True)

    skeleton, data = new_armature()
    for node, world in original.items():
        world = world.copy()
        # Moving a pivot along its own shaft leaves the axis line and all rotations unchanged.
        link = next(link for link, candidate in rig.items() if candidate == node)
        joint = joints.get(link)
        if mapping.get(link) in ('Spine2', 'Neck'):
            axis = world.to_quaternion() @ Vector(tuple(map(float, joint.find('axis').get('xyz').split())))
            world.translation -= axis * (world.translation.y / axis.y)
        bone = data.edit_bones.new(node.name)
        bone.head = (north @ world).translation
        bone.tail = (north @ world) @ Vector((0, 1, 0))
        bone.matrix = north @ world
    for node in original:
        if node.parent in original:
            data.edit_bones[node.name].parent = data.edit_bones[node.parent.name]
    bpy.ops.object.mode_set(mode='OBJECT')
    skeleton['h2MotionDriver'] = driver
    for link, node in rig.items():
        bone = data.bones[node.name]
        if link in mapping:
            semantic = mapping[link]
            bone['humanoidBone'] = semantic
            q = (yup @ posed[semantic]).to_quaternion()
            bone['motionRestWorld'] = [q.x, q.y, q.z, q.w]
            if semantic in ('LeftFoot', 'RightFoot'):
                mesh = next(mesh for mesh, (parent, _) in meshes.items() if parent == node)
                local = original[node].inverted() @ meshes[mesh][1]
                bone['footBounds'] = [list(local @ Vector(v)) for v in mesh.bound_box]
            if semantic == 'Head':
                bone['lookForward'] = [1, 0, 0]
                bone['lookUp'] = [0, 0, 1]
        joint = joints.get(link)
        if joint is not None and joint.get('type') == 'revolute':
            limit = joint.find('limit')
            bone['robotJoint'] = {'axis': list(map(float, joint.find('axis').get('xyz').split())),
                                  'lower': float(limit.get('lower')), 'upper': float(limit.get('upper'))}
    for mesh, (parent, world) in meshes.items():
        mesh.parent = None
        mesh.data.transform(north @ world)
        mesh.matrix_world = Matrix.Identity(4)
        group = mesh.vertex_groups.new(name=parent.name)
        group.add(list(range(len(mesh.data.vertices))), 1, 'REPLACE')
        modifier = mesh.modifiers.new('Rigid motor linkage', 'ARMATURE')
        modifier.object = skeleton
        mesh.parent = skeleton
    for node in original:
        bpy.data.objects.remove(node, do_unlink=True)
