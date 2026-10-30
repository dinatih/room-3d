"""Convert Ulotte's original FBX archive to an animated, textured GLB.

blender -b -noaudio -t 2 --python scripts/import-ulotte.py -- /path/to/dashshund-dog.zip
"""
import json
import sys
import tempfile
import zipfile
from pathlib import Path

import bpy

archive_path = Path(sys.argv[sys.argv.index('--') + 1])
output = Path(__file__).resolve().parents[1] / 'public/characters/ulotte/ulotte.glb'
with tempfile.TemporaryDirectory(prefix='room-ulotte-') as directory:
    root = Path(directory)
    with zipfile.ZipFile(archive_path) as archive:
        archive.extractall(root)
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.fbx(filepath=str(root / 'source/Dashshund.fbx'))
    rig = bpy.data.objects['Armature']
    rig.animation_data.action = bpy.data.actions['Armature|Armature|Idle_1']
    bpy.context.scene.frame_set(1)
    for image in bpy.data.images:
        image.filepath = str(root / 'textures' / ('Dash_Specular.png' if image.name == 'Dash_Specular' else image.name))
        image.reload()
    for material in bpy.data.materials:
        nodes = material.node_tree.nodes
        shader = next(node for node in nodes if node.type == 'BSDF_PRINCIPLED')
        shader.inputs['Metallic'].default_value = 0
        shader.inputs['Roughness'].default_value = 0.8
        shader.inputs['Alpha'].default_value = 1
        texture = nodes.new('ShaderNodeTexImage')
        texture.image = bpy.data.images['Dach_Diff.png']
        material.node_tree.links.new(texture.outputs['Color'], shader.inputs['Base Color'])

    # Shift cyclic animations so frame 7 becomes frame 1 without freeze
    def shift_action(action, offset_frames, end_frame):
        for layer in action.layers:
            for strip in layer.strips:
                for cb in strip.channelbags:
                    for fc in cb.fcurves:
                        for kp in fc.keyframe_points:
                            kp.co[0] -= offset_frames
                            kp.handle_left[0] -= offset_frames
                            kp.handle_right[0] -= offset_frames
        action.use_frame_range = True
        action.frame_start = 1
        action.frame_end = end_frame

    # Walk cycle: frames 7..31 in FBX -> 24 frames (1..24)
    shift_action(bpy.data.actions['Armature|Armature|Walk'], 6, 24)
    # Run cycle: frames 7..23 in FBX -> 16 frames (1..16)
    shift_action(bpy.data.actions['Armature|Armature|Run'], 6, 16)

    # Jump: blend frames 22..27 smoothly back to frame 1 to eliminate loop jump/freeze
    jump = bpy.data.actions['Armature|Armature|Jump']
    rig.animation_data.action = jump
    bpy.context.scene.frame_set(1)
    p1 = {pb.name: (pb.location.copy(), pb.rotation_quaternion.copy(), pb.scale.copy()) for pb in rig.pose.bones}
    bpy.context.scene.frame_set(21)
    p21 = {pb.name: (pb.location.copy(), pb.rotation_quaternion.copy(), pb.scale.copy()) for pb in rig.pose.bones}
    blend_steps = 6
    for step in range(1, blend_steps + 1):
        f = 21 + step
        t = step / blend_steps
        alpha = t * t * (3 - 2 * t)
        bpy.context.scene.frame_set(f)
        for pb in rig.pose.bones:
            pb.location = p21[pb.name][0].lerp(p1[pb.name][0], alpha)
            pb.rotation_quaternion = p21[pb.name][1].slerp(p1[pb.name][1], alpha)
            pb.scale = p21[pb.name][2].lerp(p1[pb.name][2], alpha)
            pb.keyframe_insert(data_path="location", frame=f)
            pb.keyframe_insert(data_path="rotation_quaternion", frame=f)
            pb.keyframe_insert(data_path="scale", frame=f)
    jump.use_frame_range = True
    jump.frame_start = 1
    jump.frame_end = 21 + blend_steps

    for action in list(bpy.data.actions):
        name = action.name.split('|')[-1]
        if name == 'PoseLib':
            bpy.data.actions.remove(action)
        else:
            action.name = name.lower().replace('_', '-')

    # The FBX has no jaw bone: the Head bone tip supplies the muzzle direction.
    bpy.context.view_layer.objects.active = rig
    bpy.ops.object.mode_set(mode='EDIT')
    head = rig.data.edit_bones['Head']
    muzzle = rig.data.edit_bones.new('Muzzle')
    muzzle.head = head.tail
    muzzle.tail = head.tail + (head.tail - head.head).normalized() * 0.1
    muzzle.parent = head
    bpy.ops.object.mode_set(mode='OBJECT')

    # Unparent Dog mesh and apply transforms so its local vertices match world coordinates,
    # preventing double Armature transformations in glTF viewers (F3D / VTK)
    dog = bpy.data.objects['Dog']
    bpy.ops.object.select_all(action='DESELECT')
    dog.select_set(True)
    bpy.context.view_layer.objects.active = dog
    bpy.ops.object.parent_clear(type='CLEAR_KEEP_TRANSFORM')
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

    raw_glb = root / 'raw.glb'
    bpy.ops.export_scene.gltf(filepath=str(raw_glb), export_format='GLB',
                              export_animation_mode='ACTIONS', export_force_sampling=True)

    # Post-process GLB to center on X/Z and ground lowest paws at Y=0 directly at origin
    with open(raw_glb, 'rb') as f:
        glb_bytes = f.read()
    json_len = int.from_bytes(glb_bytes[12:16], 'little')
    json_data = json.loads(glb_bytes[20:20 + json_len].decode('utf-8'))
    bin_chunk = glb_bytes[20 + json_len:]

    root_idx = len(json_data['nodes'])
    json_data['nodes'].append({
        'name': 'UlotteOriginRoot',
        'translation': [-0.001476, -0.2138997, 0.300009],
        'children': list(json_data['scenes'][0]['nodes'])
    })
    json_data['scenes'][0]['nodes'] = [root_idx]

    new_json_bytes = json.dumps(json_data).encode('utf-8')
    pad = (4 - (len(new_json_bytes) % 4)) % 4
    new_json_bytes += b' ' * pad

    total_len = 12 + 8 + len(new_json_bytes) + len(bin_chunk)
    output.parent.mkdir(parents=True, exist_ok=True)
    with open(output, 'wb') as f:
        f.write(glb_bytes[:8])
        f.write(total_len.to_bytes(4, 'little'))
        f.write(len(new_json_bytes).to_bytes(4, 'little'))
        f.write(b'JSON')
        f.write(new_json_bytes)
        f.write(bin_chunk)

    print(f'Exported {output}', flush=True)
