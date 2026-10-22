"""Rigid humanoid skin for the official H2 meshes; executed by import-unitree.py."""
import bpy
from mathutils import Matrix, Vector


def character_rig(rig):
    # Straighten each mechanical arm into the standard humanoid T-pose.
    def align(node, direction, target):
        bpy.context.view_layer.update()
        point = node.matrix_world.translation.copy()
        rotation = direction.normalized().rotation_difference(target.normalized()).to_matrix().to_4x4()
        node.matrix_world = Matrix.Translation(point) @ rotation @ Matrix.Translation(-point) @ node.matrix_world
        bpy.context.view_layer.update()

    for side, sign in [('left', 1), ('right', -1)]:
        shoulder = rig[f'{side}_shoulder_pitch_link']
        elbow = rig[f'{side}_elbow_link']
        wrist = rig[f'{side}_wrist_yaw_link']
        align(elbow, wrist.matrix_world.translation - elbow.matrix_world.translation,
              elbow.matrix_world.translation - shoulder.matrix_world.translation)
        align(shoulder, elbow.matrix_world.translation - shoulder.matrix_world.translation, Vector((0, sign, 0)))

    mapping = {'pelvis': 'Hips', 'waist_yaw_link': 'Spine', 'waist_roll_link': 'Spine1',
               'torso_link': 'Spine2', 'head_pitch_link': 'Neck', 'head_yaw_link': 'Head'}
    for side in ['left', 'right']:
        for link, bone in [('hip_pitch', 'UpLeg'), ('knee', 'Leg'), ('ankle_pitch', 'Foot'),
                           ('shoulder_pitch', 'Arm'), ('elbow', 'ForeArm'), ('wrist_yaw', 'Hand')]:
            mapping[f'{side}_{link}_link'] = side.title() + bone
    node_bones = {rig[link]: bone for link, bone in mapping.items()}
    meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH']
    owners = {}
    for mesh in meshes:
        parent = mesh.parent
        while parent not in node_bones:
            parent = parent.parent
            if parent is None:
                raise ValueError(f'No anatomical owner for {mesh.name}')
        owners[mesh] = node_bones[parent]
        world = mesh.matrix_world.copy()
        mesh.parent = None
        mesh.data.transform(world)
        mesh.matrix_world = Matrix.Identity(4)

    armature = bpy.data.armatures.new('H2 humanoid')
    skeleton = bpy.data.objects.new('H2', armature)
    bpy.context.collection.objects.link(skeleton)
    bpy.context.view_layer.objects.active = skeleton
    skeleton.select_set(True)
    bpy.ops.object.mode_set(mode='EDIT')
    bones = {}
    for link, name in mapping.items():
        bone = armature.edit_bones.new('mixamorig:' + name)
        bone.head = rig[link].matrix_world.translation
        bones[name] = bone
    parents = {'Spine': 'Hips', 'Spine1': 'Spine', 'Spine2': 'Spine1', 'Neck': 'Spine2', 'Head': 'Neck'}
    for side in ['Left', 'Right']:
        parents.update({side + 'UpLeg': 'Hips', side + 'Leg': side + 'UpLeg', side + 'Foot': side + 'Leg',
                        side + 'Arm': 'Spine2', side + 'ForeArm': side + 'Arm', side + 'Hand': side + 'ForeArm'})
    for name, bone in bones.items():
        if name in parents:
            bone.parent = bones[parents[name]]
        children = [child for child, parent in parents.items() if parent == name]
        if name == 'Hips':
            bone.tail = bones['Spine'].head
        elif name == 'Spine2':
            bone.tail = bones['Neck'].head
        elif children:
            bone.tail = bones[children[0]].head
        else:
            bone.tail = bone.head + (bone.head - bone.parent.head).normalized() * 0.1
    bpy.ops.object.mode_set(mode='OBJECT')
    for mesh, name in owners.items():
        group = mesh.vertex_groups.new(name='mixamorig:' + name)
        group.add(list(range(len(mesh.data.vertices))), 1, 'REPLACE')
        modifier = mesh.modifiers.new('Rigid humanoid skin', 'ARMATURE')
        modifier.object = skeleton
        mesh.parent = skeleton
    for node in list(rig.values()):
        bpy.data.objects.remove(node, do_unlink=True)
